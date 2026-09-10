from fastapi import APIRouter

router = APIRouter()


@router.get("/python-backend/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
