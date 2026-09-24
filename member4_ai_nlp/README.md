# Member 4 — AI / NLP / OCR / Entity Resolution & Evidence-Grounded RAG Assistant

**Project:** CrimeNet AI — AI-Powered Criminal Network Analysis System  
**SIH Problem ID:** SIH26189  
**Role:** M4 — AI/NLP/OCR/Entity Resolution Engineer  
**Exclusive Ownership Folder:** `member4_ai_nlp/`

---

## 1. Architecture & Ownership Boundaries

### Owned Exclusively by Member 4 (`member4_ai_nlp/`)
- **OCR & Document Processing** (`ocr/`): FIR PDF OCR, Scanned Document OCR, Image OCR, Hindi OCR (`hin`), English OCR (`eng`), and Mixed Hindi-English OCR (`hin+eng`) with Investigator Text Inspection & Verification.
- **Image Preprocessing** (`ocr/preprocessing.py`): OpenCV Deskew, Otsu Binarization, and Gaussian Adaptive Thresholding.
- **Multilingual NLP & NER** (`nlp/`): Named Entity Recognition for all 12 forensic entity categories and Devanagari/Hinglish/English normalization.
- **Relationship Extraction** (`nlp/relationship_extractor.py`): Extraction of evidence-backed relationships mapped to M3 Neo4j graph-compatible relationship types.
- **Entity Resolution & Human Verification** (`entity_resolution/`): Duplicate detection, spelling variations, aliases, phonetic matching (Soundex, Double Metaphone, Hindi-English transliteration), semantic similarity (scikit-learn TF-IDF cosine), context matching, and non-destructive human verification (`Accept Match`, `Reject Match`, `Keep Separate`).
- **Evidence-Grounded AI Investigation Assistant (RAG)** (`assistant/`): Multi-source RAG engine over structured data, M3 Neo4j graph contracts, source documents, evidence metadata, and case context with strict M6 authorization enforcement.
- **Explainable AI & Anti-Risk-Score Guardrails** (`explainability/`): Full provenance traces on every extracted entity, relationship, and match candidate, plus zero-tolerance validation prohibiting `risk_score`, `risk_label`, `criminal_probability`, `fake_threat_score`, and automatic criminal classification.

### Strictly Excluded (Delegated via Contracts)
- **M1:** Frontend UI (`member1_frontend/`)
- **M2:** FastAPI business infrastructure & endpoint routing (`member2_backend/`)
- **M3:** Neo4j database driver / graph importer
- **M5:** Graph analytics (PageRank, Louvain community detection) & anomaly ML
- **M6:** RBAC, Supabase security, SHA-256 hashing, evidence ledger, and deployment

---

## 2. Package Structure

```text
member4_ai_nlp/
├── README.md
├── requirements.txt
├── __init__.py
├── service.py                      # Unified CrimeNetAINLPService facade for M2 orchestration
├── contracts/
│   ├── __init__.py
│   ├── schemas.py                  # Core schemas: OCRResult, ExtractedEntity, ExtractedRelationship, StructuredExtractionOutput, EntityMatchCandidate, AssistantResponse
│   └── integration_contracts.py    # M1/M2/M3/M5/M6 integration protocols & AuthorizationContext
├── explainability/
│   ├── __init__.py
│   └── explainer.py                # ExplainableAIBuilder & validate_no_risk_score guardrail
├── ocr/
│   ├── __init__.py
│   ├── preprocessing.py            # OpenCV Deskew, Binarization (Otsu), Adaptive Thresholding
│   └── ocr_pipeline.py             # PyMuPDF + Tesseract OCR (Hindi/English/Mixed) + Investigator verification
├── nlp/
│   ├── __init__.py
│   ├── multilingual.py             # Devanagari-to-Latin phonetic transliteration, numeral normalization, IPC/BNS lexicon
│   ├── entity_extractor.py         # 12-type NER (spaCy + Transformers + Forensic Gazetteer/Regex)
│   ├── relationship_extractor.py   # Graph-compatible relationship extraction with provenance
│   └── pipeline.py                 # NLPPipeline & M3GraphPayloadContract emitter
├── entity_resolution/
│   ├── __init__.py
│   ├── phonetic.py                 # Soundex, Double Metaphone & Indo-Aryan phonetic keys
│   ├── similarity.py               # Jaro-Winkler string similarity, TF-IDF cosine semantic similarity, context matching
│   ├── resolver.py                 # EntityResolver generating explainable candidates without silent merging
│   └── verification.py             # EntityVerificationManager (Accept Match, Reject Match, Keep Separate) preserving original records
├── assistant/
│   ├── __init__.py
│   ├── query_engine.py             # Investigative question classifier & BFS graph/timeline path finder
│   └── rag_service.py              # EvidenceGroundedRAGAssistant enforcing M6 AuthorizationContext
└── tests/
    ├── __init__.py
    └── test_m4_suite.py            # Automated verification suite covering OCR, NER, ER, RAG, Auth & Guardrails
```

