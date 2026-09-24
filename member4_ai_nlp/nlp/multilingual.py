"""
Multilingual Processing & Devanagari/Hinglish Normalization for Member 4.

Supports:
- Hindi (Devanagari), English, and Mixed Hindi-English (Hinglish) text normalization
- Devanagari numeral normalization (०-९ -> 0-9)
- Deterministic Devanagari-to-Latin phonetic transliteration for cross-script Entity Resolution
  (e.g., "रमेश कुमार" <-> "Ramesh Kumar")
- Multilingual Crime & Law Enforcement Lexicon (IPC/BNS offenses, Hindi FIR terms)
"""

from __future__ import annotations

import re
from typing import Dict, List, Tuple

DEVANAGARI_DIGITS_MAP = str.maketrans("०१२३४५६७८९", "0123456789")

# Consonant and vowel mappings for Devanagari to Latin phonetic transliteration
_CONSONANTS: Dict[str, str] = {
    "क": "k",
    "ख": "kh",
    "ग": "g",
    "घ": "gh",
    "ङ": "n",
    "च": "ch",
    "छ": "chh",
    "ज": "j",
    "झ": "jh",
    "ञ": "n",
    "ट": "t",
    "ठ": "th",
    "ड": "d",
    "ढ": "dh",
    "ण": "n",
    "त": "t",
    "थ": "th",
    "द": "d",
    "ध": "dh",
    "न": "n",
    "प": "p",
    "फ": "ph",
    "ब": "b",
    "भ": "bh",
    "म": "m",
    "य": "y",
    "र": "r",
    "ल": "l",
    "व": "v",
    "श": "sh",
    "ष": "sh",
    "स": "s",
    "ह": "h",
    "क़": "q",
    "ख़": "kh",
    "ग़": "gh",
    "ज़": "z",
    "ड़": "r",
    "ढ़": "rh",
    "फ़": "f",
}

_INDEPENDENT_VOWELS: Dict[str, str] = {
    "अ": "a",
    "आ": "aa",
    "इ": "i",
    "ई": "ee",
    "उ": "u",
    "ऊ": "oo",
    "ऋ": "ri",
    "ए": "e",
    "ऐ": "ai",
    "ओ": "o",
    "औ": "au",
}

_MATRAS: Dict[str, str] = {
    "ा": "a",
    "ि": "i",
    "ी": "ee",
    "ु": "u",
    "ू": "u",
    "ृ": "ri",
    "े": "e",
    "ै": "ai",
    "ो": "o",
    "ौ": "au",
    "ं": "n",
    "ँ": "n",
    "ः": "h",
}

_HALANT = "्"
_NUKTA = "़"

# Crime lexicon mapping English & Hindi offenses to (Crime, Normalized Crime Type)
CRIME_LEXICON: List[Tuple[re.Pattern[str], str, str]] = [
    (
        re.compile(r"\b(?:IPC\s*(?:Section\s*|Sec\.?\s*)?420|BNS\s*(?:Section\s*)?318|cheating|financial\s+fraud|cyber\s+fraud|धोखाधड़ी|जालसाजी)\b", re.IGNORECASE),
        "Fraud / Cheating (IPC 420 / BNS 318)",
        "Financial Fraud",
    ),
    (
        re.compile(r"\b(?:IPC\s*(?:Section\s*|Sec\.?\s*)?384|IPC\s*386|BNS\s*308|extortion|ransom|फिरौती|उगाही|रंगदारी)\b", re.IGNORECASE),
        "Extortion / Ransom",
        "Extortion",
    ),
    (
        re.compile(r"\b(?:NDPS\s*Act|narcotics\s+trafficking|drug\s+smuggling|heroin\s+seizure|मादक\s+पदार्थ|तस्करी|नशा\s+तस्करी)\b", re.IGNORECASE),
        "Narcotics / Smuggling Offense",
        "Narcotics & Smuggling",
    ),
    (
        re.compile(r"\b(?:IPC\s*(?:Section\s*|Sec\.?\s*)?302|BNS\s*103|murder|homicide|हत्या|कत्ल)\b", re.IGNORECASE),
        "Murder / Homicide (IPC 302 / BNS 103)",
        "Violent Crime / Homicide",
    ),
    (
        re.compile(r"\b(?:money\s+laundering|PMLA|hawala\s+transfer|hawala|हवाला|मनी\s+लॉन्ड्रिंग)\b", re.IGNORECASE),
        "Money Laundering / Hawala (PMLA)",
        "Money Laundering",
    ),
    (
        re.compile(r"\b(?:arms\s+act|illegal\s+weapons|firearms\s+trafficking|अवैध\s+हथियार|आर्म्स\s+एक्ट)\b", re.IGNORECASE),
        "Illegal Firearms / Arms Act Offense",
        "Arms Trafficking",
    ),
    (
        re.compile(r"\b(?:criminal\s+conspiracy|IPC\s*120B|BNS\s*61|साजिश|आपराधिक\s+षड्यंत्र)\b", re.IGNORECASE),
        "Criminal Conspiracy (IPC 120B / BNS 61)",
        "Organized Crime",
    ),
    (
        re.compile(r"\b(?:robbery|dacoity|heist|IPC\s*392|IPC\s*395|डकैती|लूट)\b", re.IGNORECASE),
        "Robbery / Dacoity",
        "Property & Violent Crime",
    ),
]


