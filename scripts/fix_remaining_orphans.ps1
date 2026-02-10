# Fix remaining parsing artifacts in Prospects.csv
# Run with: powershell -ExecutionPolicy Bypass -File scripts\fix_remaining_orphans.ps1

$newRecords = @(
    'CID-AW755,,,"AW Trailer Sales & Service",,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-LUM01,,,Lumley Roofing,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-LUM15,,,Lumley Roofing,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-DGI17,,,DGI,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-TYL18,,,Tyler Building Systems,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-LIL19,,,Lilly Machinery,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-AUT20,,,Auto Express,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-AUT21,,,Auto Parts Warehouse,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-DAI22,,,Daiken Comfort,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90',
    'CID-A&1104,,,A & J Roofing,,Follow-Up,"02/08/2026",0,0,,Nurture,0.1,50,Medium,75,90'
)

$prospectsPath = "d:\K&L Recycling Outreach\csv\Prospects.csv"
$existingContent = Get-Content $prospectsPath -Raw

$added = 0
foreach ($record in $newRecords) {
    $companyId = $record.Split(',')[0]
    if ($existingContent -match [regex]::Escape($companyId)) {
        Write-Host "SKIP: $companyId already exists" -ForegroundColor Yellow
    } else {
        $record | Out-File -FilePath $prospectsPath -Append -Encoding UTF8
        Write-Host "ADD: $companyId" -ForegroundColor Green
        $added++
    }
}

Write-Host ""
Write-Host "Added $added new records" -ForegroundColor Cyan