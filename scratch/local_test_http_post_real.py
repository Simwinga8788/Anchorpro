import requests

url = "http://localhost:5165/api/jobcards/import"
csv_content = """Job Number,Type,Description,Priority,Status,Equipment,Technician,Scheduled Start,Scheduled End
,,,,,,,,
,,,,,,,,
,,,,,,,,
,,,,,,,,
,,,,,,,,
[Example: e.g. JOB-1001],Preventative Maintenance,[Example: Inspect hydraulic systems],Normal,Unscheduled,Excavator 01,tech_user@domain.com,2026-06-15 08:00,2026-06-15 17:00
[Example: leave empty for auto],Corrective,[Example: Replace blown gasket. Values for Priority: Low/Normal/High/Critical. Values for Status: Unscheduled/Scheduled/InProgress/Completed/Cancelled/OnHold],High,Scheduled,Forklift 2,tech_user@domain.com,2026-06-16 09:00,2026-06-16 12:00
JOB-TEST-1002,Preventative Maintenance,Inspect hydraulic line 2,Normal,Unscheduled,Excavator 01,felix.simwinga@example.com,2026-06-15 08:00,2026-06-15 17:00
"""

with open("temp_test_real.csv", "w", encoding="utf-8") as f:
    f.write(csv_content)

print("Sending POST request with file containing 1 real job...")
files = {'file': ('temp_test_real.csv', open('temp_test_real.csv', 'rb'), 'text/csv')}

try:
    r = requests.post(url, files=files)
    print("Status Code:", r.status_code)
    print("Response Content:", r.text)
except Exception as e:
    print("Error:", e)
