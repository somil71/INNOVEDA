from typing import Literal


class LowConfidenceError(Exception):
    pass


def enforce(confidence: float, threshold: float = 0.6) -> None:
    if confidence < threshold:
        raise LowConfidenceError(f"confidence {confidence} below threshold {threshold}")