---

## 3. OCR Pipeline & Preprocessing

### 3.1 Supported Document Inputs & Languages
- **Document Types:** `PDF`, `Scanned Document`, `Image`, `FIR`, `Police Report`, `CDR text`, `Investigation document`.
- **Languages:**
  - English OCR (`eng`)
  - Hindi OCR (`hin`)
  - Mixed Hindi-English OCR (`hin+eng`)
- **Hybrid PDF Handling (`OCRPipeline.process_document`):**
  1. Uses **PyMuPDF (`fitz`)** to inspect PDF pages for native UTF-8 text layers.
  2. Rasterizes scanned/image pages at 200 DPI into NumPy arrays, passes them through OpenCV preprocessing, and executes **Tesseract OCR (`pytesseract`)** with `--oem 3 --psm 6 -l hin+eng`.

### 3.2 Preprocessing (`DocumentPreprocessor`)
1. **Grayscale Conversion:** Converts BGR/BGRA scans to 8-bit single-channel luminance images.
2. **Deskew (`deskew`):** Inverts foreground ink pixels, computes minimum-area bounding box angle via `cv2.minAreaRect`, and corrects rotational skew (`cv2.getRotationMatrix2D` + `cv2.warpAffine`).
3. **Binarization (`binarize`):** Applies Gaussian smoothing (`cv2.GaussianBlur`) followed by Otsu's global thresholding (`cv2.THRESH_BINARY | cv2.THRESH_OTSU`).
4. **Adaptive Thresholding (`adaptive_threshold`):** Applies median filtering (`cv2.medianBlur`) and local Gaussian adaptive thresholding (`cv2.ADAPTIVE_THRESH_GAUSSIAN_C`) to handle uneven illumination, creases, and police station seal/stamp overlays on FIRs.

### 3.3 Investigator Text Inspection & Verification
- Investigators can inspect page-by-page OCR segments (`PageOCRSegment`) and submit verification corrections via `OCRPipeline.inspect_and_verify_text(ocr_result, inspector_id, verified_text, notes)`.
- **Original OCR text (`ocr_result.extracted_text`) is never overwritten or destroyed**; verified text is stored in `ocr_result.verified_text` with an immutable audit entry in `ocr_result.verification_history` (`TextVerificationRecord`).

---

## 4. NLP Pipeline & Named Entity Recognition (NER)