def normalize_devanagari_digits(text: str) -> str:
    """Convert Devanagari numerals (०-९) into standard ASCII digits (0-9)."""
    if not text:
        return ""
    return text.translate(DEVANAGARI_DIGITS_MAP)


def transliterate_devanagari_to_latin(text: str) -> str:
    """
    Transliterates Hindi (Devanagari) words to phonetic English/Latin script
    with schwa deletion at word boundaries so Hindi names match English names.
    Example: 'रमेश कुमार' -> 'ramesh kumar'
    """
    if not text:
        return ""
    normalized = normalize_devanagari_digits(text)
    if not any("\u0900" <= ch <= "\u097F" for ch in normalized):
        return normalized.lower().strip()

    tokens = normalized.split()
    out_tokens: List[str] = []

    for token in tokens:
        if not any("\u0900" <= ch <= "\u097F" for ch in token):
            out_tokens.append(token.lower())
            continue

        chars = list(token)
        result: List[str] = []
        i = 0
        n = len(chars)
        while i < n:
            ch = chars[i]
            # Handle consonant + nukta combinations
            if i + 1 < n and chars[i + 1] == _NUKTA and (ch + _NUKTA) in _CONSONANTS:
                ch = ch + _NUKTA
                i += 1

            if ch in _INDEPENDENT_VOWELS:
                result.append(_INDEPENDENT_VOWELS[ch])
            elif ch in _CONSONANTS:
                base = _CONSONANTS[ch]
                next_ch = chars[i + 1] if (i + 1 < n) else None
                if next_ch == _HALANT:
                    result.append(base)
                    i += 1
                elif next_ch in _MATRAS:
                    result.append(base + _MATRAS[next_ch])
                    i += 1
                else:
                    # Word-final schwa deletion in Hindi (e.g. रमेश -> ramesh, not ramesha)
                    is_word_final = (i == n - 1) or not ("\u0900" <= (next_ch or "") <= "\u097F")
                    if is_word_final:
                        result.append(base)
                    else:
                        result.append(base + "a")
            elif ch in _MATRAS:
                result.append(_MATRAS[ch])
            elif ch != _HALANT and ch != _NUKTA:
                result.append(ch.lower())
            i += 1

        out_tokens.append("".join(result))

    return " ".join(out_tokens).strip()


def detect_text_language(text: str) -> str:
    """Detect whether text is 'hi' (Hindi), 'en' (English), or 'hi-en' (Mixed Hindi-English)."""
    if not text:
        return "unavailable"
    has_hi = any("\u0900" <= ch <= "\u097F" for ch in text)
    has_en = any(("A" <= ch <= "Z") or ("a" <= ch <= "z") for ch in text)
    if has_hi and has_en:
        return "hi-en"
    if has_hi:
        return "hi"
    if has_en:
        return "en"
    return "unavailable"
