$baseUrl = "http://localhost:5165"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$pass = 0; $fail = 0; $total = 0

function Test-Api {
    param(
        [string]$Label,
        [string]$Uri,
        [string]$Method = "Get",
        [string]$Body = $null,
        [string]$ContentType = "application/json",
        [int[]]$ExpectedCodes = @(200, 201, 204)
    )
    $script:total++
    try {
        $params = @{ Uri = $Uri; Method = $Method; WebSession = $session; ErrorAction = "Stop" }
        if ($Body) { $params.Body = $Body; $params.ContentType = $ContentType }
        $resp = Invoke-RestMethod @params
        $script:pass++
        Write-Host "  [PASS] $Label" -ForegroundColor Green
        return $resp
    } catch {
        $code = [int]$_.Exception.Response.StatusCode
        if ($code -in $ExpectedCodes) {
            $script:pass++
            Write-Host "  [PASS] $Label (HTTP $code)" -ForegroundColor Green
        } else {
            $script:fail++
            $errBody = ""
            try { $errBody = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd() } catch {}
            Write-Host "  [FAIL] $Label (HTTP $code) $($errBody.Substring(0,[Math]::Min(100,$errBody.Length)))" -ForegroundColor Red
        }
        return $null
    }
}

# ── LOGIN ─────────────────────────────────────────────────────────────────────
Write-Host "`n=== LOGIN ===" -ForegroundColor Cyan
$me = Test-Api "POST /api/auth/login" "$baseUrl/api/auth/login" -Method Post -Body '{"email":"anchorcorp@anchor.com","password":"AnchorPro!123"}'
if (-not $me) { Write-Host "FATAL: Cannot login." -ForegroundColor Red; exit 1 }
Write-Host "  Logged in as: $($me.email) | Roles: $($me.roles -join ', ')" -ForegroundColor DarkGreen

# ── AUTH ─────────────────────────────────────────────────────────────────────
Write-Host "`n=== AUTH ===" -ForegroundColor Cyan
Test-Api "GET  /api/auth/me"             "$baseUrl/api/auth/me"
Test-Api "POST /api/auth/forgot-password" "$baseUrl/api/auth/forgot-password" -Method Post -Body '{"email":"anchorcorp@anchor.com"}'

# ── DASHBOARD ────────────────────────────────────────────────────────────────
Write-Host "`n=== DASHBOARD ===" -ForegroundColor Cyan
Test-Api "GET /api/dashboard/stats"       "$baseUrl/api/dashboard/stats"
Test-Api "GET /api/dashboard/performance" "$baseUrl/api/dashboard/performance"
Test-Api "GET /api/dashboard/health"      "$baseUrl/api/dashboard/health"
Test-Api "GET /api/dashboard/executive"   "$baseUrl/api/dashboard/executive"
Test-Api "GET /api/dashboard/departments" "$baseUrl/api/dashboard/departments"

# ── JOB CARDS ────────────────────────────────────────────────────────────────
Write-Host "`n=== JOB CARDS ===" -ForegroundColor Cyan
$jobs  = Test-Api "GET /api/jobcards" "$baseUrl/api/jobcards"
$jobId = if ($jobs -and $jobs.Count -gt 0) { $jobs[0].id } else { 0 }
Write-Host "  (Live Job ID: $jobId)" -ForegroundColor DarkGray
if ($jobId -gt 0) {
    Test-Api "GET /api/jobcards/{id}"             "$baseUrl/api/jobcards/$jobId"
    Test-Api "GET /api/jobcards/{id}/tasks"       "$baseUrl/api/jobcards/$jobId/tasks"
    Test-Api "GET /api/jobcards/{id}/attachments" "$baseUrl/api/jobcards/$jobId/attachments"
    Test-Api "GET /api/jobcards/{id}/parts"       "$baseUrl/api/jobcards/$jobId/parts"
}

# ── JOB TASKS ────────────────────────────────────────────────────────────────
Write-Host "`n=== JOB TASKS ===" -ForegroundColor Cyan
if ($jobId -gt 0) { Test-Api "GET /api/jobtasks/job/{id}" "$baseUrl/api/jobtasks/job/$jobId" }

