from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import get_db
from app.domain.models.models import (
    LearningSession, ErrorRecord, DailyAnalytics, UserProfile
)

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    # Get profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    # Total sessions
    sessions_result = await db.execute(
        select(func.count(LearningSession.id))
        .where(LearningSession.user_id == user_id)
    )
    total_sessions = sessions_result.scalar() or 0

    # Total errors
    errors_result = await db.execute(
        select(func.count(ErrorRecord.id))
        .where(ErrorRecord.user_id == user_id)
    )
    total_errors = errors_result.scalar() or 0

    # Resolved errors
    resolved_result = await db.execute(
        select(func.count(ErrorRecord.id))
        .where(ErrorRecord.user_id == user_id)
        .where(ErrorRecord.is_resolved == True)
    )
    resolved_errors = resolved_result.scalar() or 0

    return {
        "study_streak": profile.study_streak if profile else 0,
        "total_study_minutes": profile.total_study_minutes if profile else 0,
        "total_sessions": total_sessions,
        "total_errors": total_errors,
        "resolved_errors": resolved_errors,
        "current_level": profile.current_level if profile else None,
        "target_exam": profile.target_exam if profile else None,
        "target_level": profile.target_level if profile else None,
    }


@router.get("/progress")
async def get_progress(
    period: str = "7d",
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    # Calculate date range
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)
    start_date = date.today() - timedelta(days=days)

    result = await db.execute(
        select(DailyAnalytics)
        .where(DailyAnalytics.user_id == user_id)
        .where(DailyAnalytics.analysis_date >= start_date)
        .order_by(DailyAnalytics.analysis_date)
    )
    analytics = result.scalars().all()

    return [
        {
            "date": a.analysis_date.isoformat(),
            "study_minutes": a.study_minutes,
            "exercises_completed": a.exercises_completed,
            "accuracy_rate": a.accuracy_rate,
            "new_errors": a.new_errors_count,
            "resolved_errors": a.resolved_errors_count,
        }
        for a in analytics
    ]


@router.get("/weaknesses")
async def get_weaknesses(
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    # Get unresolved errors grouped by category
    result = await db.execute(
        select(ErrorRecord.error_category, func.count(ErrorRecord.id))
        .where(ErrorRecord.user_id == user_id)
        .where(ErrorRecord.is_resolved == False)
        .group_by(ErrorRecord.error_category)
        .order_by(func.count(ErrorRecord.id).desc())
    )
    weaknesses = [
        {"category": row[0], "count": row[1]}
        for row in result.all()
    ]

    return {"weaknesses": weaknesses}
