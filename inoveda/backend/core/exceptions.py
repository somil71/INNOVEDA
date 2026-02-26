import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from core.middleware import request_id_ctx

logger = logging.getLogger(__name__)


def add_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = request_id_ctx.get()
        logger.warning("validation_error", extra={"request_id": request_id, "path": request.url.path})
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors(), "request_id": request_id},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = request_id_ctx.get()
        logger.info(
            "http_exception",
            extra={"request_id": request_id, "path": request.url.path, "status_code": exc.status_code},
        )
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "request_id": request_id})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = request_id_ctx.get()
        logger.exception("unhandled_exception", extra={"request_id": request_id, "path": request.url.path})
        return JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})
