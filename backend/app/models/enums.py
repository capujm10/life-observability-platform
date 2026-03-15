from enum import Enum


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class HabitFrequency(str, Enum):
    daily = "daily"
    weekly = "weekly"


class ProjectStatus(str, Enum):
    planning = "planning"
    active = "active"
    at_risk = "at_risk"
    completed = "completed"


class ThemePreference(str, Enum):
    system = "system"
    light = "light"
    dark = "dark"

