from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: str = Field(max_length=100, pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(min_length=6, max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class WorkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    author: str = Field(default="", max_length=100)
    content: str = Field(default="")
    mode: str = Field(default="original")
    ancestor_dialogue: bool = Field(default=False)


class WorkResponse(BaseModel):
    id: str
    title: str
    author: str
    mode: str
    ancestor_dialogue: bool = False
    created_at: str
    latest_status: str | None = None
    latest_wcs_score: float | None = None
    latest_tier: str | None = None


class AnalyzeRequest(BaseModel):
    model: str = Field(default="")


class AnalyzeStatus(BaseModel):
    status: str
    wcs_score: float | None = None
    tier: str | None = None


class ReportResponse(BaseModel):
    report: dict
