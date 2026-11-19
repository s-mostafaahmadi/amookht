"""Password hashing with bcrypt directly (NO-PASSLIB, 2026-11-14).
passlib is unmaintained and breaks with bcrypt>=5. Hashes are the same $2b$12$ format, and passwords are cut to
72 bytes exactly like passlib/bcrypt 4 did, so every existing hash keeps verifying."""
import bcrypt


def _pw(password: str) -> bytes:
    return str(password or "").encode("utf-8")[:72]


class _PasswordContext:
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(_pw(password), bcrypt.gensalt(rounds=12)).decode("ascii")

    def verify(self, password: str, hashed: str | None) -> bool:
        if not hashed:
            return False
        try:
            return bcrypt.checkpw(_pw(password), hashed.encode("ascii"))
        except (ValueError, TypeError):
            return False


pwd_context = _PasswordContext()
