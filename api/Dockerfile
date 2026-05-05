FROM python:3.10-alpine

WORKDIR /app

# Build deps needed to compile psycopg2; removed after pip install to keep image small
RUN apk add --no-cache gcc musl-dev libpq-dev

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
