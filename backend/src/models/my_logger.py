# import logging
# import requests
# import datetime

# class RemoteLogHandler(logging.Handler):
#     def __init__(self, endpoint_url, application_name):
#         super().__init__()
#         self.endpoint_url = endpoint_url
#         self.application_name = application_name

#     def emit(self, record):
#         log_payload = [{
#             "application": self.application_name,
#             "app_id": "ta-ai-a3b8b16d",  # Optional, can be added later
#             "level": record.levelname,
#             "severity": record.levelname,  # You can map this if needed
#             "message": record.getMessage(),
#             "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
#             "path": record.pathname,
#             "exception_type": getattr(record, "exception_type", None),
#             "status_code": getattr(record, "status_code", None),
#             "user_id" : "6900934556bc8e47e7a464fd",
#             "tags": getattr(record, "tags", [])
#         }]

#         try:
#             requests.post(self.endpoint_url, json=log_payload)
#         except Exception as e:
#             print(f"Failed to send log: {e}")

# # Usage
# logger = logging.getLogger("ta_ai_logger")
# logger.setLevel(logging.INFO)

# remote_handler = RemoteLogHandler("http://10.112.141.172:8001/logs", "Ta-ai")
# logger.addHandler(remote_handler)

# # Example log with extra fields
# # extra_info = {
# #     "exception_type": "ServerSelectionTimeoutError",
# #     "status_code": 404,
# #     "tags": ["mongodb", "startup", "db-conn"]
# # }
# # logger.error("Failed to initialize MongoDB connection", extra=extra_info)
