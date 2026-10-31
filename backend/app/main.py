from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.app.config import get_settings
from backend.app.database import engine, Base
import backend.app.models  # ensure models are registered
from backend.app.api.router import api_router
from backend.app.exceptions.domain_exceptions import LedgerDomainException

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Synchronize schema if not in unit testing mode
    import os
    if os.environ.get("TESTING") != "true":
        try:
            Base.metadata.create_all(bind=engine)
        except Exception:
            pass
    yield

app = FastAPI(
    title="AegisLedger API",
    version=settings.APP_VERSION,
    description="High-Integrity Double-Entry Inspired Transaction Ledger API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(LedgerDomainException)
async def handle_domain_exception(request: Request, exc: LedgerDomainException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def handle_validation_exception(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc not in ("body", "query", "path"))
        errors.append({
            "field": field or "body",
            "message": err["msg"],
            "type": err["type"]
        })
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed. Please review the supplied parameters.",
                "details": errors,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException):
    code_map = {
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        400: "BAD_REQUEST",
        500: "INTERNAL_SERVER_ERROR"
    }
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": code_map.get(exc.status_code, "HTTP_ERROR"),
                "message": str(exc.detail),
                "details": {},
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

app.include_router(api_router)
