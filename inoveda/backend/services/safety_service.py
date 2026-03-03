import logging

logger = logging.getLogger(__name__)

class SafetyService:
    @staticmethod
    def validate_triage(symptoms: list[str], severity: str) -> tuple[bool, str | None]:
        """
        Validates AI triage output against a basic set of medical consistency rules.
        In a real scenario, this would check against a formal ontology like SNOMED CT.
        """
        critical_keywords = {
            "chest pain", "difficulty breathing", "shortness of breath", 
            "severe bleeding", "unconscious", "stroke", "heart attack",
            "paralysis", "seizure"
        }
        
        found_critical = [s for s in symptoms if any(kw in s.lower() for kw in critical_keywords)]
        
        if found_critical and severity != "critical":
            msg = f"Inconsistency detected: Critical symptoms {found_critical} reported but severity is '{severity}'."
            logger.warning(f"safety_violation: {msg}")
            return False, msg
            
        return True, None

    @staticmethod
    def log_drift(user_id: int, model_version: str, confidence: float):
        """Placeholder for tracking model performance over time to detect drift"""
        logger.info(f"model_monitoring: user={user_id} version={model_version} confidence={confidence}")
