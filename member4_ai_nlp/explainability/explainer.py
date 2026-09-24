"""
Explainable AI (XAI) & Anti-Risk-Score Guardrail Module for Member 4.

Responsibilities:
1. Explain why an entity was extracted (pattern/span, context clue, model/algorithm, confidence, source, timestamp).
2. Explain why two records were matched (matching fields, methods, per-method scores, source records, timestamp).
3. Explain why a relationship was extracted (trigger predicates, entity spans, confidence, source, timestamp).
4. Strictly enforce the NO RISK SCORE policy:
   - Never allow risk_score, risk_label, criminal_probability, fake_threat_score,
     or automatic_criminal_classification in any output payload.
"""

from __future__ import annotations

from typing import Any, Dict, List, Set, Union

from ..contracts.schemas import UNAVAILABLE, ExplainabilityTrace

FORBIDDEN_RISK_KEYS: Set[str] = {
    "risk_score",
    "risk_label",
    "criminal_probability",
    "fake_threat_score",
    "automatic_criminal_classification",
    "threat_score",
    "guilt_score",
    "criminal_score",
}


class RiskScorePolicyViolationError(ValueError):
    """Raised if any M4 payload contains forbidden risk/criminal scoring fields."""


class ExplainableAIBuilder:
    """
    Constructs structured, human-auditable ExplainabilityTrace objects
    for entities, relationships, and entity resolution matches.
    """

    @staticmethod
    def for_entity(
        entity_type: str,
        value: str,
        supporting_source: str,
        supporting_snippet: str,
        supporting_timestamp: str,
        confidence: float,
        algorithm_or_model: str,
        trigger_detail: str,
        feature_breakdown: Dict[str, Any] | None = None,
    ) -> ExplainabilityTrace:
        reason = (
            f"Extracted '{value}' as [{entity_type}] via {algorithm_or_model} "
            f"({trigger_detail}) with extraction confidence {confidence:.2f} "
            f"from source '{supporting_source}'."
        )
        return ExplainabilityTrace(
            finding_type="entity_extraction",
            reason=reason,
            supporting_source=supporting_source or UNAVAILABLE,
            supporting_snippet=supporting_snippet or UNAVAILABLE,
            supporting_timestamp=supporting_timestamp or UNAVAILABLE,
            confidence=round(float(confidence), 4),
            algorithm_or_model=algorithm_or_model or UNAVAILABLE,
            feature_breakdown=feature_breakdown or {"trigger": trigger_detail},
        )

    @staticmethod
    def for_relationship(
        relationship_type: str,
        source_entity: str,
        target_entity: str,
        supporting_source: str,
        supporting_snippet: str,
        supporting_timestamp: str,
        confidence: float,
        algorithm_or_model: str,
        trigger_phrase: str,
        feature_breakdown: Dict[str, Any] | None = None,
    ) -> ExplainabilityTrace:
        reason = (
            f"Extracted relationship ({source_entity}) -[{relationship_type}]-> ({target_entity}) "
            f"via {algorithm_or_model} triggered by evidence phrase '{trigger_phrase}' "
            f"(confidence={confidence:.2f}, source='{supporting_source}', timestamp='{supporting_timestamp}')."
        )
        return ExplainabilityTrace(
            finding_type="relationship_extraction",
            reason=reason,
            supporting_source=supporting_source or UNAVAILABLE,
            supporting_snippet=supporting_snippet or UNAVAILABLE,
            supporting_timestamp=supporting_timestamp or UNAVAILABLE,
            confidence=round(float(confidence), 4),
            algorithm_or_model=algorithm_or_model or UNAVAILABLE,
            feature_breakdown=feature_breakdown
            or {
                "trigger_phrase": trigger_phrase,
                "source_entity": source_entity,
                "target_entity": target_entity,
            },
        )

    @staticmethod
    def for_entity_match(
        candidate_a_label: str,
        candidate_b_label: str,
        matching_fields: List[str],
        matching_methods: List[str],
        supporting_sources: List[str],
        supporting_timestamp: str,
        confidence: float,
        algorithm_or_model: str,
        method_scores: Dict[str, float],
    ) -> ExplainabilityTrace:
        methods_str = ", ".join(matching_methods)
        fields_str = ", ".join(matching_fields)
        sources_str = ", ".join(sorted(set(s for s in supporting_sources if s))) or UNAVAILABLE
        reason = (
            f"Matched Candidate A ('{candidate_a_label}') and Candidate B ('{candidate_b_label}') "
            f"across fields [{fields_str}] using methods [{methods_str}] with composite "
            f"confidence {confidence:.2f} (sources: {sources_str}). "
            f"Original source records preserved pending human verification."
        )
        return ExplainabilityTrace(
            finding_type="entity_resolution",
            reason=reason,
            supporting_source=sources_str,
            supporting_snippet=f"Candidate A: {candidate_a_label} <-> Candidate B: {candidate_b_label}",
            supporting_timestamp=supporting_timestamp or UNAVAILABLE,
            confidence=round(float(confidence), 4),
            algorithm_or_model=algorithm_or_model,
            feature_breakdown={
                "matching_fields": matching_fields,
                "matching_methods": matching_methods,
                "method_scores": {k: round(v, 4) for k, v in method_scores.items()},
            },
        )


def validate_no_risk_score(payload: Union[Dict[str, Any], List[Any], Any]) -> bool:
    """
    Recursively inspects a dictionary/list payload and raises RiskScorePolicyViolationError
    if any forbidden risk score / automatic criminal classification field is present.
    """
    if isinstance(payload, dict):
        for key, value in payload.items():
            normalized_key = str(key).strip().lower()
            if normalized_key in FORBIDDEN_RISK_KEYS:
                raise RiskScorePolicyViolationError(
                    f"Forbidden field '{key}' detected. M4 strictly prohibits risk_score, "
                    "risk_label, criminal_probability, fake_threat_score, or automatic criminal classification."
                )
            validate_no_risk_score(value)
    elif isinstance(payload, list):
        for item in payload:
            validate_no_risk_score(item)
    return True
