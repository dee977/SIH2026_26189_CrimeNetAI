"""NLP, Multilingual Processing, NER, and Relationship Extraction Package for Member 4."""

from .entity_extractor import ForensicEntityExtractor
from .multilingual import (
    CRIME_LEXICON,
    detect_text_language,
    normalize_devanagari_digits,
    transliterate_devanagari_to_latin,
)
from .pipeline import NLPPipeline
from .relationship_extractor import ForensicRelationshipExtractor

__all__ = [
    "CRIME_LEXICON",
    "ForensicEntityExtractor",
    "ForensicRelationshipExtractor",
    "NLPPipeline",
    "detect_text_language",
    "normalize_devanagari_digits",
    "transliterate_devanagari_to_latin",
]
