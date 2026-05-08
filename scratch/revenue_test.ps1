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

# 1. Get Initial Snapshot
$initialSnapshot = Invoke-Api -Uri "$baseUrl/api/financial/snapshot" -Method Get
Write-Host "Initial Snapshot -> MTD Revenue: $($initialSnapshot.totalRevenueMTD), Collected: $($initialSnapshot.totalCollectedMTD)"

# 2. Record Payment for Invoice 14
$paymentAmount = 1000.00
$paymentBody = @{
    invoiceId = 14
    amount = $paymentAmount
    method = 0 # BankTransfer
    referenceNumber = "REF-REVENUE-TEST"
    notes = "Testing revenue collection logic"
} | ConvertTo-Json

Write-Host "Recording payment of $paymentAmount against Invoice #14..."
Invoke-Api -Uri "$baseUrl/api/financial/payments" -Method Post -Body $paymentBody

# 3. Get Updated Snapshot
$updatedSnapshot = Invoke-Api -Uri "$baseUrl/api/financial/snapshot" -Method Get
Write-Host "Updated Snapshot -> MTD Revenue: $($updatedSnapshot.totalRevenueMTD), Collected: $($updatedSnapshot.totalCollectedMTD)"

# 4. Verification
$collectedDiff = $updatedSnapshot.totalCollectedMTD - $initialSnapshot.totalCollectedMTD
if ($collectedDiff -eq $paymentAmount) {
    Write-Host "TEST SUCCESSFUL: Collected amount increased by $paymentAmount."
} else {
    Write-Host "TEST FAILED: Collection mismatch. Expected increase of $paymentAmount, but got $collectedDiff."
}
