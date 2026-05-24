"""Concurrent WebSocket load-test bot for the collaboration OT service.

The script opens several authenticated document sessions, sends randomized
plain-text insert/delete operations, records acknowledgement timing, and writes
CSV samples that can be used when evaluating collaboration latency.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

import websockets


@dataclass
class Sample:
    """One operation acknowledgement or protocol error captured during a load run."""

    run_id: str
    doc_id: str
    client_id: str
    op_id: str
    base_version: int
    server_version: int | None
    send_ts: float
    ack_ts: float | None
    transform_required: bool | None
    error: str | None = None


async def bot(
    *,
    run_id: str,
    url: str,
    doc_id: str,
    token: str,
    client_index: int,
    operations: int,
    samples: list[Sample],
) -> None:
    """Run one simulated collaboration client against a document room.

    Args:
        run_id: Identifier shared by all clients in the same load-test run.
        url: WebSocket server base URL without the document path.
        doc_id: Workspace document id to join.
        token: Bearer token passed as the WebSocket query parameter.
        client_index: Stable numeric index used to make the client id readable.
        operations: Number of randomized local operations to submit.
        samples: Shared collection receiving acknowledgement and error samples.
    """

    client_id = f"bot-{client_index}-{uuid4()}"
    content = ""
    version = 0
    pending: dict[str, Sample] = {}

    async with websockets.connect(f"{url}/ws/docs/{doc_id}?token={token}") as websocket:
        await websocket.send(json.dumps({"type": "join", "client_id": client_id}))
        snapshot = json.loads(await websocket.recv())
        content = snapshot.get("content", "")
        version = int(snapshot.get("version", 0))

        async def receive_loop() -> None:
            """Apply server messages and enrich samples as acknowledgements arrive."""

            nonlocal content, version

            async for message_text in websocket:
                message = json.loads(message_text)

                if message["type"] == "ack":
                    sample = pending.pop(message["op_id"], None)
                    if sample:
                        sample.ack_ts = time.time()
                        sample.server_version = message["server_version"]
                        sample.transform_required = message["transform_required"]
                    version = max(version, message["server_version"])
                elif message["type"] == "broadcast_op":
                    version = max(version, message["server_version"])
                    content = apply_op(content, message["op"])
                elif message["type"] == "error":
                    samples.append(
                        Sample(
                            run_id=run_id,
                            doc_id=doc_id,
                            client_id=client_id,
                            op_id="",
                            base_version=version,
                            server_version=None,
                            send_ts=time.time(),
                            ack_ts=None,
                            transform_required=None,
                            error=message.get("message", "unknown error"),
                        )
                    )

        receiver = asyncio.create_task(receive_loop())

        try:
            for _ in range(operations):
                await asyncio.sleep(random.uniform(0.03, 0.18))
                op = random_op(content)
                content = apply_op(content, op)
                op_id = str(uuid4())
                send_ts = time.time()
                sample = Sample(
                    run_id=run_id,
                    doc_id=doc_id,
                    client_id=client_id,
                    op_id=op_id,
                    base_version=version,
                    server_version=None,
                    send_ts=send_ts,
                    ack_ts=None,
                    transform_required=None,
                )
                pending[op_id] = sample
                samples.append(sample)
                await websocket.send(
                    json.dumps(
                        {
                            "type": "op",
                            "op_id": op_id,
                            "client_id": client_id,
                            "doc_id": doc_id,
                            "base_version": version,
                            "op": op,
                            "client_ts": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                )

            await asyncio.sleep(2)
        finally:
            receiver.cancel()


def random_op(content: str) -> dict[str, object]:
    """Create a small random insert or delete operation for the current text.

    Args:
        content: Local text projection used to choose valid operation positions.

    Returns:
        A protocol-compatible insert or delete operation dictionary.
    """

    if content and random.random() < 0.2:
        pos = random.randrange(0, len(content))
        length = random.randint(1, min(4, len(content) - pos))
        return {"type": "delete", "pos": pos, "len": length}

    pos = random.randrange(0, len(content) + 1)
    text = random.choice(["a", "b", "c", " ", "\n", "test "])
    return {"type": "insert", "pos": pos, "text": text}


def apply_op(content: str, op: dict[str, object]) -> str:
    """Apply a bot-generated operation to the local text projection.

    Args:
        content: Current local text.
        op: Insert or delete operation in the WebSocket protocol format.

    Returns:
        The text after applying the operation with positions clamped to bounds.
    """

    pos = max(0, min(int(op["pos"]), len(content)))
    if op["type"] == "insert":
        return content[:pos] + str(op["text"]) + content[pos:]
    end = max(pos, min(pos + int(op["len"]), len(content)))
    return content[:pos] + content[end:]


async def main() -> None:
    """Parse CLI options, run all simulated clients, and write CSV results."""

    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="ws://localhost:4100")
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--token", required=True)
    parser.add_argument("--clients", type=int, default=5)
    parser.add_argument("--operations", type=int, default=25)
    parser.add_argument("--csv", default="collab-load-results.csv")
    args = parser.parse_args()

    run_id = str(uuid4())
    samples: list[Sample] = []
    await asyncio.gather(
        *[
            bot(
                run_id=run_id,
                url=args.url,
                doc_id=args.doc_id,
                token=args.token,
                client_index=index,
                operations=args.operations,
                samples=samples,
            )
            for index in range(args.clients)
        ]
    )

    with open(args.csv, "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(Sample.__annotations__.keys()))
        writer.writeheader()
        for sample in samples:
            writer.writerow(sample.__dict__)


if __name__ == "__main__":
    asyncio.run(main())
