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


class CacheService:
    """Simple cache service using Redis."""

    def __init__(self, redis: aioredis.Redis):
        self.redis = redis

    async def get(self, key: str) -> str | None:
        return await self.redis.get(key)

    async def set(self, key: str, value: str, ttl: int = 300) -> None:
        await self.redis.set(key, value, ex=ttl)

    async def delete(self, key: str) -> None:
        await self.redis.delete(key)

    async def exists(self, key: str) -> bool:
        return await self.redis.exists(key) > 0

    async def increment(self, key: str) -> int:
        return await self.redis.incr(key)

    async def get_json(self, key: str) -> dict | None:
        import orjson
        data = await self.redis.get(key)
        if data:
            return orjson.loads(data)
        return None

    async def set_json(self, key: str, value: dict, ttl: int = 300) -> None:
        import orjson
        await self.redis.set(key, orjson.dumps(value), ex=ttl)