# ── EQUIPMENT ────────────────────────────────────────────────────────────────
Write-Host "`n=== EQUIPMENT ===" -ForegroundColor Cyan
$refEq = Test-Api "GET /api/referencedata/equipment" "$baseUrl/api/referencedata/equipment"
$eqId  = if ($refEq -and $refEq.Count -gt 0) { $refEq[0].id } else { 0 }
$eqs   = Invoke-RestMethod -Uri "$baseUrl/api/equipment" -WebSession $session -ErrorAction SilentlyContinue
if (-not $eqId -and $eqs -and $eqs.Count -gt 0) { $eqId = $eqs[0].id }
Write-Host "  (Live Equipment ID: $eqId)" -ForegroundColor DarkGray
if ($eqId -gt 0) {
    Test-Api "GET /api/equipment/{id}"           "$baseUrl/api/equipment/$eqId"
    Test-Api "GET /api/dashboard/equipment/{id}" "$baseUrl/api/dashboard/equipment/$eqId"
}

# ── CUSTOMERS ────────────────────────────────────────────────────────────────
Write-Host "`n=== CUSTOMERS ===" -ForegroundColor Cyan
$custs  = Test-Api "GET /api/customers" "$baseUrl/api/customers"
$custId = if ($custs -and $custs.Count -gt 0) { $custs[0].id } else { 0 }
Write-Host "  (Live Customer ID: $custId)" -ForegroundColor DarkGray
if ($custId -gt 0) {
    Test-Api "GET /api/customers/{id}"       "$baseUrl/api/customers/$custId"
    Test-Api "GET /api/customers/{id}/full"  "$baseUrl/api/customers/$custId/full"
    Test-Api "GET /api/customers/{id}/stats" "$baseUrl/api/customers/$custId/stats"
}

# ── CONTRACTS ────────────────────────────────────────────────────────────────
Write-Host "`n=== CONTRACTS ===" -ForegroundColor Cyan
$contracts = Test-Api "GET /api/contracts" "$baseUrl/api/contracts"
$contId    = if ($contracts -and $contracts.Count -gt 0) { $contracts[0].id } else { 0 }
Write-Host "  (Live Contract ID: $contId)" -ForegroundColor DarkGray
if ($contId -gt 0) {
    Test-Api "GET /api/contracts/{id}"       "$baseUrl/api/contracts/$contId"
    Test-Api "GET /api/contracts/{id}/sla"   "$baseUrl/api/contracts/$contId/sla"
}
if ($custId -gt 0) {
    Test-Api "GET /api/contracts/customer/{id}" "$baseUrl/api/contracts/customer/$custId"
}

# ── FINANCIAL ────────────────────────────────────────────────────────────────
Write-Host "`n=== FINANCIAL ===" -ForegroundColor Cyan
Test-Api "GET /api/financial/snapshot"         "$baseUrl/api/financial/snapshot"
$invs  = Test-Api "GET /api/financial/invoices" "$baseUrl/api/financial/invoices"
Test-Api "GET /api/financial/invoices/overdue" "$baseUrl/api/financial/invoices/overdue"
$invId = if ($invs -and $invs.Count -gt 0) { $invs[0].id } else { 0 }
if ($invId -gt 0) {
    Test-Api "GET /api/financial/invoices/{id}"          "$baseUrl/api/financial/invoices/$invId"
    Test-Api "GET /api/financial/invoices/{id}/payments" "$baseUrl/api/financial/invoices/$invId/payments"
    if ($jobId -gt 0) {
        Test-Api "GET /api/financial/invoices/job/{jobId}" "$baseUrl/api/financial/invoices/job/$jobId" -ExpectedCodes @(200,404)
    }
}