### 4.1 Extracted Entity Types (12 Categories)
`ForensicEntityExtractor` combines **spaCy**, **Hugging Face Transformers**, and **Multilingual Forensic Gazetteer/Pattern Recognizers** to extract:
1. **`Person`**: English and Hindi names, honorifics (`Shri`, `Smt`, `Md.`, `Accused`, `Suspect`, `अभियुक्त`, `आरोपी`, `शिकायतकर्ता`), and aliases (`urf`, `alias`, `उर्फ़`).
2. **`Organization`**: Shell companies, traders, enterprises, banks, syndicates, and cartels.
3. **`Location`**: Police stations (`PS`, `Thana`, `थाना`), cities, districts, and crime scene coordinates.
4. **`Vehicle`**: Indian RTO registration numbers (e.g., `MH-12-AB-4567`, `DL 01 C AA 1111`).
5. **`Phone`**: Indian mobile/landline numbers (`+91-9876543210`) and CDR MSISDNs (supporting Devanagari digits `०-९`).
6. **`Bank Account`**: Bank account numbers (`9–18` digits), IFSC codes (`SBIN0004321`), and UPI IDs (`name@bank`).
7. **`FIR Number`**: Standard and bilingual FIR identifiers (`FIR-10234`, `FIR No. 10234/2026`, `प्रथम सूचना रिपोर्ट सं. 10234/2026`).
8. **`Crime`**: Specific statutory offenses (`IPC Section 420`, `BNS 318`, `IPC 302`, `NDPS Act`, `धोखाधड़ी`, `फिरौती`).
9. **`Date`**: ISO timestamps, `DD/MM/YYYY`, textual dates, and CDR call timestamps.
10. **`Event`**: Operational/criminal occurrences (`cash handover`, `hawala transaction`, `armed raid`, `vehicle interception`).
11. **`Relationship`**: Explicit relational predicates (`conspired with`, `transferred funds to`, `called`, `associate of`).
12. **`Crime Type`**: Normalized offense taxonomy (`Financial Fraud`, `Extortion`, `Narcotics & Smuggling`, `Money Laundering`, `Organized Crime`, `Violent Crime / Homicide`).

### 4.2 Entity Schema (`ExtractedEntity`)
```json
{
  "entity_id": "ENT-PER-8F3A12B9",
  "entity_type": "Person",
  "value": "रमेश कुमार",
  "normalized_value": "Ramesh Kumar",
  "confidence": 0.91,
  "document_id": "DOC-FIR-10234",
  "case_id": "CASE-2026-01",
  "evidence_id": "EVID-001",
  "source": "FIR_10234.pdf",
  "timestamp": "2026-09-10 14:30",
  "start_char": 142,
  "end_char": 152,
  "language": "hi-en",
  "attributes": {
    "original_script": "Devanagari",
    "transliterated_name": "Ramesh Kumar",
    "phonetic_latin": "ramesh kumar",
    "alias": "Raju"
  },
  "explanation": {
    "finding_type": "entity_extraction",
    "reason": "Extracted 'रमेश कुमार' as [Person] via Multilingual Hindi NER + Transliteration Engine...",
    "supporting_source": "FIR_10234.pdf",
    "supporting_snippet": "...Accused Ramesh Kumar alias Raju (अभियुक्त रमेश कुमार उर्फ राजू)...",
    "supporting_timestamp": "2026-09-10 14:30",
    "confidence": 0.91,
    "algorithm_or_model": "Multilingual Hindi NER + Transliteration Engine"
  }
}
```

### 4.3 Relationship Schema (`ExtractedRelationship`)
Relationships are extracted by `ForensicRelationshipExtractor` and mapped to M3 Neo4j graph-compatible relationship types:
- `NAMED_IN_FIR`
- `COMMUNICATED_WITH`
- `TRANSFERRED_FUNDS_TO`
- `OWNS_VEHICLE`
- `USES_PHONE`
- `HOLDS_ACCOUNT`
- `LOCATED_AT`
- `OCCURRED_AT`
- `PARTICIPATED_IN_EVENT`
- `INVOLVED_IN_CRIME`
- `MEMBER_OF`
- `ALIAS_OF`
- `ASSOCIATED_WITH`

