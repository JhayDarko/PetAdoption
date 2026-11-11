from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    ADMIN_API_KEY: str = ""
    SERVICE_KEY: str = ""
    MASCOTAS_API_URL: str = ""
    CORS_ORIGINS: str = "*"
    JWT_SECRET: str = ""
    JWT_EXPIRE_MINUTES: int = 480
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD_HASH: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
