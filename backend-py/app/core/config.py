from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
	APP_NAME: str = "HPC SSH Key Portal"
	ENV: str = Field(default="development")
	PORT: int = Field(default=3000)
	FRONTEND_URL: str = Field(default="http://localhost:3001")

	DB_HOST: str = Field(default="localhost")
	DB_PORT: int = Field(default=5432)
	DB_NAME: str = Field(default="hpc_ssh_portal")
	DB_USER: str = Field(default="username")
	DB_PASSWORD: str = Field(default="password")
	DATABASE_URL: str | None = Field(default=None)

	JWT_SECRET: str = Field(default="change-me")
	JWT_EXPIRES_HOURS: int = Field(default=24)

	LDAP_URL: str = Field(default="ldap://localhost:389")
	LDAP_BASE_DN: str = Field(default="dc=example,dc=com")
	LDAP_USER_FILTER: str = Field(default="(cn={username})")

	SYSGEN_ENCRYPTION_KEY: str = Field(default="change-this-key")
	SYSGEN_DOWNLOAD_TTL_MIN: int = Field(default=10)

	ALLOW_TEST_LOGIN: bool = Field(default=True)

	# Apply service (SSH) settings
	APPLY_SSH_USER: str = Field(default="root")
	APPLY_SSH_KEY_PATH: str = Field(default="~/.ssh/id_rsa")
	APPLY_STRICT_HOST_KEY_CHECK: bool = Field(default=False)

	class Config:
		env_file = ".env"
		case_sensitive = False

settings = Settings() 