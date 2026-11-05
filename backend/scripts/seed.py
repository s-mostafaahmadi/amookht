"""
Seed data for Amookht - TestDaF Module

Run with: python -m scripts.seed
"""

import asyncio
import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import init_db, close_db, get_session_factory
from app.domain.models.models import Module, Skill, Topic, VocabularyItem, Exercise


def gen_uuid() -> str:
    return str(uuid.uuid4())


TESTDAF_MODULE = {
    "slug": "testdaf",
    "name": "TestDaF",
    "description": "Test Deutsch als Fremdsprache - Academic German proficiency exam",
    "config": {
        "skills": ["reading", "listening", "writing", "speaking"],
        "levels": ["TDN3", "TDN4", "TDN5"],
        "exam_sections": 4,
        "max_time_minutes": 210,
    },
}

TESTDAF_SKILLS = [
    # Top-level skills
    {"slug": "reading", "name": "Lesen (Reading)", "parent": None, "max_level": 10, "weight": 1.0},
    {"slug": "listening", "name": "Hören (Listening)", "parent": None, "max_level": 10, "weight": 1.0},
    {"slug": "writing", "name": "Schreiben (Writing)", "parent": None, "max_level": 10, "weight": 1.0},
    {"slug": "speaking", "name": "Sprechen (Speaking)", "parent": None, "max_level": 10, "weight": 1.0},
    # Writing sub-skills
    {"slug": "writing_grammar", "name": "Grammatik", "parent": "writing", "max_level": 10, "weight": 0.25},
    {"slug": "writing_vocabulary", "name": "Wortschatz", "parent": "writing", "max_level": 10, "weight": 0.25},
    {"slug": "writing_coherence", "name": "Kohärenz", "parent": "writing", "max_level": 10, "weight": 0.25},
    {"slug": "writing_argumentation", "name": "Argumentation", "parent": "writing", "max_level": 10, "weight": 0.25},
    # Speaking sub-skills
    {"slug": "speaking_grammar", "name": "Grammatik", "parent": "speaking", "max_level": 10, "weight": 0.2},
    {"slug": "speaking_vocabulary", "name": "Wortschatz", "parent": "speaking", "max_level": 10, "weight": 0.2},
    {"slug": "speaking_fluency", "name": "Flüssigkeit", "parent": "speaking", "max_level": 10, "weight": 0.2},
    {"slug": "speaking_pronunciation", "name": "Aussprache", "parent": "speaking", "max_level": 10, "weight": 0.2},
    {"slug": "speaking_argumentation", "name": "Argumentation", "parent": "speaking", "max_level": 10, "weight": 0.2},
]

TESTDAF_TOPICS = [
    # Main topics
    {
        "slug": "nachhaltigkeit",
        "name": "Nachhaltigkeit",
        "description": "Sustainability and environmental protection",
        "difficulty": 6,
        "minutes": 45,
        "parent": None,
        "content": {
            "summary": "Nachhaltigkeit ist ein zentrales Thema in der modernen Gesellschaft.",
            "key_vocabulary": ["Nachhaltigkeit", "Klimawandel", "Recycling", "Erneuerbare Energien"],
            "grammar_focus": ["Genitiv", "Relativsätze", "Passiv"],
        },
    },
    {
        "slug": "klimawandel",
        "name": "Klimawandel",
        "description": "Climate change and its effects",
        "difficulty": 7,
        "minutes": 40,
        "parent": "nachhaltigkeit",
        "content": {
            "summary": "Der Klimawandel ist die größte Herausforderung unserer Zeit.",
            "key_vocabulary": ["Treibhauseffekt", "Erderwärmung", "CO₂-Emissionen"],
            "grammar_focus": ["Konjunktiv II", "Bedingungssätze"],
        },
    },
    {
        "slug": "energie",
        "name": "Energie",
        "description": "Energy sources and transition",
        "difficulty": 6,
        "minutes": 40,
        "parent": "nachhaltigkeit",
        "content": {
            "summary": "Die Energiewende ist ein wichtiger Schritt nachhaltiger Zukunft.",
            "key_vocabulary": ["Solarenergie", "Windenergie", "Atomkraft", "Energiewende"],
            "grammar_focus": ["Nominalisierung", "Funktionsverben"],
        },
    },
    {
        "slug": "digitalisierung",
        "name": "Digitalisierung",
        "description": "Digitalization and its impact on society",
        "difficulty": 5,
        "minutes": 35,
        "parent": None,
        "content": {
            "summary": "Digitalisierung verändert Arbeitswelt und Gesellschaft grundlegend.",
            "key_vocabulary": ["Digitalisierung", "Automatisierung", "Künstliche Intelligenz"],
            "grammar_focus": ["Komparation", "Vergleichssätze"],
        },
    },
    {
        "slug": "bildung",
        "name": "Bildung",
        "description": "Education system and reform",
        "difficulty": 5,
        "minutes": 40,
        "parent": None,
        "content": {
            "summary": "Bildung ist die Grundlage für persönlichen und gesellschaftlichen Erfolg.",
            "key_vocabulary": ["Bildung", "Hochschule", "Curriculum", "Kompetenz"],
            "grammar_focus": ["Infinitiv mit zu", "Partizipialkonstruktionen"],
        },
    },
    {
        "slug": "gesundheit",
        "name": "Gesundheit",
        "description": "Healthcare and public health",
        "difficulty": 5,
        "minutes": 35,
        "parent": None,
        "content": {
            "summary": "Gesundheit ist ein wertvolles Gut, das geschützt werden muss.",
            "key_vocabulary": ["Gesundheit", "Vorsorge", "Impfung", "Pandemie"],
            "grammar_focus": ["Konjunktionen", "Nebensätze"],
        },
    },
    {
        "slug": "migration",
        "name": "Migration",
        "description": "Migration and integration",
        "difficulty": 7,
        "minutes": 45,
        "parent": None,
        "content": {
            "summary": "Migration ist ein natürlicher Prozess in einer globalisierten Welt.",
            "key_vocabulary": ["Migration", "Integration", "Asyl", "Multikulturalismus"],
            "grammar_focus": ["Passiv", "Nominalisierung"],
        },
    },
    {
        "slug": "arbeit",
        "name": "Arbeit",
        "description": "Future of work and labor market",
        "difficulty": 6,
        "minutes": 40,
        "parent": None,
        "content": {
            "summary": "Die Arbeitswelt wandelt sich durch Technologisierung und Globalisierung.",
            "key_vocabulary": ["Arbeitsmarkt", "Fernarbeit", "Work-Life-Balance"],
            "grammar_focus": ["Präteritum", "Perfekt"],
        },
    },
]

