"""Unit tests for transform-case metric collection."""

from app.domain.collaboration.metrics import transform_over_history_with_metrics
from app.domain.collaboration.operations import OperationIdentity


def identity(client: str, op: str) -> OperationIdentity:
    """Create an operation identity for metric tests."""

    return OperationIdentity(client_id=client, op_id=op)


def test_transform_metrics_count_every_pairwise_case() -> None:
    """History transformation records the exact pairwise operation cases."""

    result = transform_over_history_with_metrics(
        {"type": "delete", "pos": 5, "len": 2},
        identity("client-b", "op-2"),
        [
            ({"type": "insert", "pos": 1, "text": "x"}, identity("client-a", "op-1")),
            ({"type": "delete", "pos": 3, "len": 1}, identity("client-c", "op-3")),
        ],
    )

    assert result.op == {"type": "delete", "pos": 5, "len": 2}
    assert result.metrics.case_counts["delete/insert"] == 1
    assert result.metrics.case_counts["delete/delete"] == 1
    assert result.metrics.transformed_step_count == 2
