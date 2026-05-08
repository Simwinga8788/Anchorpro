$baseUrl = "http://localhost:5165"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1. Login as Admin
$loginUrl = "$baseUrl/Account/Login"
$loginBody = @{
    "Input.Email" = "anchorcorp@anchor.com"
    "Input.Password" = "AnchorPro!123"
}
try {
    Invoke-WebRequest -Uri $loginUrl -Method Post -Body $loginBody -WebSession $session -ErrorAction Stop
} catch {
    Write-Host "Login might have redirected or failed, proceeding."
}

function Invoke-Api {
    param($Uri, $Method, $Body, $ContentType = "application/json")
    try {
        if ($Body) {
            Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType $ContentType -WebSession $session
        } else {
            Invoke-RestMethod -Uri $Uri -Method $Method -WebSession $session
        }
    } catch {
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $body = $reader.ReadToEnd()
            Write-Host "ERROR: $Method $Uri returned $($errorResponse.StatusCode)"
            Write-Host "Response Body: $body"
        } else {
            Write-Host "ERROR: $_"
        }
        return $null
    }
}

# 2. Get Equipment ID
$equipResponse = Invoke-Api -Uri "$baseUrl/api/EquipmentApi" -Method Get
$equipmentId = $equipResponse[0].id
Write-Host "Using Equipment ID: $equipmentId"

# 3. Get Inventory Item ID
$invResponse = Invoke-Api -Uri "$baseUrl/api/inventory" -Method Get
$inventoryItemId = $invResponse[0].id
Write-Host "Using Inventory Item ID: $inventoryItemId"

# 4. Create Job Card
$jobNumber = "T-" + (Get-Date -Format "yyMMddHHmmss") # e.g. T-260507232607 (14 chars)
$jobBody = @{
    jobNumber = $jobNumber
    equipmentId = $equipmentId
    description = "E2E Test with Costs"
    jobTypeId = 1
    priority = 1
    scheduledStartDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$jobResponse = Invoke-Api -Uri "$baseUrl/api/JobCards" -Method Post -Body $jobBody
if (-not $jobResponse) { exit 1 }
$jobId = $jobResponse.id
Write-Host "Created Job Card ID: $jobId"

# 5. Add Part to Job
$partBody = @{
    inventoryItemId = $inventoryItemId
    quantity = 2
} | ConvertTo-Json
Invoke-Api -Uri "$baseUrl/api/JobCards/$jobId/parts" -Method Post -Body $partBody

# 6. Complete Job
$statusBody = "3"
Invoke-Api -Uri "$baseUrl/api/JobCards/$jobId/status" -Method Patch -Body $statusBody

# 6.5 Check Job Costs
$jobCheck = Invoke-Api -Uri "$baseUrl/api/JobCards/$jobId" -Method Get
Write-Host "Job Costs -> Labor: $($jobCheck.laborCost), Parts: $($jobCheck.partsCost), Total: $($jobCheck.totalCost)"

# 7. Generate Invoice
$invoiceResponse = Invoke-Api -Uri "$baseUrl/api/financial/invoices/from-job/$jobId" -Method Post
if ($invoiceResponse) {
    $invoiceId = $invoiceResponse.id
    $totalAmount = $invoiceResponse.total # Fix: property is .total
    Write-Host "Generated Invoice ID: $invoiceId"
    Write-Host "Total Amount: $totalAmount"

    if ($totalAmount -gt 0) {
        Write-Host "TEST SUCCESSFUL: Invoice total is greater than zero."
    } else {
        Write-Host "TEST FAILED: Invoice total is zero."
    }
} else {
    Write-Host "TEST FAILED: Could not generate invoice."
}