TESTDAF_VOCABULARY = [
    # Nachhaltigkeit
    {"word": "Nachhaltigkeit", "translation": "Sustainability", "pos": "noun", "difficulty": 6, "topic": "nachhaltigkeit",
     "example": "Nachhaltigkeit ist ein wichtiges Thema in der Politik.", "example_translation": "Sustainability is an important topic in politics."},
    {"word": "Klimawandel", "translation": "Climate change", "pos": "noun", "difficulty": 5, "topic": "klimawandel",
     "example": "Der Klimawandel betrifft uns alle.", "example_translation": "Climate change affects all of us."},
    {"word": "Recycling", "translation": "Recycling", "pos": "noun", "difficulty": 3, "topic": "nachhaltigkeit",
     "example": "Recycling hilft, Ressourcen zu schonen.", "example_translation": "Recycling helps conserve resources."},
    {"word": "Erneuerbare Energien", "translation": "Renewable energies", "pos": "noun", "difficulty": 5, "topic": "energie",
     "example": "Erneuerbare Energien sind die Zukunft.", "example_translation": "Renewable energies are the future."},
    {"word": "Treibhauseffekt", "translation": "Greenhouse effect", "pos": "noun", "difficulty": 7, "topic": "klimawandel",
     "example": "Der Treibhauseffekt wird durch CO₂ verstärkt.", "example_translation": "The greenhouse effect is intensified by CO₂."},
    {"word": "Energiewende", "translation": "Energy transition", "pos": "noun", "difficulty": 6, "topic": "energie",
     "example": "Die Energiewende erfordert große Investitionen.", "example_translation": "The energy transition requires major investments."},
    # Digitalisierung
    {"word": "Digitalisierung", "translation": "Digitalization", "pos": "noun", "difficulty": 5, "topic": "digitalisierung",
     "example": "Die Digitalisierung verändert unsere Arbeitswelt.", "example_translation": "Digitalization is changing our working world."},
    {"word": "Künstliche Intelligenz", "translation": "Artificial intelligence", "pos": "noun", "difficulty": 6, "topic": "digitalisierung",
     "example": "Künstliche Intelligenz revolutioniert viele Branchen.", "example_translation": "Artificial intelligence is revolutionizing many industries."},
    {"word": "Automatisierung", "translation": "Automation", "pos": "noun", "difficulty": 5, "topic": "digitalisierung",
     "example": "Automatisierung erhöht die Produktivität.", "example_translation": "Automation increases productivity."},
    # Bildung
    {"word": "Bildung", "translation": "Education", "pos": "noun", "difficulty": 3, "topic": "bildung",
     "example": "Bildung ist ein Menschenrecht.", "example_translation": "Education is a human right."},
    {"word": "Curriculum", "translation": "Curriculum", "pos": "noun", "difficulty": 4, "topic": "bildung",
     "example": "Das Curriculum wird regelmäßig aktualisiert.", "example_translation": "The curriculum is updated regularly."},
    {"word": "Kompetenz", "translation": "Competence/skill", "pos": "noun", "difficulty": 4, "topic": "bildung",
     "example": "Medienkompetenz ist heute unverzichtbar.", "example_translation": "Media literacy is indispensable today."},
    # Gesundheit
    {"word": "Gesundheit", "translation": "Health", "pos": "noun", "difficulty": 2, "topic": "gesundheit",
     "example": "Gesundheit ist das wichtigste im Leben.", "example_translation": "Health is the most important thing in life."},
    {"word": "Vorsorge", "translation": "Preventive care", "pos": "noun", "difficulty": 4, "topic": "gesundheit",
     "example": "Vorsorge kann Krankheiten verhindern.", "example_translation": "Preventive care can prevent diseases."},
    {"word": "Impfung", "translation": "Vaccination", "pos": "noun", "difficulty": 4, "topic": "gesundheit",
     "example": "Impfung schützt vor vielen Krankheiten.", "example_translation": "Vaccination protects against many diseases."},
    # Migration
    {"word": "Migration", "translation": "Migration", "pos": "noun", "difficulty": 4, "topic": "migration",
     "example": "Migration ist ein globales Phänomen.", "example_translation": "Migration is a global phenomenon."},
    {"word": "Integration", "translation": "Integration", "pos": "noun", "difficulty": 4, "topic": "migration",
     "example": "Integration erfordert Engagement beider Seiten.", "example_translation": "Integration requires commitment from both sides."},
    {"word": "Multikulturalismus", "translation": "Multiculturalism", "pos": "noun", "difficulty": 7, "topic": "migration",
     "example": "Multikulturalismus bereichert die Gesellschaft.", "example_translation": "Multiculturalism enriches society."},
]

