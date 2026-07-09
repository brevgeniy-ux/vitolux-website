# -*- coding: utf-8 -*-
"""
Клиенты API воздушных тревог.

Основной источник — alerts.in.ua (нужен бесплатный токен): отдаёт не только
факт тревоги, но и тип угрозы (воздушная тревога, артобстрел, уличные бои,
химическая/радиационная угроза).

Резервный источник — ubilling.net.ua/aerialalerts (без токена): только факт
воздушной тревоги по областям.

Обе функции возвращают единый формат:
    set[tuple[str, str]] — множество пар (канонический регион, тип тревоги)
"""

import logging

import aiohttp

from regions import normalize

log = logging.getLogger(__name__)

# Типы тревог alerts.in.ua -> человекочитаемое описание
ALERT_TYPES = {
    "air_raid": ("🚨", "Воздушная тревога (ракеты / дроны / авиация)"),
    "artillery_shelling": ("💥", "Угроза артобстрела"),
    "urban_fights": ("⚔️", "Уличные бои"),
    "chemical": ("☣️", "Химическая угроза"),
    "nuclear": ("☢️", "Радиационная угроза"),
}
DEFAULT_TYPE = ("🚨", "Тревога")


def describe_type(alert_type: str) -> tuple[str, str]:
    return ALERT_TYPES.get(alert_type, DEFAULT_TYPE)


class AlertsClient:
    """Опрашивает alerts.in.ua, при недоступности — ubilling.net.ua."""

    ALERTS_IN_UA_URL = "https://api.alerts.in.ua/v1/alerts/active.json"
    UBILLING_URL = "https://ubilling.net.ua/aerialalerts/?json=true"

    def __init__(self, alerts_in_ua_token: str = ""):
        self.token = alerts_in_ua_token
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=20),
                headers={"User-Agent": "ukraine-alert-telegram-bot"},
            )
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def fetch_active(self) -> set[tuple[str, str]] | None:
        """Активные тревоги; None — если ни один источник не ответил."""
        if self.token:
            try:
                return await self._fetch_alerts_in_ua()
            except Exception as e:
                log.warning("alerts.in.ua недоступен (%s), пробую резервный источник", e)
        try:
            return await self._fetch_ubilling()
        except Exception as e:
            log.error("Резервный источник тоже недоступен: %s", e)
            return None

    async def _fetch_alerts_in_ua(self) -> set[tuple[str, str]]:
        session = await self._get_session()
        async with session.get(
            self.ALERTS_IN_UA_URL,
            headers={"Authorization": f"Bearer {self.token}"},
        ) as resp:
            resp.raise_for_status()
            data = await resp.json()

        active: set[tuple[str, str]] = set()
        for alert in data.get("alerts", []):
            if alert.get("finished_at"):
                continue
            # Берём тревоги уровня области (и городов Киев/Севастополь).
            # Районные/громадные тревоги сводим к их области, чтобы
            # подписчик области получил уведомление.
            region = normalize(alert.get("location_oblast") or alert.get("location_title"))
            if not region:
                continue
            active.add((region, alert.get("alert_type") or "air_raid"))
        return active

    async def _fetch_ubilling(self) -> set[tuple[str, str]]:
        session = await self._get_session()
        async with session.get(self.UBILLING_URL) as resp:
            resp.raise_for_status()
            data = await resp.json(content_type=None)

        active: set[tuple[str, str]] = set()
        for name, info in (data.get("states") or {}).items():
            if not info.get("alertnow"):
                continue
            region = normalize(name)
            if region:
                active.add((region, "air_raid"))
        return active
