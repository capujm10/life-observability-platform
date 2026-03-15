# Life Observability Platform API

FastAPI backend for the Life Observability Platform MVP.

## Local Backend Loop

```bash
pip install -e .[dev]
python -m pytest tests -q
python -m compileall app tests
```

## Auth Settings

- `SECRET_KEY`
- `ACCESS_TOKEN_TTL_HOURS`
- `JWT_ALGORITHM`
- `JWT_ISSUER`
