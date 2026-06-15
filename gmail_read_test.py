from email.message import EmailMessage
import os.path
import base64

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
]


def get_email_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json",
                SCOPES,
            )
            creds = flow.run_local_server(prot=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def list_unread_emails(service, limit=10):
    result = (
        service.users()
        .messages()
        .list(userId="me", q="is:unread", maxResults=limit)
        .execute()
    )
    messages = result.get("messages", [])
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

        print("ID:", message["id"])
        print("Thread:", full_msg["threadId"])
        print("From:", headers.get("From"))
        print("Subject:", headers.get("Subject"))
        print("Snippet:", full_msg.get("snippet"))
        print("-" * 60)


def send_email(service, to, subject, body):
    message = EmailMessage()
    message["To"] = to
    message["From"] = "me"
    message["Subject"] = subject
    message.set_content(body)

    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
    sent = service.users().messages().send(userId="me", body={"raw": encoded}).execute()

    return sent


service = get_email_service()
# list_unread_emails(service)


to = "sulavstha0007@gmail.com"
subject = "test email"
body = "hello from the other side"

send_email(service, to, subject, body)
