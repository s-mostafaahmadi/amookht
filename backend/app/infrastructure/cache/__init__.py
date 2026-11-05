import redis.asyncio as aioredis

_redis_client: aioredis.Redis | None = None


async def init_redis(redis_url: str) -> None:
    global _redis_client
    _redis_client = aioredis.from_url(
        redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.close()


def get_redis() -> aioredis.Redis:
    if _redis_client is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis_client
