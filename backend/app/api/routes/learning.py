from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import get_db
from app.domain.models.models import Skill, SkillLevel, Module

router = APIRouter()


class SkillResponse(BaseModel):
    skill_id: str
    name: str
    slug: str
    level: int
    experience: int
    max_level: int
    accuracy: float
    sub_skills: list["SkillResponse"] = []


class SkillTreeResponse(BaseModel):
    module: str
    skills: list[SkillResponse]


@router.get("/skills", response_model=SkillTreeResponse)
async def get_skill_tree(
    module: str = "testdaf",
    db: AsyncSession = Depends(get_db),
):
    # Get module
    result = await db.execute(select(Module).where(Module.slug == module))
    module_obj = result.scalar_one_or_none()
    if not module_obj:
        raise HTTPException(status_code=404, detail=f"Module '{module}' not found")

    # Get top-level skills
    result = await db.execute(
        select(Skill)
        .where(Skill.module_id == module_obj.id)
        .where(Skill.parent_skill_id.is_(None))
    )
    skills = result.scalars().all()

    skill_responses = []
    for skill in skills:
        # Get sub-skills
        sub_result = await db.execute(
            select(Skill)
            .where(Skill.parent_skill_id == skill.id)
        )
        sub_skills = sub_result.scalars().all()

        sub_skill_responses = [
            SkillResponse(
                skill_id=sub.id,
                name=sub.name,
                slug=sub.slug,
                level=1,  # Would come from SkillLevel table
                experience=0,
                max_level=sub.max_level,
                accuracy=0.0,
            )
            for sub in sub_skills
        ]

        skill_responses.append(
            SkillResponse(
                skill_id=skill.id,
                name=skill.name,
                slug=skill.slug,
                level=1,
                experience=0,
                max_level=skill.max_level,
                accuracy=0.0,
                sub_skills=sub_skill_responses,
            )
        )

    return SkillTreeResponse(module=module, skills=skill_responses)


@router.get("/topics")
async def get_topics(
    module: str = "testdaf",
    parent_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    from app.domain.models.models import Topic

    result = await db.execute(select(Module).where(Module.slug == module))
    module_obj = result.scalar_one_or_none()
    if not module_obj:
        raise HTTPException(status_code=404, detail=f"Module '{module}' not found")

    query = select(Topic).where(Topic.module_id == module_obj.id)
    if parent_id:
        query = query.where(Topic.parent_topic_id == parent_id)
    else:
        query = query.where(Topic.parent_topic_id.is_(None))

    result = await db.execute(query)
    topics = result.scalars().all()

    return [
        {
            "id": t.id,
            "slug": t.slug,
            "name": t.name,
            "description": t.description,
            "difficulty_level": t.difficulty_level,
            "estimated_minutes": t.estimated_minutes,
        }
        for t in topics
    ]
