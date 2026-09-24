"""
Human-in-the-Loop Entity Verification Manager for Member 4.

Supports required investigator decisions:
- Accept Match (`VerificationAction.ACCEPT_MATCH`)
- Reject Match (`VerificationAction.REJECT_MATCH`)
- Keep Separate (`VerificationAction.KEEP_SEPARATE`)

Strict Preservation Rule:
- NEVER destroy the source records.
- Always preserve original records after resolution (`source_records_preserved=True`).
"""

from __future__ import annotations

import copy
import datetime
import uuid
from typing import Any, Dict, List, Optional

from ..contracts.schemas import (
    EntityMatchCandidate,
    ResolutionDecisionRecord,
    VerificationAction,
)


class EntityVerificationManager:
    """
    Manages investigator verification decisions for potential entity matches while
    strictly preserving immutable copies of original source records.
    """

    def __init__(self) -> None:
        self._candidates: Dict[str, EntityMatchCandidate] = {}
        self._decisions: Dict[str, ResolutionDecisionRecord] = {}
        self._preserved_source_archive: Dict[str, Dict[str, Any]] = {}
        self._canonical_links: Dict[str, Dict[str, Any]] = {}

    def register_candidates(self, candidates: List[EntityMatchCandidate]) -> None:
        """Store match candidates and archive their immutable original source records."""
        for cand in candidates:
            self._candidates[cand.match_id] = cand
            orig_a = copy.deepcopy(cand.original_source_records.get("candidate_a_original", {}))
            orig_b = copy.deepcopy(cand.original_source_records.get("candidate_b_original", {}))
            id_a = str(cand.candidate_a.get("entity_id", ""))
            id_b = str(cand.candidate_b.get("entity_id", ""))
            if id_a:
                self._preserved_source_archive[id_a] = orig_a
            if id_b:
                self._preserved_source_archive[id_b] = orig_b

    def apply_human_decision(
        self,
        candidate: EntityMatchCandidate,
        action: str,
        reviewer_id: str,
        notes: str = "",
    ) -> ResolutionDecisionRecord:
        """
        Execute a human verification action:
        - "Accept Match" -> Creates a non-destructive canonical resolution cluster linking
          Candidate A and Candidate B while keeping both original source records intact.
        - "Reject Match" -> Marks pair as non-matching and preserves both source records.
        - "Keep Separate" -> Explicitly keeps entities distinct for investigative tracking while
          preserving both source records.
        """
        valid_actions = {
            VerificationAction.ACCEPT_MATCH.value,
            VerificationAction.REJECT_MATCH.value,
            VerificationAction.KEEP_SEPARATE.value,
        }
        if action not in valid_actions:
            raise ValueError(
                f"Invalid verification action '{action}'. Must be one of: {sorted(valid_actions)}"
            )

        self.register_candidates([candidate])

        orig_a = copy.deepcopy(candidate.original_source_records["candidate_a_original"])
        orig_b = copy.deepcopy(candidate.original_source_records["candidate_b_original"])

        canonical_id: Optional[str] = None
        if action == VerificationAction.ACCEPT_MATCH.value:
            canonical_id = f"CANON-{uuid.uuid5(uuid.NAMESPACE_DNS, candidate.match_id).hex[:8].upper()}"
            self._canonical_links[canonical_id] = {
                "canonical_entity_id": canonical_id,
                "linked_member_ids": [
                    candidate.candidate_a.get("entity_id"),
                    candidate.candidate_b.get("entity_id"),
                ],
                "primary_label": candidate.candidate_a.get("normalized_value"),
                "preserved_source_records": [orig_a, orig_b],
                "verified_by": reviewer_id,
            }

        candidate.verification_status = action
        candidate.resolution_metadata["human_verified"] = True
        candidate.resolution_metadata["verification_action"] = action
        candidate.resolution_metadata["canonical_entity_id"] = canonical_id
        candidate.resolution_metadata["source_records_preserved"] = True

        decision = ResolutionDecisionRecord(
            decision_id=f"DEC-{uuid.uuid4().hex[:8].upper()}",
            match_id=candidate.match_id,
            action=action,
            reviewer_id=reviewer_id,
            decided_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            canonical_entity_id=canonical_id,
            candidate_a_original_record=orig_a,
            candidate_b_original_record=orig_b,
            source_records_preserved=True,
            notes=notes,
        )
        self._decisions[candidate.match_id] = decision
        return decision

    def get_original_source_record(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the preserved, unmodified original source record for any resolved entity."""
        rec = self._preserved_source_archive.get(entity_id)
        return copy.deepcopy(rec) if rec is not None else None

    def get_all_decisions(self) -> List[ResolutionDecisionRecord]:
        return list(self._decisions.values())
