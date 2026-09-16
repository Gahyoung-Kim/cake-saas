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

    # AI 추출 모델
    OPENAI_MODEL: str = "gpt-4o-mini"

    # 요청 빈도 제한. 워커가 2개 이상이면 redis://... 를 지정해야 공유된다
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STORAGE_URI: str = ""

    # 운영에서는 API 스펙을 공개하지 않는다
    ENABLE_DOCS: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",  # VITE_* 등 프론트엔드 변수 무시
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
