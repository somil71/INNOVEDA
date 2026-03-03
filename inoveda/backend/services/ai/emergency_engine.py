import re
from typing import List

# a larger set of red-flag patterns should be maintained here.
EMERGENCY_PATTERNS: List[re.Pattern] = [
    re.compile(r"\bchest pain\b", re.IGNORECASE),
    re.compile(r"\b(severe )?bleeding\b", re.IGNORECASE),
    re.compile(r"\bnot breathing\b", re.IGNORECASE),
    re.compile(r"\bstroke\b", re.IGNORECASE),
    re.compile(r"\bunconscious\b", re.IGNORECASE),
    re.compile(r"\bseizures?\b", re.IGNORECASE),
    re.compile(r"\b(difficulty|hard) breathing\b", re.IGNORECASE),
]

CRITICAL_TERMS = {"chest pain", "unconscious", "bleeding", "stroke", "seizure", "breathless", "severe breathlessness"}


def contains_emergency(text: str) -> bool:
    """Return True if any emergency regex matches."""
    for pat in EMERGENCY_PATTERNS:
        if pat.search(text):
            return True
    return False
