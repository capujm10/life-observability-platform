import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta


def hash_password(password: str, salt: str | None = None) -> str:
    salt_value = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_value.encode("utf-8"), 390000)
    encoded_digest = base64.urlsafe_b64encode(digest).decode("utf-8")
    return f"{salt_value}${encoded_digest}"


def verify_password(password: str, password_hash: str) -> bool:
    salt, _ = password_hash.split("$", maxsplit=1)
    return hmac.compare_digest(hash_password(password, salt), password_hash)


def create_access_token(user_id: str, secret_key: str, ttl_hours: int) -> str:
    payload = {
        "sub": user_id,
        "exp": int((datetime.now(UTC) + timedelta(hours=ttl_hours)).timestamp()),
    }
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("utf-8").rstrip("=")
    signature = hmac.new(secret_key.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def decode_access_token(token: str, secret_key: str) -> dict[str, int | str] | None:
    try:
        payload_b64, provided_signature = token.split(".", maxsplit=1)
        expected_signature = hmac.new(
            secret_key.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected_signature, provided_signature):
            return None

        padding = "=" * (-len(payload_b64) % 4)
        payload_raw = base64.urlsafe_b64decode(f"{payload_b64}{padding}")
        payload = json.loads(payload_raw.decode("utf-8"))
        if int(payload["exp"]) < int(datetime.now(UTC).timestamp()):
            return None
        return payload
    except (KeyError, ValueError, json.JSONDecodeError):
        return None

