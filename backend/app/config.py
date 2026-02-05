from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Dongpeng CRM"
    secret_key: str = "change_me"
    access_token_expire_minutes: int = 120
    database_url: str = "postgresql+psycopg2://crm:crm@db:5432/crm"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
