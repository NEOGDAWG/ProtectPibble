from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.models.enums import TaskType


@dataclass(frozen=True)
class GradeResult:
    letter: str
    health_delta: int


def percent_to_letter(percent: int) -> str:
    """Convert numeric grade (0-100) to letter grade."""
    if percent < 0 or percent > 100:
        raise ValueError("percent must be between 0 and 100")

    if percent >= 90:
        return "A+"
    if percent >= 85:
        return "A"
    if percent >= 80:
        return "A-"
    if percent >= 76:
        return "B+"
    if percent >= 72:
        return "B"
    if percent >= 68:
        return "B-"
    if percent >= 64:
        return "C+"
    if percent >= 60:
        return "C"
    if percent >= 55:
        return "C-"
    if percent >= 50:
        return "D"
    return "F"


def normalize_letter(letter: str) -> str:
    """Normalize letter grade input."""
    normalized = letter.strip().upper()
    valid_grades = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"}
    if normalized not in valid_grades:
        raise ValueError(f"invalid grade letter. Must be one of: {', '.join(sorted(valid_grades))}")
    return normalized


def compute_grade_health_delta(
    *,
    grade_percent: Optional[int],
    grade_letter: Optional[str],
    task_type: TaskType,
) -> GradeResult:
    """
    Compute health delta based on grade and task type.
    
    Rules:
    - F: -5
    - C-: -4
    - C: -3
    - C+: -2
    - B: 0 for exams, -1 for assignments
    - A: 0
    - A+: +1 (heals)
    """
    # Convert percent to letter if needed
    if grade_percent is not None:
        letter = percent_to_letter(int(grade_percent))
    elif grade_letter is not None:
        letter = normalize_letter(grade_letter)
    else:
        raise ValueError("missing grade: provide either grade_percent or grade_letter")

    # Calculate health delta based on letter grade and task type
    if letter == "A+":
        delta = 1  # Heals
    elif letter == "A":
        delta = 0
    elif letter == "A-":
        delta = 0
    elif letter == "B+":
        delta = 0
    elif letter == "B":
        # 0 for exams, -1 for assignments
        delta = 0 if task_type == TaskType.EXAM else -1
    elif letter == "B-":
        delta = 0 if task_type == TaskType.EXAM else -1
    elif letter == "C+":
        delta = -2
    elif letter == "C":
        delta = -3
    elif letter == "C-":
        delta = -4
    elif letter == "D":
        delta = -4  # Same as C- for simplicity
    elif letter == "F":
        delta = -5
    else:
        raise ValueError(f"unhandled grade letter: {letter}")

    return GradeResult(letter=letter, health_delta=delta)
