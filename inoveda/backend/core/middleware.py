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


import redis.asyncio as aioredis


class RedisRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.window_seconds = 60
        self.limit = settings.rate_limit_per_minute
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis | None:
        if self._redis is None:
            try:
                self._redis = aioredis.from_url(settings.redis_url, socket_connect_timeout=1)
                await self._redis.ping()
            except Exception:
                logger.warning("redis_unavailable_rate_limit_disabled")
                self._redis = None
        return self._redis

    async def dispatch(self, request: Request, call_next):
        skip_paths = ("/ws/", "/health", "/metrics")
        if any(request.url.path.startswith(p) for p in skip_paths):
            return await call_next(request)

        redis_client = await self._get_redis()
        if redis_client is None:
            return await call_next(request)

        client_host = request.client.host if request.client else "unknown"
        key = f"rl:{client_host}:{request.url.path}"
        now = time.time()

        try:
            pipe = redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, now - self.window_seconds)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, self.window_seconds + 10)
            _, _, count, _ = await pipe.execute()

            if count > self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                    headers={"Retry-After": str(self.window_seconds)},
                )
        except Exception:
            logger.warning("redis_rate_limit_check_failed")

        return await call_next(request)
