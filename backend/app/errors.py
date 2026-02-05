from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def ok(data=None, message: str = "ok"):
    return {"code": 0, "message": message, "data": data}


def _error(code: int, message: str, status: int):
    return JSONResponse(status_code=status, content={"code": code, "message": message, "data": None})


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_: Request, exc: RequestValidationError):
        return _error(2001, f"参数校验失败: {exc.errors()}", 422)

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(_: Request, exc: StarletteHTTPException):
        if exc.status_code == 401:
            return _error(1001, str(exc.detail), 401)
        if exc.status_code == 403:
            return _error(1003, str(exc.detail), 403)
        if exc.status_code == 404:
            return _error(2002, str(exc.detail), 404)
        if exc.status_code == 409:
            return _error(2003, str(exc.detail), 409)
        return _error(5000, str(exc.detail), exc.status_code)

    @app.exception_handler(Exception)
    async def unknown_error_handler(_: Request, __: Exception):
        return _error(5000, "系统内部错误", 500)
