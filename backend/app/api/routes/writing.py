from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import get_db
from app.domain.models.models import (
    WritingSubmission, WritingVersion, WritingEvaluation, Module
)
from app.dependencies import get_ai_engine
from app.ai_engine.engine import AIEngine

router = APIRouter()


class CreateSubmissionRequest(BaseModel):
    module: str = "testdaf"
    topic_id: str | None = None
    prompt: str


class SubmitVersionRequest(BaseModel):
    content: str
    time_spent_seconds: int | None = None


class SubmissionResponse(BaseModel):
    id: str
    prompt: str
    status: str
    current_version: int
    created_at: datetime


class VersionResponse(BaseModel):
    id: str
    version_number: int
    content: str
    word_count: int | None
    created_at: datetime


class EvaluationResponse(BaseModel):
    id: str
    overall_score: float | None
    grammar_score: float | None
    vocabulary_score: float | None
    coherence_score: float | None
    argumentation_score: float | None
    structure_score: float | None
    feedback_summary: str | None
    inline_corrections: list[dict]
    suggestions: list[str]


@router.post("/submissions", response_model=SubmissionResponse, status_code=201)
async def create_submission(
    request: CreateSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",  # TODO: Get from auth
):
    # Get module
    result = await db.execute(select(Module).where(Module.slug == request.module))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{request.module}' not found")

    submission = WritingSubmission(
        user_id=user_id,
        module_id=module.id,
        topic_id=request.topic_id,
        prompt=request.prompt,
        status="draft",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return SubmissionResponse(
        id=submission.id,
        prompt=submission.prompt,
        status=submission.status,
        current_version=submission.current_version,
        created_at=submission.created_at,
    )


@router.post("/submissions/{submission_id}/versions", response_model=VersionResponse, status_code=201)
async def submit_version(
    submission_id: str,
    request: SubmitVersionRequest,
    db: AsyncSession = Depends(get_db),
):
    # Get submission
    result = await db.execute(
        select(WritingSubmission).where(WritingSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Create new version
    version_number = submission.current_version + 1
    word_count = len(request.content.split())

    version = WritingVersion(
        submission_id=submission_id,
        version_number=version_number,
        content=request.content,
        word_count=word_count,
        time_spent_seconds=request.time_spent_seconds,
    )
    db.add(version)

    # Update submission
    submission.current_version = version_number
    submission.status = "submitted"
    await db.commit()
    await db.refresh(version)

    return VersionResponse(
        id=version.id,
        version_number=version.version_number,
        content=version.content,
        word_count=version.word_count,
        created_at=version.created_at,
    )


@router.post("/versions/{version_id}/evaluate", response_model=EvaluationResponse)
async def evaluate_writing(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    ai_engine: AIEngine = Depends(get_ai_engine),
):
    # Get version
    result = await db.execute(
        select(WritingVersion).where(WritingVersion.id == version_id)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Get submission for context
    submission_result = await db.execute(
        select(WritingSubmission).where(WritingSubmission.id == version.submission_id)
    )
    submission = submission_result.scalar_one_or_none()

    # Call AI Engine for evaluation
    try:
        evaluation = await ai_engine.evaluate_writing(
            text=version.content,
            topic="Nachhaltigkeit",  # TODO: Get from submission/topic
            level="B2",  # TODO: Get from user profile
            rubric={
                "grammar": 25,
                "vocabulary": 25,
                "coherence": 25,
                "argumentation": 25,
            },
        )
    except Exception as e:
        # Fallback to mock if AI engine fails
        evaluation = type('Evaluation', (), {
            'overall_score': 73.5,
            'grammar_score': 80.0,
            'vocabulary_score': 71.0,
            'coherence_score': 75.0,
            'argumentation_score': 68.0,
            'structure_score': 73.5,
            'feedback_summary': f"AI evaluation unavailable. Error: {str(e)}",
            'inline_corrections': [],
            'suggestions': [],
            'model_used': 'fallback',
            'tokens_used': 0,
        })()

    # Store evaluation
    db_eval = WritingEvaluation(
        version_id=version_id,
        user_id="demo-user",
        overall_score=evaluation.overall_score,
        grammar_score=evaluation.grammar_score,
        vocabulary_score=evaluation.vocabulary_score,
        coherence_score=evaluation.coherence_score,
        argumentation_score=evaluation.argumentation_score,
        structure_score=evaluation.structure_score,
        feedback_summary=evaluation.feedback_summary,
        inline_corrections=evaluation.inline_corrections,
        suggestions=evaluation.suggestions,
        llm_model=evaluation.model_used,
        llm_tokens_used=evaluation.tokens_used,
    )
    db.add(db_eval)
    await db.commit()

    return EvaluationResponse(
        id=db_eval.id,
        overall_score=db_eval.overall_score,
        grammar_score=db_eval.grammar_score,
        vocabulary_score=db_eval.vocabulary_score,
        coherence_score=db_eval.coherence_score,
        argumentation_score=db_eval.argumentation_score,
        structure_score=db_eval.structure_score,
        feedback_summary=db_eval.feedback_summary,
        inline_corrections=db_eval.inline_corrections or [],
        suggestions=db_eval.suggestions or [],
    )


@router.get("/submissions")
async def list_submissions(
    db: AsyncSession = Depends(get_db),
    user_id: str = "demo-user",
):
    result = await db.execute(
        select(WritingSubmission)
        .where(WritingSubmission.user_id == user_id)
        .order_by(WritingSubmission.created_at.desc())
    )
    submissions = result.scalars().all()

    return [
        {
            "id": s.id,
            "prompt": s.prompt,
            "status": s.status,
            "current_version": s.current_version,
            "created_at": s.created_at.isoformat(),
        }
        for s in submissions
    ]
