from fastapi import APIRouter
from backend.app.api.accounts import router as accounts_router
from backend.app.api.transactions import router as transactions_router
from backend.app.api.transfers import router as transfers_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(accounts_router)
api_router.include_router(transactions_router)
api_router.include_router(transfers_router)
