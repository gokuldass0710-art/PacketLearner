from pydantic import BaseModel, Field


class CaptureStartRequest(BaseModel):
    interface_id: str = Field(min_length=1, max_length=128)


class CaptureInterfaceResponse(BaseModel):
    id: str
    name: str
    description: str


class CaptureStatusResponse(BaseModel):
    status: str
    interface_id: str | None = None
    started_at: str | None = None
    elapsed_seconds: float = 0
    duration_limit_seconds: int
    max_size_mb: int
    error: str | None = None
