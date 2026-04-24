import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backport-io.onrender.com";

// Allowed API path prefixes — blocks access to internal/admin-only routes
const ALLOWED_PATH_PREFIXES = [
  "/api/auth/",
  "/api/billing/",
  "/api/proxy/",
  "/api/user/",
  "/api/endpoints/",
  "/api/api-keys/",
  "/api/waf/",
  "/api/transforms/",
  "/api/mocks/",
  "/api/analytics/",
  "/api/monitoring/",
  "/api/webhooks/",
  "/api/teams/",
  "/api/docs/",
  "/api/integrations/",
  "/api/contact/",
  "/health",
  "/",
];

// Block private/internal IP ranges (SSRF protection)
function isPrivateIP(hostname: string): boolean {
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,      // AWS metadata
    /^0\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];
  return privatePatterns.some(p => p.test(hostname));
}

// Block dangerous hostnames
const BLOCKED_HOSTNAMES = [
  "localhost", "metadata.google.internal", "metadata",
  "169.254.169.254", "100.100.100.200",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

const FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://backport.in";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-Key",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

async function proxyRequest(
  req: NextRequest,
  params: { path: string[] }
) {
  const path = params.path.join("/");

  // ─── SSRF Protection: Validate backend URL ─────────────────────────────────
  try {
    const backendUrlObj = new URL(BACKEND_URL);
    const hostname = backendUrlObj.hostname;

    if (BLOCKED_HOSTNAMES.includes(hostname.toLowerCase()) || isPrivateIP(hostname)) {
      console.error("[Proxy Blocked] Backend URL points to private/internal host:", hostname);
      return NextResponse.json(
        { detail: "Invalid backend configuration." },
        { status: 502 }
      );
    }

    if (!["http:", "https:"].includes(backendUrlObj.protocol)) {
      console.error("[Proxy Blocked] Invalid backend protocol:", backendUrlObj.protocol);
      return NextResponse.json(
        { detail: "Invalid backend configuration." },
        { status: 502 }
      );
    }
  } catch {
    console.error("[Proxy Blocked] Invalid BACKEND_URL:", BACKEND_URL);
    return NextResponse.json(
      { detail: "Backend configuration error." },
      { status: 502 }
    );
  }

  // ─── Path Validation ───────────────────────────────────────────────────────
  const fullPath = `/${path}`;
  const isAllowed = ALLOWED_PATH_PREFIXES.some(prefix => fullPath.startsWith(prefix));
  if (!isAllowed) {
    console.error("[Proxy Blocked] Disallowed path:", fullPath);
    return NextResponse.json(
      { detail: "Endpoint not found." },
      { status: 404 }
    );
  }

  // Block path traversal attempts
  if (path.includes("..") || path.includes("\\")) {
    console.error("[Proxy Blocked] Path traversal attempt:", path);
    return NextResponse.json(
      { detail: "Invalid request." },
      { status: 400 }
    );
  }

  const targetUrl = `${BACKEND_URL}/${path}${req.nextUrl.search}`;

  // Clone headers, strip host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!["host", "connection"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseBody = await backendRes.arrayBuffer();

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      // Skip headers that Next.js manages
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    // Set CORS to frontend origin only
    responseHeaders.set("Access-Control-Allow-Origin", FRONTEND_ORIGIN);

    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[Proxy Error]", err);
    return NextResponse.json(
      { detail: "Backend unreachable. Please try again." },
      { status: 503 }
    );
  }
}
