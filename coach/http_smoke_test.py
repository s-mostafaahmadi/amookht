import json
import ssl
import urllib.request

BASE = "https://127.0.0.1:8790"
CTX = ssl._create_unverified_context()


def request(path, data=None, content_type="application/json"):
    body = None if data is None else (json.dumps(data).encode() if isinstance(data, dict) else data)
    req = urllib.request.Request(BASE + path, data=body, headers={"Content-Type": content_type})
    with urllib.request.urlopen(req, context=CTX, timeout=45) as response:
        return response.status, response.headers, response.read()


status, _, body = request("/api/health")
health = json.loads(body)
assert status == 200 and health["ok"] and health["groq_pool"] >= 1
print("HEALTH_OK", health["groq_pool"])

status, _, body = request("/api/chat", {
    "session_id": "http-smoke",
    "text": "Ich habe gestern ins Kino gegangen.",
    "level": "B1",
    "topic": "Alltag",
})
chat = json.loads(body)
assert status == 200 and chat["corrected_de"] and chat["reply_de"]
print("CHAT_HTTP_OK", chat["provider"], chat["latency_ms"])

status, headers, body = request("/api/tts", {"text": chat["reply_de"]})
assert status == 200 and body[:4] == b"RIFF" and len(body) > 1000
print("TTS_HTTP_OK", len(body), headers.get_content_type())
