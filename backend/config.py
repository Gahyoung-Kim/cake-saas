from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://caker:caker@localhost:3306/cakesaas"
    # 기본값 없음 — 미설정 시 기동 단계에서 실패시켜 취약한 키로 뜨는 것을 막는다
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # 쉼표로 구분된 허용 오리진 (예: "https://caker.kr,https://www.caker.kr")
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",  # VITE_* 등 프론트엔드 변수 무시
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
