import time
import threading
from typing import Any, Optional

class SimpleTTLCache:
    def __init__(self, default_ttl: int = 3):
        self._cache: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            if key in self._cache:
                val, expire_at = self._cache[key]
                if now < expire_at:
                    return val
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl if ttl is not None else self.default_ttl
        expire_at = time.time() + ttl
        with self._lock:
            self._cache[key] = (value, expire_at)

    def invalidate(self, prefix: str = "") -> None:
        with self._lock:
            if not prefix:
                self._cache.clear()
            else:
                keys_to_del = [k for k in self._cache if k.startswith(prefix)]
                for k in keys_to_del:
                    del self._cache[k]

stats_cache = SimpleTTLCache(default_ttl=3)
