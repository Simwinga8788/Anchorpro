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

# 2. Try to assign/schedule job card (Id=122) with null TechnicianId
assign_payload = {
    "TechnicianId": None,
    "ScheduledStart": "2026-06-15T08:00:00Z",
    "ScheduledEnd": "2026-06-15T17:00:00Z"
}
assign_data = json.dumps(assign_payload).encode('utf-8')

assign_url = f"{base_url}/api/jobcards/122/assign"
print("\nAttempting to assign/schedule job 122 to:", assign_url)
req_assign = urllib.request.Request(
    assign_url,
    data=assign_data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req_assign) as response:
        print("Assign status:", response.status)
        print("Job card successfully assigned/scheduled with null TechnicianId!")
except urllib.error.HTTPError as e:
    print("Assign failed with status:", e.code)
    print(e.read().decode('utf-8'))
