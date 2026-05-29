import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import auth, orders, extract, calendar, public, shop, dashboard, customers, upload, revenue
from .services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="caker API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
