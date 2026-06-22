import base64


def decode_b64(data: str) -> str:
    data += "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data).decode(
        "utf-8",
        errors="replace",
    )
