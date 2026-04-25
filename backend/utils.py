import os
from dotenv import load_dotenv


load_dotenv()


def get_env(name: str, default: str | None = None) -> str | None:
    """Read an environment variable with optional default."""
    return os.getenv(name, default)
