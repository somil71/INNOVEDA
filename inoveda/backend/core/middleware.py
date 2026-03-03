import logging
import time
import uuid
from collections import defaultdict, deque
from contextvars import ContextVar

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import settings

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)
logger = logging.getLogger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request_id_ctx.set(request_id)
        started = time.monotonic()
        response = await call_next(request)
        duration_ms = int((time.monotonic() - started) * 1000)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "http_request",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
            },
        )
        response.headers["X-Response-Time-Ms"] = str(duration_ms)
        return response


import redis

class RedisRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.window_seconds = 60
        self.limit = settings.rate_limit_per_minute
        self.redis = redis.from_url(settings.redis_url)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/ws/"):
            return await call_next(request)

        client_host = request.client.host if request.client else "unknown"
        # We use a sliding window via Redis sorted sets.
        key = f"rl:{client_host}:{request.url.path}"
        now = time.time()
        
        # Atomic sliding window increment
        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, now - self.window_seconds)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window_seconds + 10)
        _, _, count, _ = pipe.execute()

        if count > self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(self.window_seconds)},
            )
        return await call_next(request)
