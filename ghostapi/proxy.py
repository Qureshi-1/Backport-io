import httpx
import json
from fastapi import Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from urllib.parse import urlparse, urlencode
import time
from datetime import datetime, timezone

from .config import config
from .database import get_db
from .models import RequestLog


class ProxyEngine:
    def __init__(self, target_url: str):
        parsed = urlparse(target_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError(f"Invalid target URL: {target_url}")
        self.target_url = target_url.rstrip("/")
        self.client = httpx.AsyncClient(
            base_url=self.target_url,
            timeout=httpx.Timeout(connect=30.0, read=60.0, write=30.0, pool=30.0),
            follow_redirects=True,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        )

    def _build_target_path(self, request: Request) -> str:
        path = request.url.path
        if request.url.query:
            path = f"{path}?{request.url.query}"
        return path

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        if request.client:
            return request.client.host
        return "unknown"

    def _extract_headers_for_storage(self, request: Request) -> str:
        headers_to_store = {}
        skip = {"host", "content-length", "transfer-encoding", "connection", "x-ghostapi-key"}
        for key, value in request.headers.items():
            if key.lower() not in skip:
                headers_to_store[key] = value
        try:
            return json.dumps(headers_to_store)
        except Exception:
            return "{}"

    def _extract_query_params(self, request: Request) -> str:
        if request.url.query:
            return request.url.query
        return ""

    def _extract_body_for_storage(self, body: bytes) -> str:
        if not body:
            return ""
        try:
            decoded = body.decode("utf-8", errors="replace")
            if len(decoded) > 65536:
                decoded = decoded[:65536]
            return decoded
        except Exception:
            return ""

    async def forward(self, request: Request) -> Response:
        db = get_db()
        path = self._build_target_path(request)
        client_ip = self._get_client_ip(request)
        method = request.method

        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("content-length", None)
        ghost_key = headers.pop("x-ghostapi-key", None)

        body = await request.body()

        stored_headers = self._extract_headers_for_storage(request)
        stored_query = self._extract_query_params(request)
        stored_body = self._extract_body_for_storage(body)

        start_time = time.time()
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

        try:
            target_req = self.client.build_request(
                method=method,
                url=path,
                headers=headers,
                content=body,
            )
            response = await self.client.send(target_req, stream=True)

            status_code = response.status_code
            latency = (time.time() - start_time) * 1000

            response_headers = dict(response.headers)
            response_headers.pop("transfer-encoding", None)
            response_headers.pop("content-encoding", None)

            content_length = response.headers.get("content-length")
            estimated_size = int(content_length) if content_length else 0

            async def stream_response():
                nonlocal estimated_size
                total_bytes = 0
                try:
                    async for chunk in response.aiter_bytes():
                        total_bytes += len(chunk)
                        yield chunk
                finally:
                    await response.aclose()
                    estimated_size = total_bytes

            log = RequestLog(
                method=method,
                path=path,
                status_code=status_code,
                latency=round(latency, 2),
                ip=client_ip,
                timestamp=timestamp,
                response_size=estimated_size,
                headers=stored_headers,
                query_params=stored_query,
                request_body=stored_body,
            )

            try:
                db.insert_request_log(log)
            except Exception:
                pass

            return StreamingResponse(
                stream_response(),
                status_code=status_code,
                headers=response_headers,
            )

        except httpx.TimeoutException:
            latency = (time.time() - start_time) * 1000
            log = RequestLog(
                method=method,
                path=path,
                status_code=504,
                latency=round(latency, 2),
                ip=client_ip,
                timestamp=timestamp,
                response_size=0,
                headers=stored_headers,
                query_params=stored_query,
                request_body=stored_body,
            )
            try:
                db.insert_request_log(log)
            except Exception:
                pass
            return JSONResponse(
                content={"error": "Gateway Timeout: upstream server did not respond"},
                status_code=504,
            )

        except httpx.ConnectError:
            latency = (time.time() - start_time) * 1000
            log = RequestLog(
                method=method,
                path=path,
                status_code=502,
                latency=round(latency, 2),
                ip=client_ip,
                timestamp=timestamp,
                response_size=0,
                headers=stored_headers,
                query_params=stored_query,
                request_body=stored_body,
            )
            try:
                db.insert_request_log(log)
            except Exception:
                pass
            return JSONResponse(
                content={"error": "Bad Gateway: could not connect to upstream server"},
                status_code=502,
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            log = RequestLog(
                method=method,
                path=path,
                status_code=500,
                latency=round(latency, 2),
                ip=client_ip,
                timestamp=timestamp,
                response_size=0,
                headers=stored_headers,
                query_params=stored_query,
                request_body=stored_body,
            )
            try:
                db.insert_request_log(log)
            except Exception:
                pass
            return JSONResponse(
                content={"error": f"Internal Proxy Error: {str(e)}"},
                status_code=500,
            )

    async def replay_request(self, log: RequestLog) -> dict:
        headers = {}
        try:
            stored = json.loads(log.headers) if log.headers else {}
            headers = dict(stored)
        except (json.JSONDecodeError, TypeError):
            pass

        url = log.path
        if log.query_params:
            url = f"{url.split('?')[0]}?{log.query_params}"

        body = None
        if log.request_body and log.method.upper() in ("POST", "PUT", "PATCH"):
            body = log.request_body.encode("utf-8", errors="replace")

        start_time = time.time()
        try:
            target_req = self.client.build_request(
                method=log.method,
                url=url,
                headers=headers,
                content=body,
            )
            response = await self.client.send(target_req)
            latency = (time.time() - start_time) * 1000
            response_body = response.text

            try:
                parsed_body = json.loads(response_body)
            except (json.JSONDecodeError, ValueError):
                parsed_body = response_body

            return {
                "status_code": response.status_code,
                "latency_ms": round(latency, 2),
                "response": parsed_body,
                "headers": dict(response.headers),
            }
        except httpx.TimeoutException:
            latency = (time.time() - start_time) * 1000
            return {
                "status_code": 504,
                "latency_ms": round(latency, 2),
                "response": {"error": "Gateway Timeout: upstream server did not respond"},
                "headers": {},
            }
        except httpx.ConnectError:
            latency = (time.time() - start_time) * 1000
            return {
                "status_code": 502,
                "latency_ms": round(latency, 2),
                "response": {"error": "Bad Gateway: could not connect to upstream server"},
                "headers": {},
            }
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return {
                "status_code": 500,
                "latency_ms": round(latency, 2),
                "response": {"error": f"Replay Error: {str(e)}"},
                "headers": {},
            }

    async def close(self):
        await self.client.aclose()
