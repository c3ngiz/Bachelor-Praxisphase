"""Workspace permission and inheritance documentation helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

WorkspacePermissionLevel = Literal["owner", "write", "read"]


@dataclass(frozen=True)
class WorkspaceAccess:
    """Effective access resolved from ownership, direct shares, and ancestors.

    Direct shares apply only to the item where they are configured. Folder
    shares are inherited by descendants for read/write operations. Owner-only
    management actions are intentionally not inherited from folder shares.
    """

    permission: WorkspacePermissionLevel
    direct: bool

    @property
    def can_write(self) -> bool:
        """Return whether this access level allows content or metadata edits."""

        return self.permission in {"owner", "write"}

    @property
    def can_manage(self) -> bool:
        """Return whether this access level allows sharing and deletion."""

        return self.permission == "owner"
