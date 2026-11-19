"""Optional PostgreSQL persistence for analyzed capture summaries."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


class CaptureAnalysis(Base):
    __tablename__ = "capture_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_format: Mapped[str] = mapped_column(String(10), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    total_packets: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(nullable=False)
    findings_count: Mapped[int] = mapped_column(Integer, nullable=False)
    summary: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)


def _database_url() -> str:
    url = settings.DATABASE_URL
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


engine = create_engine(_database_url(), pool_pre_ping=True, connect_args={"connect_timeout": 10}) if settings.DATABASE_URL else None
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False) if engine else None


def initialize_database() -> bool:
    if engine is None:
        print("[PacketLearner] DATABASE_URL is not set; capture history persistence is disabled.")
        return False
    Base.metadata.create_all(engine)
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    print("[PacketLearner] PostgreSQL connected; capture history table is ready.")
    return True


def save_analysis(analysis: Any) -> str:
    if SessionLocal is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL on the backend service.")

    metadata = analysis.metadata
    # Store summary evidence only. Raw PCAPs and individual packet records are never persisted.
    summary = {
        "protocolCounts": [item.model_dump(mode="json", by_alias=True) for item in analysis.protocolCounts],
        "topTalkers": [item.model_dump(mode="json", by_alias=True) for item in analysis.topTalkers],
        "findings": [item.model_dump(mode="json", by_alias=True) for item in analysis.findings],
    }
    row = CaptureAnalysis(
        file_name=(metadata.fileName or "capture")[:255],
        file_format=metadata.format[:10],
        file_size_bytes=metadata.fileSizeBytes,
        total_packets=metadata.totalPackets,
        duration_seconds=metadata.durationSeconds,
        findings_count=len(analysis.findings),
        summary=summary,
    )
    with SessionLocal() as session:
        session.add(row)
        session.commit()
        return row.id


def list_analyses(limit: int = 10) -> list[dict[str, Any]]:
    if SessionLocal is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL on the backend service.")
    with SessionLocal() as session:
        rows = session.scalars(select(CaptureAnalysis).order_by(CaptureAnalysis.created_at.desc()).limit(limit)).all()
        return [
            {
                "id": row.id,
                "fileName": row.file_name,
                "format": row.file_format,
                "fileSizeBytes": row.file_size_bytes,
                "totalPackets": row.total_packets,
                "durationSeconds": row.duration_seconds,
                "findingsCount": row.findings_count,
                "createdAt": row.created_at.isoformat(),
            }
            for row in rows
        ]
