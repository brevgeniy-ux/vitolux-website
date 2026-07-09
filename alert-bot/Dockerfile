FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py .

# База подписчиков хранится в /data — смонтируйте volume, чтобы не терять её
ENV DB_PATH=/data/alertbot.sqlite3
VOLUME /data

CMD ["python", "bot.py"]
