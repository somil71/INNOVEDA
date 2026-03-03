import asyncio
import random
import time
from typing import Callable, Any


async def exponential_backoff_retry(
    func: Callable[..., Any],
    *args,
    retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    **kwargs,
) -> Any:
    """Execute a blocking or async function with exponential backoff.

    ``func`` may be a normal or async function; if it returns a coroutine we await it.
    ``retries`` is the total number of attempts (initial call + retries).
    """
    attempt = 0
    while True:
        try:
            result = func(*args, **kwargs)
            if asyncio.iscoroutine(result):
                result = await result
            return result
        except Exception as exc:
            attempt += 1
            if attempt >= retries:
                raise
            delay = min(base_delay * (2 ** (attempt - 1)) + random.random() * 0.1, max_delay)
            await asyncio.sleep(delay)


def sanitize_input(text: str) -> str:
    """Reject inputs that look like spam or repeated characters."""
    stripped = text.strip()
    if len(stripped) < 3:
        raise ValueError("input too short")
    # repeated character spam
    import re

    if re.search(r"(.)\1{5,}", stripped):
        raise ValueError("repeated character pattern detected")
    # simple filter for javascript tags
    if "<script" in stripped.lower():
        raise ValueError("invalid characters detected")
    return stripped
