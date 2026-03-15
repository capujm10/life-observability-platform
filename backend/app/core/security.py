import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta

PBKDF2_ITERATIONS = 390000
JWT_TYPE = "JWT"
SUPPORTED_JWT_ALGORITHMS = {"HS256"}


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _sign(signing_input: str, secret_key: str) -> str:
    signature = hmac.new(secret_key.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    return _b64url_encode(signature)


def _json_segment(payload: dict[str, int | str]) -> str:
    encoded = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return _b64url_encode(encoded)


def _validate_algorithm(algorithm: str) -> None:
    if algorithm not in SUPPORTED_JWT_ALGORITHMS:
        raise ValueError(f"Unsupported JWT algorithm: {algorithm}")


def hash_password(password: str, salt: str | None = None) -> str:
    salt_value = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_value.encode("utf-8"), PBKDF2_ITERATIONS)
    encoded_digest = _b64url_encode(digest)
    return f"{salt_value}${encoded_digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, _ = password_hash.split("$", maxsplit=1)
    except ValueError:
        return False
    return hmac.compare_digest(hash_password(password, salt), password_hash)


def create_access_token(
    user_id: str,
    secret_key: str,
    ttl_hours: int,
    *,
    issuer: str,
    algorithm: str = "HS256",
) -> str:
    _validate_algorithm(algorithm)
    now = datetime.now(UTC)
    header = {
        "alg": algorithm,
        "typ": JWT_TYPE,
    }
    payload = {
        "sub": user_id,
        "iss": issuer,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(hours=ttl_hours)).timestamp()),
    }
    header_b64 = _json_segment(header)
    payload_b64 = _json_segment(payload)
    signing_input = f"{header_b64}.{payload_b64}"
    return f"{signing_input}.{_sign(signing_input, secret_key)}"


def decode_access_token(
    token: str,
    secret_key: str,
    *,
    issuer: str,
    algorithm: str = "HS256",
) -> dict[str, int | str] | None:
    try:
        _validate_algorithm(algorithm)
        header_b64, payload_b64, provided_signature = token.split(".", maxsplit=2)
        header = json.loads(_b64url_decode(header_b64).decode("utf-8"))
        if header.get("alg") != algorithm or header.get("typ") != JWT_TYPE:
            return None

        signing_input = f"{header_b64}.{payload_b64}"
        expected_signature = _sign(signing_input, secret_key)
        if not hmac.compare_digest(expected_signature, provided_signature):
            return None

        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        now = int(datetime.now(UTC).timestamp())
        if payload.get("iss") != issuer:
            return None
        if int(payload["exp"]) < now:
            return None
        if int(payload.get("nbf", now)) > now:
            return None
        return payload
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None
