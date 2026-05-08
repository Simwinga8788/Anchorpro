$controllers = Get-ChildItem "AnchorPro/Controllers/*.cs"
foreach ($file in $controllers) {
    $name = $file.Name
    $lines = Get-Content $file.FullName
    foreach ($line in $lines) {
        if ($line -match '\[Http(Get|Post|Put|Patch|Delete)') {
            Write-Host "$name -> $($line.Trim())"
        }
    }
}