TESTDAF_EXERCISES = [
    {
        "type": "grammar",
        "topic": "nachhaltigkeit",
        "difficulty": 5,
        "content": {
            "question": "Wegen des ___ (Wetter) bleiben wir zu Hause.",
            "type": "fill_blank",
            "options": ["Wetters", "Wetter", "Wetteres"],
            "correct_index": 0,
        },
        "correct_answer": {"selected_option": 0},
        "explanation": "'Wegen' verlangt den Genitiv: 'wegen des Wetters'.",
    },
    {
        "type": "grammar",
        "topic": "nachhaltigkeit",
        "difficulty": 6,
        "content": {
            "question": "Trotz ___ (Regen) gehen wir spazieren.",
            "type": "fill_blank",
            "options": ["dem Regen", "des Regens", "den Regen"],
            "correct_index": 1,
        },
        "correct_answer": {"selected_option": 1},
        "explanation": "'Trotz' verlangt den Genitiv: 'trotz des Regens'.",
    },
    {
        "type": "grammar",
        "topic": "digitalisierung",
        "difficulty": 4,
        "content": {
            "question": "Die Digitalisierung hat sich ___ (schnell) entwickelt.",
            "type": "fill_blank",
            "options": ["schnell", "schnelle", "schneller"],
            "correct_index": 0,
        },
        "correct_answer": {"selected_option": 0},
        "explanation": "Adverb im Komparativ: 'schnell' bleibt unverändert.",
    },
    {
        "type": "vocabulary",
        "topic": "nachhaltigkeit",
        "difficulty": 4,
        "content": {
            "question": "Was bedeutet 'Nachhaltigkeit' auf Englisch?",
            "type": "multiple_choice",
            "options": ["Sustainability", "Sustenance", "Substance", "Substitution"],
            "correct_index": 0,
        },
        "correct_answer": {"selected_option": 0},
        "explanation": "'Nachhaltigkeit' bedeutet 'Sustainability'.",
    },
    {
        "type": "vocabulary",
        "topic": "klimawandel",
        "difficulty": 5,
        "content": {
            "question": "Was ist der 'Treibhauseffekt'?",
            "type": "multiple_choice",
            "options": [
                "Ein Effekt der Erderwärmung durch Treibhausgase",
                "Ein Effekt in einem Treibhaus",
                "Ein künstlerischer Effekt",
                "Ein physikalisches Experiment"
            ],
            "correct_index": 0,
        },
        "correct_answer": {"selected_option": 0},
        "explanation": "Der Treibhauseffekt ist die Erwärmung der Erdatmosphäre durch Treibhausgase.",
    },
    {
        "type": "writing_prompt",
        "topic": "nachhaltigkeit",
        "difficulty": 6,
        "content": {
            "prompt": "Schreiben Sie einen Brief an die Universitätsleitung über das Thema Nachhaltigkeit an der Universität.",
            "requirements": [
                "Mindestens 200 Wörter",
                "Formeller Stil",
                "Mindestens 3 Argumente mit Beispielen",
                "Einleitung mit Begrüßung und Ziel des Briefes",
                "Hauptteil mit Argumenten",
                "Schluss mit Handlungsaufforderung"
            ],
            "time_limit_minutes": 30,
            "rubric": {
                "grammar": 25,
                "vocabulary": 25,
                "coherence": 25,
                "argumentation": 25,
            },
        },
        "correct_answer": {},
        "explanation": "Dies ist eine Schreibaufgabe. Der Text wird von der KI bewertet.",
    },
    {
        "type": "speaking_prompt",
        "topic": "digitalisierung",
        "difficulty": 5,
        "content": {
            "prompt": "Beschreiben Sie, wie die Digitalisierung Ihr Leben verändert hat.",
            "requirements": [
                "Mindestens 300 Wörter",
                "Persönliche Beispiele",
                "Vor- und Nachteile",
                "Struktur: Einleitung, Hauptteil, Schluss"
            ],
            "time_limit_minutes": 5,
        },
        "correct_answer": {},
        "explanation": "Dies ist eine Sprechaufgabe. Die Antwort wird von der KI bewertet.",
    },
]


