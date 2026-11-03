"""Report status lifecycle (design doc §5)."""
STATUSES = ("reported", "ai_verified", "gov_approved", "assigned", "in_repair", "completed", "rejected")
ACTIVE = ("reported", "ai_verified", "gov_approved", "assigned", "in_repair")

ADMIN_TRANSITIONS = {
    "reported": {"gov_approved", "rejected"},
    "ai_verified": {"gov_approved", "rejected"},
    "gov_approved": {"assigned", "rejected"},
    "assigned": {"in_repair"},
    "in_repair": {"completed"},
    "completed": set(),
    "rejected": set(),
}


class TransitionError(ValueError):
    pass


def check_admin_transition(current: str, target: str, note: str | None, assigned_to: str | None) -> None:
    if target not in ADMIN_TRANSITIONS.get(current, set()):
        raise TransitionError(f"cannot change status from {current} to {target}")
    if target == "assigned" and not assigned_to:
        raise TransitionError("assigned_to is required when assigning")
    if target == "rejected" and not (note and note.strip()):
        raise TransitionError("a note is required when rejecting")
