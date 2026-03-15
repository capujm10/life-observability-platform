FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ARG INSTALL_DEV=false

WORKDIR /app

COPY . .
RUN pip install --upgrade pip && \
    if [ "$INSTALL_DEV" = "true" ]; then pip install -e .[dev]; else pip install -e .; fi && \
    chmod +x scripts/entrypoint.sh

EXPOSE 8000

CMD ["./scripts/entrypoint.sh"]