# ── INVENTORY ────────────────────────────────────────────────────────────────
Write-Host "`n=== INVENTORY ===" -ForegroundColor Cyan
$inv       = Test-Api "GET /api/inventory" "$baseUrl/api/inventory"
$invItemId = if ($inv -and $inv.Count -gt 0) { $inv[0].id } else { 0 }
Write-Host "  (Live Inventory Item ID: $invItemId)" -ForegroundColor DarkGray
if ($invItemId -gt 0) {
    Test-Api "GET /api/inventory/{id}" "$baseUrl/api/inventory/$invItemId"
}

# ── PROCUREMENT ──────────────────────────────────────────────────────────────
Write-Host "`n=== PROCUREMENT ===" -ForegroundColor Cyan
$orders = Test-Api "GET /api/procurement/orders"    "$baseUrl/api/procurement/orders"
$supps  = Test-Api "GET /api/procurement/suppliers" "$baseUrl/api/procurement/suppliers"
$suppId = if ($supps -and $supps.Count -gt 0) { $supps[0].id } else { 0 }
Write-Host "  (Live Supplier ID: $suppId)" -ForegroundColor DarkGray
if ($suppId -gt 0) {
    Test-Api "GET /api/procurement/suppliers/{id}" "$baseUrl/api/procurement/suppliers/$suppId"
}

# ── DOWNTIME ─────────────────────────────────────────────────────────────────
Write-Host "`n=== DOWNTIME ===" -ForegroundColor Cyan
Test-Api "GET /api/downtime"        "$baseUrl/api/downtime"
Test-Api "GET /api/downtime/active" "$baseUrl/api/downtime/active" -ExpectedCodes @(200,400,404)

# ── DEPARTMENTS ──────────────────────────────────────────────────────────────
Write-Host "`n=== DEPARTMENTS ===" -ForegroundColor Cyan
$depts  = Test-Api "GET /api/departments" "$baseUrl/api/departments"
$deptId = if ($depts -and $depts.Count -gt 0) { $depts[0].id } else { 0 }
Write-Host "  (Live Department ID: $deptId)" -ForegroundColor DarkGray
if ($deptId -gt 0) {
    Test-Api "GET /api/departments/{id}" "$baseUrl/api/departments/$deptId"
}

# ── USERS ────────────────────────────────────────────────────────────────────
Write-Host "`n=== USERS ===" -ForegroundColor Cyan
Test-Api "GET /api/users/me" "$baseUrl/api/users/me"
$users  = Test-Api "GET /api/users" "$baseUrl/api/users"
$uid    = if ($users -and $users.Count -gt 0) { $users[0].id } else { "" }
if ($uid) { Test-Api "GET /api/users/{id}" "$baseUrl/api/users/$uid" }

# ── SAFETY ───────────────────────────────────────────────────────────────────
Write-Host "`n=== SAFETY ===" -ForegroundColor Cyan
Test-Api "GET /api/safety/stats"    "$baseUrl/api/safety/stats"
Test-Api "GET /api/safety/permits"  "$baseUrl/api/safety/permits"
if ($jobId -gt 0) {
    Test-Api "GET /api/safety/permits/job/{id}" "$baseUrl/api/safety/permits/job/$jobId" -ExpectedCodes @(200,404)
}

# ── ALERTS ───────────────────────────────────────────────────────────────────
Write-Host "`n=== ALERTS ===" -ForegroundColor Cyan
Test-Api "GET /api/alerts"              "$baseUrl/api/alerts"
Test-Api "GET /api/alerts/unread-count" "$baseUrl/api/alerts/unread-count"
$alertResp = Test-Api "POST /api/alerts" "$baseUrl/api/alerts" -Method Post -Body '{"title":"E2E Test","message":"Controller Test Run","severity":"Info","category":"General"}' -ExpectedCodes @(200,201)
if ($alertResp -and $alertResp.id) {
    Test-Api "PATCH /api/alerts/{id}/read" "$baseUrl/api/alerts/$($alertResp.id)/read" -Method Patch
}
Test-Api "PATCH /api/alerts/dismiss-all" "$baseUrl/api/alerts/dismiss-all" -Method Patch

