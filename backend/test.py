from clients.email_client import get_email_service
from utils.email_utils import *
from utils.helper import decode_b64

service = get_email_service()


message_id_array = list_unread_emails(service, 10)
print(message_id_array)
thread_id = get_thread_id(service, message_id_array[0])
print(thread_id)
threads = get_thread_via_thread_id(service, thread_id)
for i in threads:
    # print(i["parts"][0]["body"]["data"])

    b64encoded = i.get("payload").get("parts")[0].get("body").get("data")
    decoded = decode_b64(b64encoded)
    print(decoded)
    print("-" * 20)