async def seed():
    await init_db("postgresql+asyncpg://postgres:postgres@localhost:5432/amookht")
    factory = get_session_factory()

    async with factory() as db:
        # Check if module already exists
        result = await db.execute(select(Module).where(Module.slug == "testdaf"))
        if result.scalar_one_or_none():
            print("TestDaF module already exists. Skipping seed.")
            await close_db()
            return

        print("Seeding TestDaF module...")

        # Create module
        module = Module(
            id=gen_uuid(),
            **TESTDAF_MODULE,
        )
        db.add(module)
        await db.flush()

        # Create skills
        skill_map = {}
        for skill_data in TESTDAF_SKILLS:
            skill = Skill(
                id=gen_uuid(),
                module_id=module.id,
                slug=skill_data["slug"],
                name=skill_data["name"],
                max_level=skill_data["max_level"],
                weight=skill_data["weight"],
            )
            db.add(skill)
            await db.flush()
            skill_map[skill_data["slug"]] = skill

        # Set parent skills
        for skill_data in TESTDAF_SKILLS:
            if skill_data["parent"]:
                child = skill_map[skill_data["slug"]]
                parent = skill_map[skill_data["parent"]]
                child.parent_skill_id = parent.id

        # Create topics
        topic_map = {}
        for topic_data in TESTDAF_TOPICS:
            topic = Topic(
                id=gen_uuid(),
                module_id=module.id,
                slug=topic_data["slug"],
                name=topic_data["name"],
                description=topic_data["description"],
                difficulty_level=topic_data["difficulty"],
                estimated_minutes=topic_data["minutes"],
                content=topic_data["content"],
            )
            db.add(topic)
            await db.flush()
            topic_map[topic_data["slug"]] = topic

        # Set parent topics
        for topic_data in TESTDAF_TOPICS:
            if topic_data["parent"]:
                child = topic_map[topic_data["slug"]]
                parent = topic_map[topic_data["parent"]]
                child.parent_topic_id = parent.id

        # Create vocabulary
        for vocab_data in TESTDAF_VOCABULARY:
            vocab = VocabularyItem(
                id=gen_uuid(),
                module_id=module.id,
                topic_id=topic_map.get(vocab_data["topic"], None),
                word=vocab_data["word"],
                translation=vocab_data["translation"],
                part_of_speech=vocab_data["pos"],
                difficulty_level=vocab_data["difficulty"],
                example_sentence=vocab_data.get("example"),
                example_translation=vocab_data.get("example_translation"),
            )
            db.add(vocab)

        # Create exercises
        for ex_data in TESTDAF_EXERCISES:
            exercise = Exercise(
                id=gen_uuid(),
                module_id=module.id,
                topic_id=topic_map.get(ex_data["topic"], None),
                exercise_type=ex_data["type"],
                difficulty_level=ex_data["difficulty"],
                content=ex_data["content"],
                correct_answer=ex_data["correct_answer"],
                explanation=ex_data["explanation"],
            )
            db.add(exercise)

        await db.commit()
        print(f"Seeded TestDaF module with:")
        print(f"  - 1 module")
        print(f"  - {len(TESTDAF_SKILLS)} skills")
        print(f"  - {len(TESTDAF_TOPICS)} topics")
        print(f"  - {len(TESTDAF_VOCABULARY)} vocabulary items")
        print(f"  - {len(TESTDAF_EXERCISES)} exercises")

    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
