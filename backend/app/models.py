from typing import List, Optional
from pydantic import BaseModel, Field


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


class ErrorResponse(BaseModel):
    detail: str
