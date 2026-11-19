import asyncio
import io
import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import assistant
from app.models import AssistantQuestionRequest


def request(provider: str) -> AssistantQuestionRequest:
    return AssistantQuestionRequest.model_validate(
        {
            "question": "Explain the selected evidence.",
            "provider": provider,
            "context": {
                "fileName": "synthetic.pcap",
                "format": "pcap",
                "totalPackets": 1,
                "returnedPackets": 1,
                "durationSeconds": 1,
                "protocols": [],
                "selectedPacket": {
                    "id": 1,
                    "timestamp": 0,
                    "sourceIp": "10.0.0.1",
                    "destinationIp": "10.0.0.2",
                    "protocol": "TCP",
                    "length": 60,
                },
                "findings": [],
            },
        }
    )


def test_provider_routing_preserves_openai_and_ollama_choices(monkeypatch):
    calls = []

    def fake_openai(*args):
        calls.append("openai")
        return "openai answer"

    def fake_ollama(*args):
        calls.append("ollama")
        return "ollama answer"

    monkeypatch.setattr(assistant, "_ask_openai", fake_openai)
    monkeypatch.setattr(assistant, "_ask_ollama", fake_ollama)

    assert asyncio.run(assistant.answer_question(request("openai"))).answer == "openai answer"
    assert asyncio.run(assistant.answer_question(request("ollama"))).answer == "ollama answer"
    assert calls == ["openai", "ollama"]


def test_openai_call_is_mocked_and_keeps_capture_context_bounded(monkeypatch):
    captured = {}

    class FakeOpenAI:
        def __init__(self, **kwargs):
            captured["client"] = kwargs
            self.responses = self

        def create(self, **kwargs):
            captured["request"] = kwargs
            return SimpleNamespace(output_text="safe answer")

    monkeypatch.setattr(assistant, "OpenAI", FakeOpenAI)
    monkeypatch.setattr(assistant.settings, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(assistant.settings, "OPENAI_MODEL", "test-model")
    context_json, conversation_json = assistant._bounded_context(request("openai"))

    assert assistant._ask_openai(request("openai"), context_json, conversation_json) == "safe answer"
    assert "payload" not in captured["request"]["input"].lower()


def test_ollama_empty_compatible_response_falls_back_to_native_api(monkeypatch):
    class FakeOllama:
        def __init__(self, **kwargs):
            self.models = self
            self.chat = self
            self.completions = self

        def list(self):
            return SimpleNamespace(data=[SimpleNamespace(id="llama3.2:3b")])

        def create(self, **kwargs):
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=""))])

    class NativeResponse(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    monkeypatch.setattr(assistant, "OpenAI", FakeOllama)
    monkeypatch.setattr(
        assistant.urllib.request,
        "urlopen",
        lambda request, timeout: NativeResponse(json.dumps({"message": {"content": "native answer"}}).encode()),
    )
    context_json, conversation_json = assistant._bounded_context(request("ollama"))

    assert assistant._ask_ollama(request("ollama"), context_json, conversation_json) == "native answer"


def test_ollama_no_text_returns_clear_error(monkeypatch):
    monkeypatch.setattr(assistant, "_ask_ollama_native", lambda *args: "")
    client = SimpleNamespace(
        models=SimpleNamespace(list=lambda: SimpleNamespace(data=[SimpleNamespace(id="llama3.2:3b")])),
        chat=SimpleNamespace(completions=SimpleNamespace(create=lambda **kwargs: SimpleNamespace(choices=[]))),
    )
    monkeypatch.setattr(assistant, "OpenAI", lambda **kwargs: client)
    context_json, conversation_json = assistant._bounded_context(request("ollama"))

    with pytest.raises(HTTPException, match="Ollama returned no text"):
        assistant._ask_ollama(request("ollama"), context_json, conversation_json)