```json
{
  "relationship_id": "REL-4C91A0E2",
  "relationship": "TRANSFERRED_FUNDS_TO",
  "source_entity_id": "ENT-BAN-102938",
  "source_entity_value": "102938475610",
  "source_entity_type": "Bank Account",
  "target_entity_id": "ENT-BAN-998877",
  "target_entity_value": "998877665544",
  "target_entity_type": "Bank Account",
  "source": "FIR_10234.pdf",
  "timestamp": "2026-09-10 14:30",
  "case": "CASE-2026-01",
  "evidence": "EVID-001",
  "confidence": 0.92,
  "evidence_snippet": "transferred Rs. 15,00,000 from Account No: 102938475610 to Account No: 998877665544",
  "explanation": {
    "finding_type": "relationship_extraction",
    "reason": "Extracted relationship (102938475610) -[TRANSFERRED_FUNDS_TO]-> (998877665544)...",
    "supporting_source": "FIR_10234.pdf",
    "supporting_timestamp": "2026-09-10 14:30",
    "confidence": 0.92,
    "algorithm_or_model": "Financial Transaction Path Extractor"
  }
}
```

---

## 5. Entity Resolution, Matching Methods & Human Verification

### 5.1 Matching Methods (`entity_resolution/`)
1. **Double Metaphone (`double_metaphone`)**: Computes primary and secondary phonetic keys handling Indian/English spelling variations (`"Ramesh Kumaar"` <-> `"Rameshkumar"`, `"Mohammed"` <-> `"Mohd"`).
2. **Soundex (`soundex`)**: Computes 4-character phonetic consonant codes across multi-token names (`R520-K560`).
3. **Hindi-English Transliteration Phonetic (`transliterate_devanagari_to_latin`)**: Converts Devanagari script (`"रमेश कुमार"`) into schwa-deleted Latin phonetic forms (`"ramesh kumar"`) before phonetic and string comparison.
4. **String Similarity (`string_similarity`)**: Weighted combination of **Jaro-Winkler similarity** (`0.65`) and character `SequenceMatcher` ratio (`0.35`).
5. **Semantic Similarity (`semantic_similarity`)**: `scikit-learn` `TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))` + `cosine_similarity` across entity profiles and context snippets.
6. **Context Matching (`context_matching_score`)**: Evaluates shared phones (`msisdn`), bank accounts, vehicle plates, aliases (`urf`), FIR numbers, and relational neighborhoods across different source documents.

### 5.2 Match Output (`EntityMatchCandidate`) & Human Verification (`EntityVerificationManager`)
- **No Silent Merging:** `EntityResolver` never automatically overwrites or merges uncertain records (`auto_merged: False`, `requires_human_verification: True`).
- **Human Verification Actions (`EntityVerificationManager.apply_human_decision`):**
  - `Accept Match`: Links Candidate A and Candidate B under a non-destructive `canonical_entity_id` while preserving both original source records in full.
  - `Reject Match`: Marks the pair as non-matching and preserves both original records.
  - `Keep Separate`: Explicitly keeps records separate for independent investigative tracking while preserving original records.

---

## 6. Confidence & Missing Information Handling

- **Confidence Calculation:**
  - **OCR Confidence:** Mean word-level Tesseract confidence scaled to `[0.0, 1.0]` or `"unavailable"` if unavailable.
  - **NER & Relationship Confidence:** Calibrated extraction confidence in `[0.0, 1.0]` reflecting recognizer precision and contextual corroboration.
  - **Entity Resolution Confidence:** Weighted ensemble of best matching method signal (`0.92`), Jaro-Winkler string similarity (`0.08`), and multi-method corroboration bonus (`+0.02` per corroborating method, capped at `0.99`).
- **Zero Fabrication Rule:** If any field (`case_id`, `evidence_id`, `timestamp`, `graph_path`, or `ocr_confidence`) cannot be extracted or was not supplied, it is explicitly marked `"unavailable"`.

---

