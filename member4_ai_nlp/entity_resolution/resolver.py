"""
Entity Resolution Engine for Member 4.

Detects:
- Duplicate Entities
- Spelling Variations
- Aliases
- Phonetic Similarity (Double Metaphone, Soundex, Hindi-English Transliteration)
- Semantic Similarity (TF-IDF character/word n-gram cosine similarity)
- Cross-source Matches (FIRs, CDRs, Police Reports, Bank Logs)

For every potential match provides:
- Candidate A
- Candidate B
- Matching Fields
- Matching Method
- Confidence
- Original Source Records
- Explainable AI Trace

NEVER silently merges uncertain entities.
"""

from __future__ import annotations

import copy
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from ..contracts.schemas import (
    UNAVAILABLE,
    EntityMatchCandidate,
    ExtractedEntity,
    MatchingMethod,
    VerificationAction,
)
from ..explainability.explainer import ExplainableAIBuilder, validate_no_risk_score
from ..nlp.multilingual import transliterate_devanagari_to_latin
from .phonetic import double_metaphone, phonetic_similarity_score, soundex
from .similarity import context_matching_score, semantic_similarity, string_similarity


class EntityResolver:
    """
    Multi-method Entity Resolution service.
    Generates explainable match candidates without destroying or silently merging source records.
    """

    def __init__(self, candidate_threshold: float = 0.72) -> None:
        self.candidate_threshold = candidate_threshold

    @staticmethod
    def _normalize_record(item: Union[ExtractedEntity, Dict[str, Any]]) -> Dict[str, Any]:
        if isinstance(item, ExtractedEntity):
            return item.to_dict()
        return copy.deepcopy(item)

    def compare_pair(
        self,
        record_a: Union[ExtractedEntity, Dict[str, Any]],
        record_b: Union[ExtractedEntity, Dict[str, Any]],
    ) -> Optional[EntityMatchCandidate]:
        """
        Evaluate whether two entity records represent a potential match across
        Double Metaphone, Soundex, String Similarity, Semantic Similarity, and Context Matching.
        """
        a = self._normalize_record(record_a)
        b = self._normalize_record(record_b)

        id_a = str(a.get("entity_id") or a.get("id") or "A")
        id_b = str(b.get("entity_id") or b.get("id") or "B")
        if id_a == id_b and a.get("document_id") == b.get("document_id"):
            return None

        type_a = str(a.get("entity_type") or "Person")
        type_b = str(b.get("entity_type") or "Person")
        if type_a != type_b:
            return None

        val_a = str(a.get("value") or a.get("name") or "")
        val_b = str(b.get("value") or b.get("name") or "")
        norm_a = transliterate_devanagari_to_latin(str(a.get("normalized_value") or val_a)).strip()
        norm_b = transliterate_devanagari_to_latin(str(b.get("normalized_value") or val_b)).strip()

        if not norm_a or not norm_b:
            return None

        matching_fields: List[str] = []
        matching_methods: List[str] = []
        method_scores: Dict[str, float] = {}

        # 1. Exact or Transliterated Normalized Match
        has_cross_script = (val_a != norm_a) or (val_b != norm_b)
        if norm_a.lower() == norm_b.lower():
            matching_fields.append("normalized_value")
            matching_methods.append(MatchingMethod.EXACT_NORMALIZED.value)
            method_scores["exact_normalized"] = 0.98
            if has_cross_script:
                matching_fields.append("transliterated_name")
                matching_methods.append(MatchingMethod.TRANSLITERATION_PHONETIC.value)
                method_scores["transliteration_phonetic"] = 0.96

        # 2. Phonetic Similarity (Soundex + Double Metaphone)
        phon_score, sx_hit, dm_hit = phonetic_similarity_score(norm_a, norm_b)
        if sx_hit:
            matching_fields.append("phonetic_soundex")
            matching_methods.append(MatchingMethod.SOUNDEX.value)
            method_scores["soundex"] = round(max(phon_score, 0.87), 4)
        if dm_hit:
            matching_fields.append("phonetic_double_metaphone")
            matching_methods.append(MatchingMethod.DOUBLE_METAPHONE.value)
            method_scores["double_metaphone"] = round(max(phon_score, 0.91), 4)

        # 3. String Similarity (Jaro-Winkler + SequenceMatcher)
        str_sim = string_similarity(norm_a, norm_b)
        method_scores["string_similarity"] = str_sim
        if str_sim >= 0.78:
            matching_fields.append("name_spelling")
            matching_methods.append(MatchingMethod.STRING_SIMILARITY.value)

        # 4. Semantic Similarity (TF-IDF Cosine over name + context snippet + attributes)
        context_text_a = f"{norm_a} {a.get('source', '')} {a.get('attributes', {})}"
        context_text_b = f"{norm_b} {b.get('source', '')} {b.get('attributes', {})}"
        sem_sim = semantic_similarity(context_text_a, context_text_b)
        method_scores["semantic_similarity"] = sem_sim
        if sem_sim >= 0.65:
            matching_fields.append("semantic_profile")
            matching_methods.append(MatchingMethod.SEMANTIC_SIMILARITY.value)

        # 5. Context & Alias Matching
        ctx_score, ctx_fields = context_matching_score(a, b)
        if ctx_score > 0:
            method_scores["context_matching"] = ctx_score
            matching_fields.extend(ctx_fields)
            matching_methods.append(MatchingMethod.CONTEXT_MATCHING.value)

        # Compute composite confidence (weighted best signals without silent merging)
        active_scores = [v for v in method_scores.values() if v > 0]
        if not active_scores:
            return None

        best_signal = max(active_scores)
        corroboration_bonus = min(0.06, 0.02 * max(0, len(matching_methods) - 1))
        composite_confidence = round(min(0.99, best_signal * 0.92 + str_sim * 0.08 + corroboration_bonus), 4)

        if composite_confidence < self.candidate_threshold or not matching_methods:
            return None

        # Deduplicate fields and methods while preserving order
        matching_fields = list(dict.fromkeys(matching_fields))
        matching_methods = list(dict.fromkeys(matching_methods))

        doc_a = str(a.get("document_id") or a.get("source") or UNAVAILABLE)
        doc_b = str(b.get("document_id") or b.get("source") or UNAVAILABLE)
        is_cross_source = doc_a != doc_b

        ts_a = str(a.get("timestamp") or UNAVAILABLE)
        ts_b = str(b.get("timestamp") or UNAVAILABLE)
        supporting_ts = ts_a if ts_a != UNAVAILABLE else ts_b

        match_id = f"MATCH-{uuid.uuid5(uuid.NAMESPACE_DNS, f'{id_a}:{id_b}').hex[:8].upper()}"

        explanation = ExplainableAIBuilder.for_entity_match(
            candidate_a_label=f"{val_a} ({doc_a})",
            candidate_b_label=f"{val_b} ({doc_b})",
            matching_fields=matching_fields,
            matching_methods=matching_methods,
            supporting_sources=[doc_a, doc_b],
            supporting_timestamp=supporting_ts,
            confidence=composite_confidence,
            algorithm_or_model="Hybrid Entity Resolver (Double Metaphone + Soundex + Jaro-Winkler + TF-IDF Cosine + Context Matcher)",
            method_scores=method_scores,
        )

        candidate = EntityMatchCandidate(
            match_id=match_id,
            candidate_a={
                "entity_id": id_a,
                "value": val_a,
                "normalized_value": norm_a,
                "entity_type": type_a,
                "document_id": doc_a,
                "case_id": a.get("case_id", UNAVAILABLE),
                "evidence_id": a.get("evidence_id", UNAVAILABLE),
                "soundex": soundex(norm_a),
                "double_metaphone": list(double_metaphone(norm_a)),
            },
            candidate_b={
                "entity_id": id_b,
                "value": val_b,
                "normalized_value": norm_b,
                "entity_type": type_b,
                "document_id": doc_b,
                "case_id": b.get("case_id", UNAVAILABLE),
                "evidence_id": b.get("evidence_id", UNAVAILABLE),
                "soundex": soundex(norm_b),
                "double_metaphone": list(double_metaphone(norm_b)),
            },
            matching_fields=matching_fields,
            matching_method=matching_methods,
            confidence=composite_confidence,
            original_source_records={
                "candidate_a_original": copy.deepcopy(a),
                "candidate_b_original": copy.deepcopy(b),
            },
            verification_status=VerificationAction.PENDING.value,
            explanation=explanation,
            resolution_metadata={
                "is_cross_source_match": is_cross_source,
                "auto_merged": False,  # Never silently merge uncertain entities
                "requires_human_verification": True,
                "method_scores": method_scores,
            },
        )
        validate_no_risk_score(candidate.to_dict())
        return candidate

    def find_matches(
        self, records: List[Union[ExtractedEntity, Dict[str, Any]]]
    ) -> List[EntityMatchCandidate]:
        """
        Detect all candidate matches across a collection of extracted entities/records.
        Sorted in descending order of match confidence.
        """
        candidates: List[EntityMatchCandidate] = []
        n = len(records)
        for i in range(n):
            for j in range(i + 1, n):
                match = self.compare_pair(records[i], records[j])
                if match is not None:
                    candidates.append(match)

        candidates.sort(key=lambda m: m.confidence, reverse=True)
        return candidates
