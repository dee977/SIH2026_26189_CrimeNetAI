"""
Phonetic Matching Algorithms for Member 4 Entity Resolution.

Implements:
1. Soundex (American + Indian name consonant equivalence normalization)
2. Double Metaphone (Primary and Secondary phonetic keys for spelling variations & transliterations)
3. Cross-script Hindi-English phonetic normalization (via Devanagari transliteration)
"""

from __future__ import annotations

import re
from typing import Tuple

from ..nlp.multilingual import transliterate_devanagari_to_latin


def _clean_alpha(text: str) -> str:
    latin = transliterate_devanagari_to_latin(text)
    return re.sub(r"[^a-zA-Z\s]", "", latin).upper().strip()


def soundex(text: str) -> str:
    """
    Compute 4-character Soundex code for a single word or multi-token name.
    For multi-token names, encodes each token and joins with '-' (e.g., 'R520-K560').
    """
    cleaned = _clean_alpha(text)
    if not cleaned:
        return ""

    tokens = cleaned.split()
    codes = [_soundex_token(tok) for tok in tokens if tok]
    return "-".join(codes)


def _soundex_token(word: str) -> str:
    if not word:
        return ""
    # Normalize common Indian transliteration variants before Soundex
    w = (
        word.replace("PH", "F")
        .replace("BH", "B")
        .replace("DH", "D")
        .replace("TH", "T")
        .replace("KH", "K")
        .replace("GH", "G")
        .replace("SH", "S")
        .replace("CH", "C")
        .replace("V", "W")
    )
    first_letter = w[0]
    mapping = {
        "B": "1",
        "F": "1",
        "P": "1",
        "V": "1",
        "W": "1",
        "C": "2",
        "G": "2",
        "J": "2",
        "K": "2",
        "Q": "2",
        "S": "2",
        "X": "2",
        "Z": "2",
        "D": "3",
        "T": "3",
        "L": "4",
        "M": "5",
        "N": "5",
        "R": "6",
    }
    digits = [first_letter]
    prev_digit = mapping.get(first_letter, "0")
    for ch in w[1:]:
        digit = mapping.get(ch, "0")
        if digit != "0" and digit != prev_digit:
            digits.append(digit)
        prev_digit = digit
        if len(digits) == 4:
            break

    while len(digits) < 4:
        digits.append("0")
    return "".join(digits[:4])


def double_metaphone(text: str) -> Tuple[str, str]:
    """
    Compute Primary and Secondary Double Metaphone keys for an entity name.
    Handles spelling variations such as 'Ramesh'/'Rameshkumar'/'Ramash',
    'Mohammed'/'Muhammad'/'Mohd', 'Sharma'/'Sarma', 'Kumaar'/'Kumar'.
    """
    cleaned = _clean_alpha(text)
    if not cleaned:
        return ("", "")

    tokens = cleaned.split()
    prim_parts = []
    sec_parts = []
    for tok in tokens:
        p, s = _double_metaphone_token(tok)
        if p:
            prim_parts.append(p)
        if s:
            sec_parts.append(s)
    return ("-".join(prim_parts), "-".join(sec_parts))


def _double_metaphone_token(word: str) -> Tuple[str, str]:
    if not word:
        return ("", "")
    # Collapse repeated vowels and consonants ("KUMAAR" -> "KUMAR", "MOHAMMED" -> "MOHAMED")
    w = re.sub(r"(.)\1+", r"\1", word.upper())
    # Normalize Indo-English aspirates
    w_primary = (
        w.replace("PH", "F")
        .replace("SH", "X")
        .replace("CH", "X")
        .replace("TH", "0")
        .replace("DH", "T")
        .replace("BH", "P")
        .replace("KH", "K")
        .replace("GH", "K")
        .replace("V", "F")
        .replace("W", "F")
        .replace("Z", "S")
        .replace("Q", "K")
    )
    w_secondary = (
        w.replace("PH", "P")
        .replace("SH", "S")
        .replace("CH", "K")
        .replace("TH", "T")
        .replace("DH", "D")
        .replace("BH", "B")
        .replace("KH", "K")
        .replace("GH", "G")
        .replace("V", "W")
        .replace("Z", "S")
    )

    def _encode_skeleton(s: str) -> str:
        if not s:
            return ""
        out = []
        for idx, ch in enumerate(s):
            if ch in "AEIOUY":
                if idx == 0:
                    out.append("A")
            elif ch in "BP":
                out.append("P")
            elif ch in "CKQ":
                out.append("K")
            elif ch in "DT":
                out.append("T")
            elif ch in "GJ":
                out.append("J")
            elif ch in "FW":
                out.append("F")
            elif ch in "SZ":
                out.append("S")
            elif ch in "MN":
                out.append(ch)
            elif ch in "LRX0":
                out.append(ch)
        # Deduplicate adjacent identical phonetic symbols
        dedup = []
        for c in out:
            if not dedup or dedup[-1] != c:
                dedup.append(c)
        return "".join(dedup[:6])

    return (_encode_skeleton(w_primary), _encode_skeleton(w_secondary))


def phonetic_similarity_score(name_a: str, name_b: str) -> Tuple[float, bool, bool]:
    """
    Compare two entity names using both Soundex and Double Metaphone.
    Returns (score, soundex_matched, double_metaphone_matched).
    """
    sx_a = soundex(name_a)
    sx_b = soundex(name_b)
    dm_a1, dm_a2 = double_metaphone(name_a)
    dm_b1, dm_b2 = double_metaphone(name_b)

    sx_match = bool(sx_a and sx_b and (sx_a == sx_b or sx_a.replace("-", "") == sx_b.replace("-", "")))
    dm_match = bool(
        dm_a1
        and dm_b1
        and (
            dm_a1 == dm_b1
            or dm_a1 == dm_b2
            or dm_a2 == dm_b1
            or dm_a1.replace("-", "") == dm_b1.replace("-", "")
        )
    )

    if sx_match and dm_match:
        return 0.96, True, True
    if dm_match:
        return 0.91, False, True
    if sx_match:
        return 0.87, True, False
    return 0.0, False, False
