from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    tshark_installed: bool
    tshark_path: str
    tshark_version: Optional[str] = None


class TCPFlags(BaseModel):
    syn: bool = False
    ack: bool = False
    fin: bool = False
    rst: bool = False
    psh: bool = False
    urg: bool = False
    raw: Optional[str] = None


class PacketRecord(BaseModel):
    id: int = Field(..., description="Frame / packet sequence number")
    timestamp: float = Field(..., description="Relative seconds from capture start")
    formattedTime: str = Field(..., description="Formatted arrival time")
    sourceIp: str = Field(..., description="Source IPv4, IPv6, or MAC/ARP address")
    destinationIp: str = Field(..., description="Destination IPv4, IPv6, or MAC/ARP address")
    sourcePort: Optional[int] = Field(None, description="Source TCP/UDP port")
    destinationPort: Optional[int] = Field(None, description="Destination TCP/UDP port")
    protocol: str = Field(..., description="Identified protocol, e.g. TCP, DNS, HTTP")
    length: int = Field(..., description="Packet length in bytes")
    info: str = Field("", description="Wireshark summary info column")
    tcpFlags: Optional[TCPFlags] = None


class ProtocolCount(BaseModel):
    protocol: str
    count: int
    percentage: float


class TopTalker(BaseModel):
    ip: str
    packetCount: int
    bytes: int


class FindingTimeWindow(BaseModel):
    startSeconds: float
    endSeconds: float
    durationSeconds: float


class DetectionFinding(BaseModel):
    id: str
    ruleId: str
    ruleName: str
    title: str
    severity: Literal["info", "low", "medium", "high", "critical"]
    sourceIp: str
    destinationIp: str
    observedDestinationPorts: List[int]
    timeWindow: FindingTimeWindow
    packetCount: int
    relevantPacketIds: List[int]
    explanation: str
    recommendedSteps: List[str]


class CaptureMetadata(BaseModel):
    fileName: str
    fileSizeBytes: int
    format: str  # "pcap" or "pcapng"
    totalPackets: int
    returnedPackets: int
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    durationSeconds: float = 0.0


class AnalysisResponse(BaseModel):
    metadata: CaptureMetadata
    protocolCounts: List[ProtocolCount]
    topTalkers: List[TopTalker]
    packets: List[PacketRecord]
    findings: List[DetectionFinding]


class AssistantPacketContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    id: int
    timestamp: float = Field(..., ge=0, le=86400)
    source_ip: str = Field(..., alias="sourceIp", max_length=128)
    destination_ip: str = Field(..., alias="destinationIp", max_length=128)
    source_port: Optional[int] = Field(None, alias="sourcePort", ge=0, le=65535)
    destination_port: Optional[int] = Field(None, alias="destinationPort", ge=0, le=65535)
    protocol: str = Field(..., max_length=32)
    length: int = Field(..., ge=0, le=10_000_000)
    tcp_flags: Optional[TCPFlags] = Field(None, alias="tcpFlags")


class AssistantFindingContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    rule_id: str = Field(..., alias="ruleId", max_length=64)
    rule_name: str = Field(..., alias="ruleName", max_length=128)
    title: str = Field(..., max_length=200)
    severity: Literal["info", "low", "medium", "high", "critical"]
    source_ip: str = Field(..., alias="sourceIp", max_length=128)
    destination_ip: str = Field(..., alias="destinationIp", max_length=128)
    observed_destination_ports: List[int] = Field(default_factory=list, alias="observedDestinationPorts", max_length=100)
    time_window: FindingTimeWindow = Field(..., alias="timeWindow")
    packet_count: int = Field(..., ge=0, le=100_000, alias="packetCount")
    relevant_packet_ids: List[int] = Field(default_factory=list, alias="relevantPacketIds", max_length=200)
    explanation: str = Field(..., max_length=1600)
    recommended_steps: List[str] = Field(default_factory=list, alias="recommendedSteps", max_length=10)


class AssistantCaptureContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    file_name: str = Field(..., alias="fileName", max_length=255)
    format: Literal["pcap", "pcapng", "unknown"]
    total_packets: int = Field(..., ge=0, le=10_000_000, alias="totalPackets")
    returned_packets: int = Field(..., ge=0, le=10_000_000, alias="returnedPackets")
    duration_seconds: float = Field(..., ge=0, le=86_400, alias="durationSeconds")
    protocols: List[ProtocolCount] = Field(default_factory=list, max_length=20)
    selected_packet: Optional[AssistantPacketContext] = Field(None, alias="selectedPacket")
    findings: List[AssistantFindingContext] = Field(default_factory=list, max_length=50)


class AssistantConversationMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=1500)


class AssistantQuestionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=1, max_length=2000)
    context: AssistantCaptureContext
    conversation: List[AssistantConversationMessage] = Field(default_factory=list, max_length=8)


class AssistantResponse(BaseModel):
    answer: str


class ErrorResponse(BaseModel):
    detail: str
