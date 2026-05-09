<<<<<<< HEAD
FROM python:3.11-slim
=======
FROM python:3.12-slim
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc

WORKDIR /app

# Build context is repo ROOT, so prefix paths with backend/
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

<<<<<<< HEAD
=======
# Run as non-root user for security
RUN adduser --disabled-password --gecos "" appuser
USER appuser

>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
EXPOSE 8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