## 7. AI Investigation Assistant & RAG Flow

### 7.1 Supported Investigative Queries (`EvidenceGroundedRAGAssistant`)
1. **How is Person A connected to FIR-10234?** (`ENTITY_TO_FIR_CONNECTION`)
2. **What relationships does Person A have?** (`ENTITY_RELATIONSHIPS`)
3. **What happened before an event?** (`TEMPORAL_BEFORE`)
4. **What happened after an event?** (`TEMPORAL_AFTER`)
5. **Which evidence supports this relationship?** (`EVIDENCE_SUPPORT`)
6. **Which sources mention this person?** (`SOURCE_MENTIONS`)
7. **What communications connect these entities?** (`COMMUNICATION_PATH`)
8. **What transaction path exists?** (`TRANSACTION_PATH`)

### 7.2 RAG Retrieval Flow
1. **M6 Authorization Gate:** Validates `AuthorizationContext` (`user_id`, `is_authenticated`, `authorized_case_ids`, `authorized_evidence_ids`, `authorized_document_ids`). Unauthorized requests immediately raise `AuthorizationViolationError`.
2. **Guardrail Check:** Queries asking for final legal conclusions, guilt determinations, criminal probabilities, or risk scores are intercepted and refused with an explicit policy explanation.
3. **Multi-Source Retrieval:** Queries the authorized slice of:
   - Structured NLP extractions (`StructuredExtractionOutput`)
   - M3 Neo4j graph structures (`GraphDataProvider` protocol + BFS multi-hop path reconstruction)
   - Source OCR documents (`OCRResult`)
   - Evidence metadata & case context
4. **Evidence-Grounded Response Synthesis (`AssistantResponse`):** Exposes `answer`, `supporting_source`, `supporting_evidence`, `relevant_entities`, `graph_path`, `confidence_context`, `case_references`, and `explainability_traces`.

---

## 8. Cross-Member Integration Contracts

### 8.1 M2 Backend Integration (`CrimeNetAINLPService`)
M2 imports `CrimeNetAINLPService` from `member4_ai_nlp` and invokes pure Python methods inside its FastAPI endpoints/background workers:
```python
from member4_ai_nlp import CrimeNetAINLPService, AuthorizationContext

m4_service = CrimeNetAINLPService()

# 1. Ingest & extract FIR / CDR / Scanned Document
bundle = m4_service.ingest_and_extract_document(
    content=document_bytes_or_text,
    document_id="DOC-FIR-10234",
    case_id="CASE-2026-01",
    evidence_id="EVID-001",
    source_name="FIR_10234.pdf",
)

# 2. Detect Cross-Source Entity Matches
matches = m4_service.resolve_entities(bundle["structured_extraction"]["entities"])

# 3. Query Evidence-Grounded AI Investigation Assistant
auth_ctx = AuthorizationContext(
    user_id="INV-01",
    role="Investigator",
    authorized_case_ids={"CASE-2026-01"},
)
response = m4_service.ask_investigation_assistant(
    query="How is Ramesh Kumar connected to FIR-10234/2026?",
    auth_context=auth_ctx,
)
```

### 8.2 M3 Graph Dependencies (`M3GraphPayloadContract` & `GraphDataProvider`)
- M4 emits `M3GraphPayloadContract` (`nodes` and `edges` with `source`, `timestamp`, `case`, `evidence`, `confidence`) so M3 can import them into Neo4j.
- M4 accepts an optional `GraphDataProvider` adapter from M3 to execute multi-hop Neo4j path queries during RAG retrieval without M4 importing Neo4j drivers directly.

### 8.3 M6 Authorization Requirements (`AuthorizationContext`)
- Every RAG query and case-scoped retrieval requires an authenticated `AuthorizationContext` supplied by M6/M2.
- M4 enforces `can_access_case`, `can_access_evidence`, and `can_access_document` prior to entity/relationship retrieval and graph traversal.
