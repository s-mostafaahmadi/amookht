from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import get_db
from app.domain.models.models import VocabularyItem, VocabularyProgress
from app.domain.services.spaced_repetition import SpacedRepetitionEngine, ReviewQuality

router = APIRouter()
sr_engine = SpacedRepetitionEngine()


class VocabularyItemResponse(BaseModel):
    id: str
    word: str
    translation: str | None
    definition: str | None
    example_sentence: str | None
    part_of_speech: str | None
    difficulty_level: int


class ReviewRequest(BaseModel):
    quality: int  # 0-5


@router.get("")
async def list_vocabulary(
    topic: str | None = None,
    review_due: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    query = select(VocabularyItem)
    if topic:
        query = query.join(VocabularyItem.topic).where(VocabularyItem.topic.has(slug=topic))

    result = await db.execute(query.limit(limit))
    items = result.scalars().all()

    return [
        VocabularyItemResponse(
            id=v.id,
            word=v.word,
            translation=v.translation,
            definition=v.definition,
            example_sentence=v.example_sentence,
            part_of_speech=v.part_of_speech,
            difficulty_level=v.difficulty_level,
        )
        for v in items
    ]


@router.get("/review")
async def get_review_items(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    today = date.today()
    result = await db.execute(
        select(VocabularyProgress)
        .where(VocabularyProgress.user_id == user_id)
        .where(VocabularyProgress.is_mastered == False)
        .where(VocabularyProgress.next_review_date <= today)
        .order_by(VocabularyProgress.next_review_date)
        .limit(limit)
    )
    progress = result.scalars().all()

    items = []
    for p in progress:
        item_result = await db.execute(
            select(VocabularyItem).where(VocabularyItem.id == p.vocabulary_item_id)
        )
        vocab = item_result.scalar_one_or_none()
        if vocab:
            items.append({
                "vocab_id": vocab.id,
                "word": vocab.word,
                "translation": vocab.translation,
                "example_sentence": vocab.example_sentence,
                "last_reviewed": p.last_review_date.isoformat() if p.last_review_date else None,
                "ease_factor": p.ease_factor,
                "interval_days": p.interval_days,
            })

    return {"due_count": len(items), "items": items}


@router.post("/{vocab_id}/review")
async def review_vocabulary(
    vocab_id: str,
    request: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    # Get or create progress
    result = await db.execute(
        select(VocabularyProgress)
        .where(VocabularyProgress.user_id == user_id)
        .where(VocabularyProgress.vocabulary_item_id == vocab_id)
    )
    progress = result.scalar_one_or_none()

    if not progress:
        progress = VocabularyProgress(
            user_id=user_id,
            vocabulary_item_id=vocab_id,
            **sr_engine.calculate_initial_state().__dict__,
        )
        db.add(progress)

    # Calculate next review
    quality = ReviewQuality(request.quality)
    new_state = sr_engine.calculate_next_review(
        current_ease=progress.ease_factor,
        current_interval=progress.interval_days,
        current_repetitions=progress.repetitions,
        quality=quality,
    )

    progress.ease_factor = new_state.ease_factor
    progress.interval_days = new_state.interval_days
    progress.repetitions = new_state.repetitions
    progress.next_review_date = new_state.next_review_date
    progress.is_mastered = new_state.is_mastered
    progress.last_review_date = date.today()
    progress.last_quality = request.quality
    progress.total_reviews += 1

    if quality.value >= 3:
        progress.correct_streak += 1
    else:
        progress.correct_streak = 0

    await db.commit()

    return {
        "vocab_id": vocab_id,
        "next_review_date": new_state.next_review_date.isoformat(),
        "interval_days": new_state.interval_days,
        "is_mastered": new_state.is_mastered,
        "ease_factor": new_state.ease_factor,
    }
