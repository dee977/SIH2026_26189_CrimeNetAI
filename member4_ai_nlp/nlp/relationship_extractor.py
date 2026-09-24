"""
Graph-Compatible Relationship Extraction Engine for Member 4.

Extracts relationships between extracted entities in FIRs, police reports, CDR logs,
and financial documents, mapping them to M3 Neo4j graph relationship types while
preserving:
- relationship (graph-compatible type)
- source (document reference)
- timestamp (supporting event timestamp or "unavailable")
- case (case_id or "unavailable")
- evidence (evidence_id or "unavailable")
- confidence (float [0.0, 1.0])
- explanation (ExplainabilityTrace)
"""

from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Set, Tuple

from ..contracts.schemas import (
    UNAVAILABLE,
    EntityType,
    ExtractedEntity,
    ExtractedRelationship,
    GraphRelationshipType,
)
from ..explainability.explainer import ExplainableAIBuilder


class ForensicRelationshipExtractor:
    """
    Extracts structured, graph-compatible relationships from forensic documents
    using sentence-window co-occurrence, dependency/predicate rules, and domain cues.
    """

    COMMUNICATION_CUES = re.compile(
        r"\b(called|phoned|contacted|spoke\s+to|CDR|SMS|WhatsApp|call\s+duration|संपर्क|फ़ोन\s+किया|बात\s+की)\b",
        re.IGNORECASE,
    )
    TRANSACTION_CUES = re.compile(
        r"\b(transferred|paid|remitted|sent\s+Rs|wire\s+transfer|hawala|deposited|credited|debited|RTGS|NEFT|UPI|पैसे\s+भेजे|हवाला)\b",
        re.IGNORECASE,
    )
    OWNERSHIP_CUES = re.compile(
        r"\b(owns|owner\s+of|registered\s+to|driving|driven\s+by|using\s+vehicle|seized\s+from|का\s+वाहन|की\s+गाड़ी)\b",
        re.IGNORECASE,
    )

    def extract_relationships(
        self,
        text: str,
        entities: List[ExtractedEntity],
        document_id: str,
        case_id: str = UNAVAILABLE,
        evidence_id: str = UNAVAILABLE,
        source_name: str = UNAVAILABLE,
    ) -> List[ExtractedRelationship]:
        """
        Build graph-compatible relationships from `entities` and `text` context.
        """
        if not entities:
            return []

        relationships: List[ExtractedRelationship] = []
        seen_rels: Set[Tuple[str, str, str]] = set()
        src_ref = source_name if source_name and source_name != UNAVAILABLE else document_id

        dates = [e.normalized_value for e in entities if e.entity_type == EntityType.DATE.value]
        default_ts = dates[0] if dates else UNAVAILABLE

        persons = [e for e in entities if e.entity_type == EntityType.PERSON.value]
        orgs = [e for e in entities if e.entity_type == EntityType.ORGANIZATION.value]
        firs = [e for e in entities if e.entity_type == EntityType.FIR_NUMBER.value]
        phones = [e for e in entities if e.entity_type == EntityType.PHONE.value]
        vehicles = [e for e in entities if e.entity_type == EntityType.VEHICLE.value]
        accounts = [e for e in entities if e.entity_type == EntityType.BANK_ACCOUNT.value]
        locations = [e for e in entities if e.entity_type == EntityType.LOCATION.value]
        crimes = [e for e in entities if e.entity_type in (EntityType.CRIME.value, EntityType.CRIME_TYPE.value)]
        events = [e for e in entities if e.entity_type == EntityType.EVENT.value]

        def _window_snippet(ent_a: ExtractedEntity, ent_b: ExtractedEntity) -> str:
            if not text or ent_a.start_char < 0 or ent_b.start_char < 0:
                return f"{ent_a.value} ... {ent_b.value}"
            start = max(0, min(ent_a.start_char, ent_b.start_char) - 40)
            end = min(len(text), max(ent_a.end_char, ent_b.end_char) + 40)
            return text[start:end].replace("\n", " ").strip()

        def _add_rel(
            rel_type: GraphRelationshipType,
            ent_a: ExtractedEntity,
            ent_b: ExtractedEntity,
            conf: float,
            trigger_phrase: str,
            algo: str = "Forensic Dependency & Context Window Extractor",
            extra_attrs: Dict[str, Any] | None = None,
        ) -> None:
            if ent_a.entity_id == ent_b.entity_id:
                return
            dedup_key = (ent_a.entity_id, rel_type.value, ent_b.entity_id)
            if dedup_key in seen_rels:
                return
            seen_rels.add(dedup_key)

            rel_ts = (
                ent_a.timestamp
                if ent_a.timestamp != UNAVAILABLE
                else (ent_b.timestamp if ent_b.timestamp != UNAVAILABLE else default_ts)
            )
            snippet = _window_snippet(ent_a, ent_b)
            rel_id = (
                f"REL-{uuid.uuid5(uuid.NAMESPACE_DNS, f'{document_id}:{ent_a.entity_id}:{rel_type.value}:{ent_b.entity_id}').hex[:8].upper()}"
            )
            explanation = ExplainableAIBuilder.for_relationship(
                relationship_type=rel_type.value,
                source_entity=ent_a.normalized_value,
                target_entity=ent_b.normalized_value,
                supporting_source=src_ref,
                supporting_snippet=snippet,
                supporting_timestamp=rel_ts,
                confidence=conf,
                algorithm_or_model=algo,
                trigger_phrase=trigger_phrase,
                feature_breakdown={
                    "source_entity_type": ent_a.entity_type,
                    "target_entity_type": ent_b.entity_type,
                    "case_id": case_id or UNAVAILABLE,
                    "evidence_id": evidence_id or UNAVAILABLE,
                },
            )
            relationships.append(
                ExtractedRelationship(
                    relationship_id=rel_id,
                    relationship=rel_type.value,
                    source_entity_id=ent_a.entity_id,
                    source_entity_value=ent_a.normalized_value,
                    source_entity_type=ent_a.entity_type,
                    target_entity_id=ent_b.entity_id,
                    target_entity_value=ent_b.normalized_value,
                    target_entity_type=ent_b.entity_type,
                    source=src_ref,
                    timestamp=rel_ts,
                    case=case_id or UNAVAILABLE,
                    evidence=evidence_id or UNAVAILABLE,
                    confidence=round(conf, 4),
                    evidence_snippet=snippet,
                    attributes=extra_attrs or {},
                    explanation=explanation,
                )
            )

        # 1. Link Persons/Orgs named in FIRs -> NAMED_IN_FIR
        for fir in firs:
            for p in persons + orgs:
                _add_rel(
                    GraphRelationshipType.NAMED_IN_FIR,
                    p,
                    fir,
                    0.95,
                    f"Entity named in {fir.normalized_value}",
                )

        # 2. Link Alias Persons -> ALIAS_OF
        for p in persons:
            alias_target = p.attributes.get("alias_of")
            if alias_target:
                for primary in persons:
                    if primary.normalized_value.lower() == str(alias_target).lower():
                        _add_rel(
                            GraphRelationshipType.ALIAS_OF,
                            p,
                            primary,
                            0.94,
                            f"Explicit alias marker ('urf'/'alias') linking {p.value} to {primary.value}",
                        )

        # 3. Link Persons -> Phones (USES_PHONE) by proximity
        for ph in phones:
            best_person = min(
                persons,
                key=lambda p: abs(p.start_char - ph.start_char) if p.start_char >= 0 else 10**6,
                default=None,
            )
            if best_person:
                _add_rel(
                    GraphRelationshipType.USES_PHONE,
                    best_person,
                    ph,
                    0.91,
                    f"Subscriber/contact number associated with {best_person.normalized_value}",
                )

        # 4. Link Persons/Orgs -> Vehicles (OWNS_VEHICLE)
        for veh in vehicles:
            owners = persons + orgs
            best_owner = min(
                owners,
                key=lambda o: abs(o.start_char - veh.start_char) if o.start_char >= 0 else 10**6,
                default=None,
            )
            if best_owner:
                _add_rel(
                    GraphRelationshipType.OWNS_VEHICLE,
                    best_owner,
                    veh,
                    0.90,
                    f"Vehicle {veh.normalized_value} linked to {best_owner.normalized_value}",
                )

        # 5. Link Persons/Orgs -> Bank Accounts (HOLDS_ACCOUNT)
        for acct in accounts:
            holders = persons + orgs
            best_holder = min(
                holders,
                key=lambda h: abs(h.start_char - acct.start_char) if h.start_char >= 0 else 10**6,
                default=None,
            )
            if best_holder:
                _add_rel(
                    GraphRelationshipType.HOLDS_ACCOUNT,
                    best_holder,
                    acct,
                    0.92,
                    f"Bank/UPI identifier {acct.normalized_value} linked to {best_holder.normalized_value}",
                )

        # 6. Pairwise Person/Organization interactions (COMMUNICATED_WITH, TRANSFERRED_FUNDS_TO, MEMBER_OF, ASSOCIATED_WITH)
        actors = persons + orgs
        for i in range(len(actors)):
            for j in range(i + 1, len(actors)):
                a = actors[i]
                b = actors[j]
                if a.attributes.get("alias_of") == b.normalized_value or b.attributes.get("alias_of") == a.normalized_value:
                    continue
                snippet = _window_snippet(a, b)
                if self.TRANSACTION_CUES.search(snippet):
                    _add_rel(
                        GraphRelationshipType.TRANSFERRED_FUNDS_TO,
                        a,
                        b,
                        0.91,
                        self.TRANSACTION_CUES.search(snippet).group(0),  # type: ignore
                        "Financial Flow & Predicate Extractor",
                    )
                elif self.COMMUNICATION_CUES.search(snippet):
                    _add_rel(
                        GraphRelationshipType.COMMUNICATED_WITH,
                        a,
                        b,
                        0.90,
                        self.COMMUNICATION_CUES.search(snippet).group(0),  # type: ignore
                        "CDR & Communication Predicate Extractor",
                    )
                elif a.entity_type == EntityType.PERSON.value and b.entity_type == EntityType.ORGANIZATION.value:
                    _add_rel(
                        GraphRelationshipType.MEMBER_OF,
                        a,
                        b,
                        0.87,
                        f"Person-Organization affiliation between {a.normalized_value} and {b.normalized_value}",
                    )
                else:
                    _add_rel(
                        GraphRelationshipType.ASSOCIATED_WITH,
                        a,
                        b,
                        0.85,
                        f"Co-occurrence in investigative narrative ({document_id})",
                    )

        # 7. Phone-to-Phone CDR communications if multiple phones and communication cues exist
        if len(phones) >= 2 and self.COMMUNICATION_CUES.search(text or ""):
            for i in range(len(phones) - 1):
                _add_rel(
                    GraphRelationshipType.COMMUNICATED_WITH,
                    phones[i],
                    phones[i + 1],
                    0.93,
                    "CDR call/message log between MSISDNs",
                    "CDR Telecom Link Extractor",
                )

        # 8. Account-to-Account financial transfers if multiple accounts and transaction cues exist
        if len(accounts) >= 2 and self.TRANSACTION_CUES.search(text or ""):
            for i in range(len(accounts) - 1):
                _add_rel(
                    GraphRelationshipType.TRANSFERRED_FUNDS_TO,
                    accounts[i],
                    accounts[i + 1],
                    0.92,
                    "Inter-account financial transfer",
                    "Financial Transaction Path Extractor",
                )

        # 9. Persons/Orgs -> Crime (INVOLVED_IN_CRIME)
        for cr in crimes:
            for p in persons:
                _add_rel(
                    GraphRelationshipType.INVOLVED_IN_CRIME,
                    p,
                    cr,
                    0.89,
                    f"Subject linked to statutory offense {cr.normalized_value}",
                )

        # 10. Persons/Events -> Locations (LOCATED_AT / OCCURRED_AT)
        for loc in locations:
            for ev in events:
                _add_rel(
                    GraphRelationshipType.OCCURRED_AT,
                    ev,
                    loc,
                    0.88,
                    f"Event '{ev.value}' occurred at '{loc.normalized_value}'",
                )
            for p in persons:
                _add_rel(
                    GraphRelationshipType.LOCATED_AT,
                    p,
                    loc,
                    0.86,
                    f"Subject '{p.normalized_value}' reported at '{loc.normalized_value}'",
                )

        # 11. Persons -> Events (PARTICIPATED_IN_EVENT)
        for ev in events:
            for p in persons:
                _add_rel(
                    GraphRelationshipType.PARTICIPATED_IN_EVENT,
                    p,
                    ev,
                    0.88,
                    f"Subject '{p.normalized_value}' participated in event '{ev.value}'",
                )

        return relationships
