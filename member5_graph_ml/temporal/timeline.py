"""
CrimeNet AI — Member 5: Temporal Analysis Engine
Analyzes timelines across Communications, Transactions, Locations, and Crime Incidents.
Generates:
- Temporal graph playback snapshots
- Activity burst detection
- Before/After incident analysis windows
- Event correlation across time
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import networkx as nx

from member5_graph_ml.models.schemas import (
    TemporalEvent,
    TemporalBurst,
    TemporalGraphSnapshot,
    TemporalAnalysisResult,
    NetworkData,
)


def parse_iso(ts_str: str) -> datetime:
    """Safely parses ISO timestamp strings."""
    return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))


def analyze_temporal_events(
    events: List[TemporalEvent],
    burst_window_hours: int = 4,
    deviation_threshold: float = 2.5,
) -> TemporalAnalysisResult:
    """
    Performs aggregated timeline analytics across multi-modal events:
    identifies activity bursts, event type frequencies, and overall temporal span.
    """
    if not events:
        return TemporalAnalysisResult(
            time_range_start="",
            time_range_end="",
            total_events=0,
            timeline_by_type={},
            bursts=[],
            investigator_observations=["No temporal events recorded for analysis."],
        )

    # Sort chronologically
    sorted_events = sorted(events, key=lambda e: parse_iso(e.timestamp))
    t_start = sorted_events[0].timestamp
    t_end = sorted_events[-1].timestamp

    # Event counts by category
    type_counts: Dict[str, int] = {}
    for ev in sorted_events:
        type_counts[ev.event_type] = type_counts.get(ev.event_type, 0) + 1

    # Burst detection using rolling time window
    start_dt = parse_iso(t_start)
    end_dt = parse_iso(t_end)
    total_hours = max((end_dt - start_dt).total_seconds() / 3600.0, 1.0)
    baseline_window_avg = (len(sorted_events) / total_hours) * burst_window_hours

    bursts: List[TemporalBurst] = []
    current_dt = start_dt

    while current_dt <= end_dt:
        window_end_dt = current_dt + timedelta(hours=burst_window_hours)
        win_events = [
            e for e in sorted_events
            if current_dt <= parse_iso(e.timestamp) < window_end_dt
        ]

        if len(win_events) > max(baseline_window_avg * deviation_threshold, 4.0):
            # Identified significant burst
            participating = list(set(
                [e.entity_source_id for e in win_events] +
                [e.entity_target_id for e in win_events if e.entity_target_id]
            ))
            # Dominant type
            win_types: Dict[str, int] = {}
            for e in win_events:
                win_types[e.event_type] = win_types.get(e.event_type, 0) + 1
            dom_type = max(win_types.items(), key=lambda x: x[1])[0]

            dev_factor = len(win_events) / max(baseline_window_avg, 0.5)

            bursts.append(
                TemporalBurst(
                    time_window_start=current_dt.isoformat(),
                    time_window_end=window_end_dt.isoformat(),
                    event_count=len(win_events),
                    baseline_average=round(baseline_window_avg, 2),
                    deviation_factor=round(dev_factor, 2),
                    participating_entities=participating,
                    dominant_event_type=dom_type,
                    analytical_finding=(
                        f"Temporal concentration of {len(win_events)} {dom_type} events "
                        f"({dev_factor:.1f}x baseline) involving {len(participating)} entities."
                    ),
                )
            )

        current_dt += timedelta(hours=burst_window_hours)

    observations = [
        f"Timeline spans from {t_start} to {t_end} ({total_hours:.1f} total hours).",
        f"Aggregated event breakdown: {type_counts}.",
        f"Detected {len(bursts)} temporal activity burst windows.",
    ]

    return TemporalAnalysisResult(
        time_range_start=t_start,
        time_range_end=t_end,
        total_events=len(sorted_events),
        timeline_by_type=type_counts,
        bursts=bursts,
        investigator_observations=observations,
    )


def generate_graph_playback_snapshots(
    network_data: NetworkData,
    time_slices: int = 5,
) -> List[TemporalGraphSnapshot]:
    """
    Slices the network's chronologically timestamped nodes and edges into step-by-step
    cumulative snapshots for UI graph playback and timeline progression.
    """
    # Extract timestamps from edges and nodes
    items = []
    for n in network_data.nodes:
        if n.first_seen:
            items.append((parse_iso(n.first_seen), "NODE", n.id))
    for e in network_data.edges:
        if e.timestamp:
            items.append((parse_iso(e.timestamp), "EDGE", e.id))

    if not items:
        # Generate single static snapshot if no timestamps
        return [
            TemporalGraphSnapshot(
                timestamp=datetime.utcnow().isoformat(),
                step_index=1,
                active_node_ids=[n.id for n in network_data.nodes],
                newly_added_nodes=[n.id for n in network_data.nodes],
                active_edge_ids=[e.id for e in network_data.edges],
                newly_added_edges=[e.id for e in network_data.edges],
                cumulative_node_count=len(network_data.nodes),
                cumulative_edge_count=len(network_data.edges),
                summary_of_activity="Static topology view (no entity timestamps available).",
            )
        ]

    items.sort(key=lambda x: x[0])
    min_time = items[0][0]
    max_time = items[-1][0]
    delta = (max_time - min_time) / max(time_slices, 1)

    snapshots: List[TemporalGraphSnapshot] = []
    seen_nodes = set()
    seen_edges = set()

    for slice_idx in range(time_slices):
        slice_cutoff = min_time + delta * (slice_idx + 1)
        if slice_idx == time_slices - 1:
            slice_cutoff = max_time + timedelta(seconds=1)

        new_nodes = set()
        new_edges = set()

        for n in network_data.nodes:
            if n.first_seen and parse_iso(n.first_seen) <= slice_cutoff:
                if n.id not in seen_nodes:
                    new_nodes.add(n.id)
                    seen_nodes.add(n.id)

        for e in network_data.edges:
            if e.timestamp and parse_iso(e.timestamp) <= slice_cutoff:
                if e.id not in seen_edges:
                    new_edges.add(e.id)
                    seen_edges.add(e.id)

        snapshots.append(
            TemporalGraphSnapshot(
                timestamp=slice_cutoff.isoformat(),
                step_index=slice_idx + 1,
                active_node_ids=list(seen_nodes),
                newly_added_nodes=list(new_nodes),
                active_edge_ids=list(seen_edges),
                newly_added_edges=list(new_edges),
                cumulative_node_count=len(seen_nodes),
                cumulative_edge_count=len(seen_edges),
                summary_of_activity=(
                    f"Interval {slice_idx + 1}/{time_slices}: +{len(new_nodes)} entities, "
                    f"+{len(new_edges)} relationships emerged."
                ),
            )
        )

    return snapshots


def analyze_before_after_incident(
    events: List[TemporalEvent],
    incident_timestamp: str,
    window_hours: int = 24,
) -> Dict[str, Any]:
    """
    Compares network communication and transaction volumes in defined time windows
    immediately preceding and following a major crime incident or FIR filing.
    """
    inc_dt = parse_iso(incident_timestamp)
    before_start = inc_dt - timedelta(hours=window_hours)
    after_end = inc_dt + timedelta(hours=window_hours)

    before_events = [e for e in events if before_start <= parse_iso(e.timestamp) < inc_dt]
    after_events = [e for e in events if inc_dt <= parse_iso(e.timestamp) <= after_end]

    def summarize_window(evs: List[TemporalEvent]) -> Dict[str, Any]:
        counts: Dict[str, int] = {}
        entities = set()
        for e in evs:
            counts[e.event_type] = counts.get(e.event_type, 0) + 1
            entities.add(e.entity_source_id)
            if e.entity_target_id:
                entities.add(e.entity_target_id)
        return {
            "total_event_count": len(evs),
            "by_type": counts,
            "unique_entities_active": len(entities),
        }

    return {
        "incident_timestamp": incident_timestamp,
        "window_duration_hours": window_hours,
        "pre_incident_metrics": summarize_window(before_events),
        "post_incident_metrics": summarize_window(after_events),
        "analytical_takeaway": (
            f"Pre-incident window registered {len(before_events)} events vs "
            f"{len(after_events)} post-incident events. "
            f"{'Sharp drop in communication observed post-incident (radio silence pattern).' if len(after_events) < len(before_events) * 0.3 else 'Sustained or heightened activity post-incident.'}"
        ),
    }
