from email.message import EmailMessage
from pathlib import Path
import sys

import base64

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from clients.email_client import get_email_service


def list_unread_emails(service, limit=10):
    result = (
        service.users()
        .messages()
        .list(userId="me", q="is:unread", maxResults=limit)
        .execute()
    )
    messages = result.get("messages", [])
    message_id_array = []
    for message in messages:
        full_msg = (
            service.users()
            .messages()
            .get(
                userId="me",
                id=message["id"],
                format="metadata",
                metadataHeaders=["Subject", "From", "Date", "Message-ID"],
            )
            .execute()
        )

        headers = {
            h["name"]: h["value"] for h in full_msg["payload"].get("headers", [])
        }
        message_id_array.append(message["id"])

        # print("ID:", message["id"])
        # print("Thread:", full_msg["threadId"])
        # print("From:", headers.get("From"))
        # print("Subject:", headers.get("Subject"))
        # print("Snippet:", full_msg.get("snippet"))
        # print("-" * 60)
    return message_id_array


def get_thread_id(service, id: str) -> str:
    full_msg = (
        service.users()
        .messages()
        .get(
            userId="me",
            id=id,
            format="metadata",
            metadataHeaders=["Subject", "From", "Date", "Message-ID"],
        )
        .execute()
    )
    return full_msg["threadId"]


def get_thread_via_thread_id(service, thread_id: str) -> list[dict]:
    thread = (
        service.users()
        .threads()
        .get(userId="me", id=thread_id, format="full")
        .execute()
    )
    return thread.get("messages", [])


def get_email_via_id(service, id):
    full_msg = (
        service.users()
        .messages()
        .get(
            userId="me",
            id=id,
            format="metadata",
            metadataHeaders=["Subject", "From", "Date", "Message-ID"],
        )
        .execute()
    )
    headers = {h["name"]: h["value"] for h in full_msg["payload"].get("headers", [])}
    print("From:", headers.get("From"))
    print("Subject:", headers.get("Subject"))
    return full_msg


def send_email(service, to, subject, body):
    message = EmailMessage()
    message["To"] = to
    message["From"] = "me"
    message["Subject"] = subject
    message.set_content(body)

    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
    sent = service.users().messages().send(userId="me", body={"raw": encoded}).execute()

    return sent
