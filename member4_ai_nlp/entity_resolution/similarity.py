"""
String Similarity, Semantic Similarity (scikit-learn TF-IDF / Cosine), and Context Matching
for Member 4 Entity Resolution.
"""

from __future__ import annotations

from difflib import SequenceMatcher
from typing import Any, Dict, List, Set, Tuple

import numpy as np

from ..nlp.multilingual import transliterate_devanagari_to_latin

try:
    from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
    from sklearn.metrics.pairwise import cosine_similarity  # type: ignore

    HAS_SKLEARN = True
except Exception:  # pragma: no cover
    TfidfVectorizer = None  # type: ignore
    cosine_similarity = None  # type: ignore
    HAS_SKLEARN = False


def jaro_winkler_similarity(s1: str, s2: str, p: float = 0.1) -> float:
    """
    Compute Jaro-Winkler string similarity in [0.0, 1.0] over transliterated/normalized strings.
    Ideal for spelling variations in names, locations, and vehicle plates.
    """
    a = transliterate_devanagari_to_latin(s1).strip().lower()
    b = transliterate_devanagari_to_latin(s2).strip().lower()
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    len_a, len_b = len(a), len(b)
    match_distance = max(len_a, len_b) // 2 - 1
    if match_distance < 0:
        match_distance = 0

    a_matches = [False] * len_a
    b_matches = [False] * len_b
    matches = 0
    transpositions = 0

    for i in range(len_a):
        start = max(0, i - match_distance)
        end = min(i + match_distance + 1, len_b)
        for j in range(start, end):
            if b_matches[j] or a[i] != b[j]:
                continue
            a_matches[i] = True
            b_matches[j] = True
            matches += 1
            break

    if matches == 0:
        return 0.0

    k = 0
    for i in range(len_a):
        if not a_matches[i]:
            continue
        while not b_matches[k]:
            k += 1
        if a[i] != b[k]:
            transpositions += 1
        k += 1

    jaro = (
        (matches / len_a)
        + (matches / len_b)
        + ((matches - transpositions / 2.0) / matches)
    ) / 3.0

    # Common prefix up to 4 characters
    prefix = 0
    for ch1, ch2 in zip(a[:4], b[:4]):
        if ch1 == ch2:
            prefix += 1
        else:
            break

    return float(min(1.0, jaro + prefix * p * (1.0 - jaro)))


def string_similarity(s1: str, s2: str) -> float:
    """
    Composite string similarity combining Jaro-Winkler and character SequenceMatcher ratio.
    """
    jw = jaro_winkler_similarity(s1, s2)
    a = transliterate_devanagari_to_latin(s1).strip().lower()
    b = transliterate_devanagari_to_latin(s2).strip().lower()
    seq = SequenceMatcher(None, a, b).ratio() if (a and b) else 0.0
    return round(float(0.65 * jw + 0.35 * seq), 4)


def semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Compute semantic similarity between two entity profiles/contexts using
    scikit-learn character + word n-gram TF-IDF cosine similarity.
    """
    norm_a = transliterate_devanagari_to_latin(text_a).strip().lower()
    norm_b = transliterate_devanagari_to_latin(text_b).strip().lower()
    if not norm_a or not norm_b:
        return 0.0
    if norm_a == norm_b:
        return 1.0

    if HAS_SKLEARN:
        try:
            vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))
            matrix = vec.fit_transform([norm_a, norm_b])
            sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
            return round(max(0.0, min(1.0, sim)), 4)
        except Exception:
            pass

    # Fallback token + character n-gram cosine similarity
    grams_a = {norm_a[i : i + 3] for i in range(max(1, len(norm_a) - 2))}
    grams_b = {norm_b[i : i + 3] for i in range(max(1, len(norm_b) - 2))}
    if not grams_a or not grams_b:
        return 0.0
    intersection = len(grams_a & grams_b)
    denom = float(np.sqrt(len(grams_a) * len(grams_b)))
    return round(intersection / denom, 4) if denom > 0 else 0.0


def context_matching_score(
    record_a: Dict[str, Any], record_b: Dict[str, Any]
) -> Tuple[float, List[str]]:
    """
    Evaluate contextual overlap between two entity records across:
    - Alias linkages (`alias`, `alias_of`)
    - Shared Phone / MSISDN
    - Shared Bank Account / UPI
    - Shared Vehicle registration
    - Shared FIR reference or Case / Location context
    Returns (context_score, matched_context_fields).
    """
    matched_fields: List[str] = []
    score = 0.0

    attrs_a = record_a.get("attributes", {}) or {}
    attrs_b = record_b.get("attributes", {}) or {}

    val_a = transliterate_devanagari_to_latin(
        str(record_a.get("normalized_value") or record_a.get("value", ""))
    ).lower()
    val_b = transliterate_devanagari_to_latin(
        str(record_b.get("normalized_value") or record_b.get("value", ""))
    ).lower()

    alias_a = transliterate_devanagari_to_latin(str(attrs_a.get("alias") or attrs_a.get("alias_of") or "")).lower()
    alias_b = transliterate_devanagari_to_latin(str(attrs_b.get("alias") or attrs_b.get("alias_of") or "")).lower()

    if (alias_a and (alias_a == val_b or alias_a == alias_b)) or (
        alias_b and (alias_b == val_a)
    ):
        matched_fields.append("alias")
        score = max(score, 0.94)

    for key in ("phone", "msisdn", "bank_account", "vehicle", "fir_number", "location"):
        v1 = str(record_a.get(key) or attrs_a.get(key) or "").strip().lower()
        v2 = str(record_b.get(key) or attrs_b.get(key) or "").strip().lower()
        if v1 and v2 and v1 == v2:
            matched_fields.append(key)
            score = min(0.98, max(score, 0.85) + 0.05)

    # Cross-source indicator: same case or overlapping relational neighborhood
    neighbors_a: Set[str] = {
        str(x).lower() for x in (record_a.get("related_entities") or attrs_a.get("related_entities") or [])
    }
    neighbors_b: Set[str] = {
        str(x).lower() for x in (record_b.get("related_entities") or attrs_b.get("related_entities") or [])
    }
    if neighbors_a and neighbors_b and (neighbors_a & neighbors_b):
        matched_fields.append("relational_context")
        score = max(score, 0.82)

    return round(score, 4), matched_fields
