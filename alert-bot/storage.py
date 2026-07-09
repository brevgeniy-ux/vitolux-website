# -*- coding: utf-8 -*-
"""
Хранилище подписок пользователей (SQLite).

Модель простая: у каждого чата — набор выбранных регионов.
Пустой набор при включённой подписке = «вся Украина».
"""

import json
import sqlite3
import threading


class Storage:
    def __init__(self, path: str):
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS subscribers (
                chat_id   INTEGER PRIMARY KEY,
                regions   TEXT    NOT NULL DEFAULT '[]',  -- JSON-список канонических имён; [] = вся Украина
                enabled   INTEGER NOT NULL DEFAULT 1
            )
            """
        )
        self._conn.commit()

    def close(self):
        self._conn.close()

    def ensure_user(self, chat_id: int):
        with self._lock:
            self._conn.execute(
                "INSERT OR IGNORE INTO subscribers (chat_id) VALUES (?)", (chat_id,)
            )
            self._conn.commit()

    def get_regions(self, chat_id: int) -> list[str]:
        row = self._conn.execute(
            "SELECT regions FROM subscribers WHERE chat_id = ?", (chat_id,)
        ).fetchone()
        return json.loads(row[0]) if row else []

    def set_regions(self, chat_id: int, regions: list[str]):
        with self._lock:
            self._conn.execute(
                "INSERT INTO subscribers (chat_id, regions) VALUES (?, ?) "
                "ON CONFLICT(chat_id) DO UPDATE SET regions = excluded.regions",
                (chat_id, json.dumps(regions, ensure_ascii=False)),
            )
            self._conn.commit()

    def toggle_region(self, chat_id: int, region: str) -> list[str]:
        regions = self.get_regions(chat_id)
        if region in regions:
            regions.remove(region)
        else:
            regions.append(region)
        self.set_regions(chat_id, regions)
        return regions

    def is_enabled(self, chat_id: int) -> bool:
        row = self._conn.execute(
            "SELECT enabled FROM subscribers WHERE chat_id = ?", (chat_id,)
        ).fetchone()
        return bool(row and row[0])

    def set_enabled(self, chat_id: int, enabled: bool):
        self.ensure_user(chat_id)
        with self._lock:
            self._conn.execute(
                "UPDATE subscribers SET enabled = ? WHERE chat_id = ?",
                (1 if enabled else 0, chat_id),
            )
            self._conn.commit()

    def recipients_for(self, region: str) -> list[int]:
        """Все включённые подписчики, которым интересен регион."""
        rows = self._conn.execute(
            "SELECT chat_id, regions FROM subscribers WHERE enabled = 1"
        ).fetchall()
        result = []
        for chat_id, regions_json in rows:
            regions = json.loads(regions_json)
            if not regions or region in regions:  # [] = вся Украина
                result.append(chat_id)
        return result

    def remove_user(self, chat_id: int):
        with self._lock:
            self._conn.execute("DELETE FROM subscribers WHERE chat_id = ?", (chat_id,))
            self._conn.commit()
