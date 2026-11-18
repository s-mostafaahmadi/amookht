# Creates (or reuses) the Windows-app test account and prints fresh tokens as JSON.
# The password is random and never shown: the app signs in with these tokens only.
import asyncio, json, secrets, sys
from sqlalchemy import func, select
from app.config import get_settings
from app.infrastructure.database import connection
from app.domain.models.models import User, UserProfile
from app.api.passwords import pwd_context
from app.api.routes.auth import create_access_token, create_refresh_token

EMAIL = "windows-app-test@example.com"


async def main():
    await connection.init_db(get_settings().DATABASE_URL)
    async with connection._session_factory() as db:
        user = (await db.execute(select(User).where(func.lower(User.email) == EMAIL))).scalar_one_or_none()
        created = False
        if user is None:
            user = User(
                email=EMAIL,
                password_hash=pwd_context.hash(secrets.token_urlsafe(32)),
                display_name="Windows App Test",
                is_verified=True,
                access_role="premium",
                preferences={"signup_method": "windows-app-test"},
            )
            db.add(user)
            await db.flush()
            db.add(UserProfile(user_id=user.id))
            await db.commit()
            created = True
        print(json.dumps({
            "email": user.email, "user_id": user.id, "role": user.access_role, "created": created,
            "access_token": create_access_token(user.id), "refresh_token": create_refresh_token(user.id),
        }))


asyncio.run(main())
