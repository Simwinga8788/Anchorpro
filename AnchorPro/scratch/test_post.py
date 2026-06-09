import urllib.request
import urllib.parse
import json
import http.cookiejar

base_url = "https://anchorpro-production.up.railway.app"

# Setup cookie jar and opener
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
urllib.request.install_opener(opener)

# 1. Login
login_payload = {
    "Email": "anchorcorp@anchor.com",
    "Password": "AnchorPro!123"
}
login_data = json.dumps(login_payload).encode('utf-8')

login_url = f"{base_url}/api/auth/login"
print("Attempting to login to:", login_url)
req = urllib.request.Request(
    login_url,
    data=login_data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as response:
        print("Login status:", response.status)
        res_body = response.read().decode('utf-8')
        print("User profile:", res_body)
except urllib.error.HTTPError as e:
    print("Login failed with status:", e.code)
    print(e.read().decode('utf-8'))
    import sys
    sys.exit(1)

# 2. Post job card with blank JobNumber
job_payload = {
    "Description": "Test Job Card via Python API check (null JobNumber)",
    "EquipmentId": 1,
    "JobTypeId": 1,
    "JobNumber": "",
    "Priority": 1,  # Normal (default / enum)
    "Status": 0     # Unscheduled (default / enum)
}
job_data = json.dumps(job_payload).encode('utf-8')

job_url = f"{base_url}/api/jobcards"
print("\nPosting job card to:", job_url)
req_job = urllib.request.Request(
    job_url,
    data=job_data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req_job) as response:
        print("Create Job status:", response.status)
        res_body = response.read().decode('utf-8')
        print("Job Card created successfully!")
        print(res_body)
except urllib.error.HTTPError as e:
    print("Job Card creation failed with status:", e.code)
    print(e.read().decode('utf-8'))
