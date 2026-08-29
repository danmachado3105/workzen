FROM python:3.12-slim

WORKDIR /app

ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --system workzen && useradd --system --gid workzen workzen

COPY --chown=workzen:workzen . .

USER workzen

EXPOSE 8000

CMD ["sh", "./entrypoint.sh"]
