import requests

r = requests.post("http://127.0.0.1:8000", data = {"key": "value"})
print(r.status_code, r.reason)
