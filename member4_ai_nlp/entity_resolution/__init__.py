"""Entity Resolution & Human Verification Package for Member 4."""

from .phonetic import double_metaphone, phonetic_similarity_score, soundex
from .resolver import EntityResolver
from .similarity import (
    context_matching_score,
    jaro_winkler_similarity,
    semantic_similarity,
    string_similarity,
)
from .verification import EntityVerificationManager

__all__ = [
    "EntityResolver",
    "EntityVerificationManager",
    "context_matching_score",
    "double_metaphone",
    "jaro_winkler_similarity",
    "phonetic_similarity_score",
    "semantic_similarity",
    "soundex",
    "string_similarity",
]
