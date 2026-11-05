from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = (
    create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=3,
        max_overflow=2,
    )
    if settings.DATABASE_URL
    else None
)
SessionLocal = (
    sessionmaker(bind=engine, autoflush=False, autocommit=False)
    if engine is not None
    else None
)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("Configura DATABASE_URL para usar la base de datos.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
