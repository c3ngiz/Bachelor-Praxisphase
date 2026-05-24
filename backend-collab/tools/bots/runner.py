"""Command-line entry point for the collaboration bot harness.

Run from ``backend-collab`` with ``python -m tools.bots.runner`` while the
FastAPI backend and database are available. The process exits with ``0`` only
when all required collaboration checks pass.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

from tools.bots.config import BotConfig
from tools.bots.models import ScenarioReport
from tools.bots.scenarios import CollaborationBotScenario


def parse_args() -> argparse.Namespace:
    """Parse optional command-line overrides for environment configuration."""

    parser = argparse.ArgumentParser(description="Run CollabDocs collaboration bots.")
    parser.add_argument("--api-base-url", help="Backend REST root URL, with or without /api.")
    parser.add_argument("--ws-base-url", help="Backend WebSocket root URL.")
    parser.add_argument("--timeout", type=float, help="Per-step timeout in seconds.")
    parser.add_argument("--quiet", action="store_true", help="Suppress per-step PASS lines.")
    parser.add_argument(
        "--json-only",
        action="store_true",
        help="Print only the structured JSON report.",
    )
    return parser.parse_args()


async def run(config: BotConfig) -> ScenarioReport:
    """Run the configured bot scenario."""

    return await CollaborationBotScenario(config).run()


def format_human_report(report: ScenarioReport) -> str:
    """Create a concise human-readable report for terminal use."""

    status = "PASS" if report.passed else "FAIL"
    lines = [
        f"Collaboration bot harness: {status}",
        f"Started: {report.started_at}",
        f"Finished: {report.finished_at}",
    ]

    if report.error:
        lines.append(f"Error: {report.error}")

    workspace = report.workspace
    if workspace:
        lines.append(f"Folder: {workspace.get('folderId')} ({workspace.get('folderName')})")
        lines.append(f"Document: {workspace.get('documentId')} ({workspace.get('documentName')})")

    sharing = report.sharing
    if sharing:
        lines.append(
            "Sharing: "
            f"{sharing.get('collaboratorEmail')} -> {sharing.get('permission')}"
        )

    lines.append("Checks:")
    for check in report.checks:
        marker = "PASS" if check.passed else "FAIL"
        detail = f" - {check.detail}" if check.detail else ""
        lines.append(f"  [{marker}] {check.name}{detail}")

    if report.final_hash:
        lines.append(f"Final hash: {report.final_hash}")
    if report.final_content:
        lines.append(f"Final content: {report.final_content!r}")
    lines.extend(format_metrics_lines(report))

    return "\n".join(lines)


def format_metrics_lines(report: ScenarioReport) -> list[str]:
    """Create terminal-friendly server and client metrics lines."""

    lines: list[str] = []
    server_metrics = report.server_metrics
    client_metrics = report.client_metrics

    if server_metrics:
        lines.append("Metrics:")
        lines.append(
            "  Server: "
            f"version={server_metrics.get('version')}, "
            f"ops={server_metrics.get('totalOperationsSent')}, "
            f"acks={server_metrics.get('acknowledgedOperations')}, "
            f"remote={server_metrics.get('remoteOperationsReceived')}, "
            f"transformed={server_metrics.get('transformedOperations')}, "
            f"avgAckMs={format_metric(server_metrics.get('avgAckLatencyMs'))}, "
            f"avgServerMs={format_metric(server_metrics.get('avgServerProcessingMs'))}"
        )
        cases = server_metrics.get("transformCaseCounts")
        if isinstance(cases, dict):
            lines.append(
                "  Transform cases: "
                f"insert/insert={cases.get('insertInsert')}, "
                f"insert/delete={cases.get('insertDelete')}, "
                f"delete/insert={cases.get('deleteInsert')}, "
                f"delete/delete={cases.get('deleteDelete')}"
            )

    if client_metrics:
        if not lines:
            lines.append("Metrics:")

        for role in ("owner", "collaborator"):
            metrics = client_metrics.get(role)
            if not isinstance(metrics, dict):
                continue

            label = "Owner client" if role == "owner" else "Collaborator client"
            lines.append(
                f"  {label}: "
                f"sent={metrics.get('operationsSent')}, "
                f"acks={metrics.get('acksReceived')}, "
                f"remote={metrics.get('remoteOperationsReceived')}, "
                f"avgAckMs={format_metric(metrics.get('averageAckLatencyMs'))}, "
                f"avgConvergenceMs={format_metric(metrics.get('averageConvergenceMs'))}"
            )

    return lines


def format_metric(value: object) -> str:
    """Format optional metric values compactly for terminal output."""

    if value is None:
        return "n/a"

    if isinstance(value, float):
        return f"{value:.2f}"

    return str(value)


def main() -> int:
    """Load config, execute bots, print reports, and return the process exit code."""

    args = parse_args()
    config = BotConfig.from_env().with_overrides(
        api_base_url=args.api_base_url,
        ws_base_url=args.ws_base_url,
        timeout_seconds=args.timeout,
        verbose=False if args.quiet or args.json_only else None,
    )
    report = asyncio.run(run(config))

    if not args.json_only:
        print(format_human_report(report))
        print()

    print(json.dumps(report.to_report(), indent=2, sort_keys=True))
    return 0 if report.passed else 1


if __name__ == "__main__":
    sys.exit(main())
