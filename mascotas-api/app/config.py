from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    ADMIN_API_KEY: str = ""
    SERVICE_KEY: str = ""
    CORS_ORIGINS: str = "*"
    JWT_SECRET: str = ""
    ADMIN_USERNAME: str = "admin"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
