from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import get_db
from app.domain.models.models import ErrorRecord

router = APIRouter()


@router.get("")
async def list_errors(
    error_type: str | None = None,
    resolved: bool | None = None,
    category: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    query = select(ErrorRecord).where(ErrorRecord.user_id == user_id)

    if error_type:
        query = query.where(ErrorRecord.error_type == error_type)
    if resolved is not None:
        query = query.where(ErrorRecord.is_resolved == resolved)
    if category:
        query = query.where(ErrorRecord.error_category == category)

    query = query.order_by(ErrorRecord.created_at.desc()).limit(limit)
    result = await db.execute(query)
    errors = result.scalars().all()

    return [
        {
            "id": e.id,
            "error_type": e.error_type,
            "error_category": e.error_category,
            "user_answer": e.user_answer,
            "correct_answer": e.correct_answer,
            "explanation": e.explanation,
            "severity": e.severity,
            "is_resolved": e.is_resolved,
            "source": e.source,
            "created_at": e.created_at.isoformat(),
        }
        for e in errors
    ]


@router.get("/analysis")
async def get_error_analysis(
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    # Total errors
    total_result = await db.execute(
        select(func.count(ErrorRecord.id)).where(ErrorRecord.user_id == user_id)
    )
    total = total_result.scalar() or 0

    # Resolved errors
    resolved_result = await db.execute(
        select(func.count(ErrorRecord.id))
        .where(ErrorRecord.user_id == user_id)
        .where(ErrorRecord.is_resolved == True)
    )
    resolved = resolved_result.scalar() or 0

    # Unresolved errors
    unresolved_result = await db.execute(
        select(func.count(ErrorRecord.id))
        .where(ErrorRecord.user_id == user_id)
        .where(ErrorRecord.is_resolved == False)
    )
    unresolved = unresolved_result.scalar() or 0

    # Top categories
    category_result = await db.execute(
        select(ErrorRecord.error_category, func.count(ErrorRecord.id))
        .where(ErrorRecord.user_id == user_id)
        .where(ErrorRecord.is_resolved == False)
        .group_by(ErrorRecord.error_category)
        .order_by(func.count(ErrorRecord.id).desc())
        .limit(5)
    )
    top_categories = [
        {"category": row[0], "count": row[1]}
        for row in category_result.all()
    ]

    resolution_rate = (resolved / total * 100) if total > 0 else 0

    return {
        "total_errors": total,
        "resolved": resolved,
        "pending": unresolved,
        "resolution_rate": round(resolution_rate, 1),
        "top_categories": top_categories,
    }


@router.get("/review/due")
async def get_due_reviews(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    # TODO: Implement error review scheduling
    return {"due_count": 0, "items": []}
