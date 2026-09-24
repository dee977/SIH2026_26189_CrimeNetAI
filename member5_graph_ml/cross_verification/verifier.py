"""
CrimeNet AI — Member 5: Cross-Source Verification Engine
Cross-checks records from FIRs, CDRs, Bank Transactions, and Tower/Location Pings.
Detects:
- Physical impossibility (e.g. concurrent location mismatches)
- Timestamp conflicts
- Inconsistent claims across disparate investigative sources
Strictly avoids declaring which source is unconditionally 'true'; presents structured discrepancies.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from member5_graph_ml.models.schemas import (
    CrossVerificationResult,
    DiscrepancyClaim,
)


def parse_timestamp(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def cross_verify_location_and_transactions(
    cdr_records: List[Dict[str, Any]],
    transaction_records: List[Dict[str, Any]],
    fir_claims: Optional[List[Dict[str, Any]]] = None,
    max_coincident_delta_minutes: int = 45,
) -> List[CrossVerificationResult]:
    """
    Cross-checks CDR tower locations against Bank ATM / POS transaction locations.
    Flags physical impossibilities (e.g. Phone in Mumbai tower while ATM card swiped in Ahmedabad).
    """
    results: List[CrossVerificationResult] = []

    # Map CDR by person/phone
    for tx in transaction_records:
        person_id = tx.get("person_id") or tx.get("account_holder_id")
        tx_loc = tx.get("location") or tx.get("city") or tx.get("terminal_city")
        tx_ts_str = tx.get("timestamp")
        tx_ts = parse_timestamp(tx_ts_str)

        if not person_id or not tx_loc or not tx_ts:
            continue

        # Look for matching CDR entries for the same person/phone around the same time
        for cdr in cdr_records:
            c_person = cdr.get("person_id") or cdr.get("suspect_id")
            if c_person != person_id:
                continue

            cdr_loc = cdr.get("location") or cdr.get("tower_city") or cdr.get("cell_tower")
            cdr_ts_str = cdr.get("timestamp")
            cdr_ts = parse_timestamp(cdr_ts_str)

            if not cdr_loc or not cdr_ts:
                continue

            delta_min = abs((tx_ts - cdr_ts).total_seconds()) / 60.0

            # If within concurrent time window but distinct geographic regions
            if delta_min <= max_coincident_delta_minutes and tx_loc.lower().strip() != cdr_loc.lower().strip():
                person_name = tx.get("person_name") or cdr.get("person_name", person_id)

                claim_a = DiscrepancyClaim(
                    source=tx.get("source_type", "BANK_TRANSACTION"),
                    claim_description=f"Financial transaction executed at {tx_loc} (Amount: ₹{tx.get('amount', 'N/A')})",
                    recorded_timestamp=tx_ts_str,
                    location_or_value=tx_loc,
                    document_ref=tx.get("transaction_id"),
                    evidence_id=tx.get("evidence_id"),
                )

                claim_b = DiscrepancyClaim(
                    source=cdr.get("source_type", "CDR_TOWER_LOG"),
                    claim_description=f"Telecommunication connection routed via cell tower at {cdr_loc}",
                    recorded_timestamp=cdr_ts_str,
                    location_or_value=cdr_loc,
                    document_ref=cdr.get("call_id") or cdr.get("cdr_id"),
                    evidence_id=cdr.get("evidence_id"),
                )

                difference = (
                    f"Physical Co-location Conflict: Entity '{person_name}' is recorded in {tx_loc} via banking terminal "
                    f"at {tx_ts_str}, while mobile device registered to tower '{cdr_loc}' at {cdr_ts_str} "
                    f"(Time difference: {delta_min:.1f} minutes). Implausible transit velocity."
                )

                guidance = (
                    f"1. Subpoena ATM/POS CCTV footage in {tx_loc} to establish if an accomplice or skimmed card was used.\n"
                    f"2. Request telecom CDR azimuth and handover telemetry in {cdr_loc} to confirm phone handset identity (IMEI).\n"
                    f"3. Do not assume guilt or alibi unilaterally until forensic confirmation of device vs card possession is validated."
                )

                results.append(
                    CrossVerificationResult(
                        discrepancy_id=f"DISC_LOC_TX_CDR_{person_id[:8]}_{len(results) + 1}",
                        entity_id=person_id,
                        entity_name=person_name,
                        discrepancy_type="LOCATION_MISMATCH",
                        verification_state="DATA DISCREPANCY DETECTED",
                        claim_a=claim_a,
                        claim_b=claim_b,
                        difference_summary=difference,
                        investigative_guidance=guidance,
                        case_reference=tx.get("case_id") or cdr.get("case_id"),
                    )
                )

    # Cross-check FIR claims against CDR/Technical records
    if fir_claims:
        for claim in fir_claims:
            p_id = claim.get("person_id")
            stated_loc = claim.get("claimed_location")
            stated_ts_str = claim.get("claimed_timestamp")
            stated_ts = parse_timestamp(stated_ts_str)

            if not p_id or not stated_loc or not stated_ts:
                continue

            for cdr in cdr_records:
                if cdr.get("person_id") != p_id:
                    continue
                cdr_ts = parse_timestamp(cdr.get("timestamp"))
                cdr_loc = cdr.get("location") or cdr.get("tower_city")
                if not cdr_ts or not cdr_loc:
                    continue

                delta_min = abs((stated_ts - cdr_ts).total_seconds()) / 60.0
                if delta_min <= 60 and stated_loc.lower().strip() != cdr_loc.lower().strip():
                    p_name = claim.get("person_name", p_id)
                    results.append(
                        CrossVerificationResult(
                            discrepancy_id=f"DISC_FIR_CDR_{p_id[:8]}_{len(results) + 1}",
                            entity_id=p_id,
                            entity_name=p_name,
                            discrepancy_type="ALIBI_CONTRADICTION",
                            verification_state="DATA DISCREPANCY DETECTED",
                            claim_a=DiscrepancyClaim(
                                source="FIR_STATEMENT",
                                claim_description=f"Suspect/Witness claimed presence in {stated_loc}",
                                recorded_timestamp=stated_ts_str,
                                location_or_value=stated_loc,
                                document_ref=claim.get("fir_number"),
                                evidence_id=claim.get("evidence_id"),
                            ),
                            claim_b=DiscrepancyClaim(
                                source="CDR_TOWER_LOG",
                                claim_description=f"Telecommunication records place mobile handset in {cdr_loc}",
                                recorded_timestamp=cdr.get("timestamp"),
                                location_or_value=cdr_loc,
                                document_ref=cdr.get("cdr_id"),
                                evidence_id=cdr.get("evidence_id"),
                            ),
                            difference_summary=(
                                f"Alibi discrepancy: Individual claimed to be at {stated_loc}, "
                                f"contradicted by electronic CDR cell tower activity at {cdr_loc}."
                            ),
                            investigative_guidance=(
                                f"Examine phone possession and CDR tower footprint. Seek physical toll/CCTV verification."
                            ),
                            case_reference=claim.get("fir_number"),
                        )
                    )

    return results