# ── INTELLIGENCE ─────────────────────────────────────────────────────────────
Write-Host "`n=== INTELLIGENCE (BI) ===" -ForegroundColor Cyan
Test-Api "GET /api/intelligence/summary"                "$baseUrl/api/intelligence/summary"
Test-Api "GET /api/intelligence/profitability"          "$baseUrl/api/intelligence/profitability"
Test-Api "GET /api/intelligence/technician-utilization" "$baseUrl/api/intelligence/technician-utilization"
Test-Api "GET /api/intelligence/revenue-by-customer"    "$baseUrl/api/intelligence/revenue-by-customer"
Test-Api "GET /api/intelligence/asset-performance"      "$baseUrl/api/intelligence/asset-performance"
Test-Api "GET /api/intelligence/inventory-consumption"  "$baseUrl/api/intelligence/inventory-consumption"

# ── REPORTING ────────────────────────────────────────────────────────────────
Write-Host "`n=== REPORTING ===" -ForegroundColor Cyan
Test-Api "GET /api/reporting/schedules"    "$baseUrl/api/reporting/schedules"
Test-Api "GET /api/reporting/preview/html" "$baseUrl/api/reporting/preview/html"

# ── EXPORT ───────────────────────────────────────────────────────────────────
Write-Host "`n=== EXPORT ===" -ForegroundColor Cyan
Test-Api "GET /api/export/jobs/csv" "$baseUrl/api/export/jobs/csv"

# ── SETTINGS ─────────────────────────────────────────────────────────────────
Write-Host "`n=== SETTINGS ===" -ForegroundColor Cyan
Test-Api "GET /api/settings"                  "$baseUrl/api/settings"
Test-Api "GET /api/settings/Org.CompanyName"  "$baseUrl/api/settings/Org.CompanyName"

# ── REFERENCE DATA ───────────────────────────────────────────────────────────
Write-Host "`n=== REFERENCE DATA ===" -ForegroundColor Cyan
Test-Api "GET /api/referencedata/jobtypes"           "$baseUrl/api/referencedata/jobtypes"
Test-Api "GET /api/referencedata/downtimecategories" "$baseUrl/api/referencedata/downtimecategories"
Test-Api "GET /api/referencedata/customers"          "$baseUrl/api/referencedata/customers"
Test-Api "GET /api/referencedata/contracts"          "$baseUrl/api/referencedata/contracts"
Test-Api "GET /api/referencedata/technicians"        "$baseUrl/api/referencedata/technicians"

# ── AUDIT LOG ────────────────────────────────────────────────────────────────
Write-Host "`n=== AUDIT LOG ===" -ForegroundColor Cyan
Test-Api "GET /api/audit-log"          "$baseUrl/api/audit-log"
Test-Api "GET /api/audit-log/security" "$baseUrl/api/audit-log/security"

# ── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
Write-Host "`n=== SUBSCRIPTIONS ===" -ForegroundColor Cyan
Test-Api "GET /api/subscriptions/plans"              "$baseUrl/api/subscriptions/plans"
Test-Api "GET /api/subscriptions/current"            "$baseUrl/api/subscriptions/current"
Test-Api "GET /api/subscriptions/features/Exports"   "$baseUrl/api/subscriptions/features/Exports"
Test-Api "GET /api/subscriptions/requiring-action"   "$baseUrl/api/subscriptions/requiring-action"

# ── TENANTS (PO only) ────────────────────────────────────────────────────────
Write-Host "`n=== TENANTS (PO Only - 403 expected as tenant admin) ===" -ForegroundColor Cyan
Test-Api "GET /api/tenants"                           "$baseUrl/api/tenants" -ExpectedCodes @(200,403)
Test-Api "GET /api/admin-access/tenants"              "$baseUrl/api/admin-access/tenants" -ExpectedCodes @(200,403)
Test-Api "GET /api/admin-access/impersonation-status" "$baseUrl/api/admin-access/impersonation-status"

# ── SUMMARY ──────────────────────────────────────────────────────────────────
$pct = [Math]::Round(($pass / $total) * 100)
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " RESULTS: $pass PASS  /  $fail FAIL  /  $total TOTAL  ($pct%)" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "================================================" -ForegroundColor Cyan
