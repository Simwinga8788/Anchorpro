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

# 2. Post ad-hoc invoice with blank InvoiceNumber
invoice_payload = {
    "InvoiceNumber": "",
    "JobCardId": None,
    "CustomerId": None,
    "ContractId": None,
    "Subtotal": 12500.00,
    "TaxRate": 16.00,
    "Notes": "Test ad-hoc invoice via python API check (null InvoiceNumber)"
}
invoice_data = json.dumps(invoice_payload).encode('utf-8')

invoice_url = f"{base_url}/api/financial/invoices"
print("\nPosting ad-hoc invoice to:", invoice_url)
req_inv = urllib.request.Request(
    invoice_url,
    data=invoice_data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req_inv) as response:
        print("Create Invoice status:", response.status)
        res_body = response.read().decode('utf-8')
        print("Invoice created successfully!")
        print(res_body)
except urllib.error.HTTPError as e:
    print("Invoice creation failed with status:", e.code)
    print(e.read().decode('utf-8'))
