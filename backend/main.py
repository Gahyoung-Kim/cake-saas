import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .config import settings
from .rate_limit import limiter
from .routers import auth, orders, extract, calendar, public, shop, dashboard, customers, upload, revenue
from .services.scheduler import start_scheduler, stop_scheduler


def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요."},
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="caker API",
    version="0.1.0",
    lifespan=lifespan,
    # 운영에서는 API 스펙을 공개하지 않는다
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
)

# 요청 빈도 제한 — 라우터의 @limiter.limit 데코레이터가 동작하려면 둘 다 필요
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 이미지 정적 서빙
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router,      prefix="/api/auth",      tags=["auth"])
app.include_router(orders.router,    prefix="/api/orders",    tags=["orders"])
app.include_router(extract.router,   prefix="/api",           tags=["extract"])
app.include_router(calendar.router,  prefix="/api",           tags=["calendar"])
app.include_router(public.router,    prefix="/api/public",    tags=["public"])
app.include_router(upload.router,    prefix="/api/public",    tags=["upload"])
app.include_router(shop.router,      prefix="/api/shop",      tags=["shop"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(revenue.router,   prefix="/api",           tags=["revenue"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
