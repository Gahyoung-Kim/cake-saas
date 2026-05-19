from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, orders, extract, calendar, public, shop, dashboard, customers

app = FastAPI(title="caker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(extract.router, prefix="/api", tags=["extract"])
app.include_router(calendar.router, prefix="/api", tags=["calendar"])
app.include_router(public.router, prefix="/api/public", tags=["public"])
app.include_router(shop.router, prefix="/api/shop", tags=["shop"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
