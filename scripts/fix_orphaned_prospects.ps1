# PowerShell script to fix orphaned Company IDs in Prospects.csv
# Generated: 2026-02-08

$orphanedData = @{
    'CID-D&S775' = 'D&S Electric Company'
    'CID-HAM776' = 'Hamilton Supply Company'
    'CID-NAP777' = 'Napa Auto Parts'
    'CID-NIK778' = 'Nikobi Auto Sales'
    'CID-ALL726' = 'All-Star Fabrication'
    'CID-BAN739' = 'Banggood Auto Parts'
    'CID-CAV771' = 'Cavendars'
    'CID-EAS772' = 'East Texas Door Company'
    'CID-HIG773' = 'Highway Towing'
    'CID-REX774' = 'Rexel Electric Supply'
    'CID-QUA767' = 'Quality Air Conditioning'
    'CID-RUB768' = 'Rub a Dub Plumbing'
    'CID-WEI769' = 'WEI Cooling & Heating'
    'CID-NOB770' = 'nobles transmission'
    'CID-TDI666' = 'TDI Air Condition'
    'CID-A&1104' = 'A & J Roofing'
    'CID-A&W105' = 'A&W Hill Roofing'
    'CID-DGI737' = 'DGI Precision Metal'
    'CID-HOL765' = 'Holiday Sheet Metal Company'
    'CID-JAM702' = 'James Awning and Canvas Co.'
    'CID-ROT732' = 'Roto-Rooters'
    'CID-BAR667' = 'Barbin Fence Inc'
    'CID-COD759' = 'Cody Dodd Air Conditioning'
    'CID-EAS760' = 'East Texas Roof Works & Sheet Metal'
    'CID-GLE761' = 'Glenwood Blinds and Awnings'
    'CID-HOL762' = 'Hollywood Doors'
    'CID-MIK763' = 'Mikala Construction'
    'CID-WEL701' = 'Weld Works'
    'CID-CHA111' = 'Champion Fence'
    'CID-AME735' = 'Ameco'
    'CID-RIL756' = 'Riley Powers Inc'
    'CID-TYL757' = 'Tyler Sheet Metal'
    'CID-TYL758' = 'Tyler Tool & Fasteners'
    'CID-RUB769' = 'Rub-A-Dub Plumbing'
    'CID-HOL766' = 'Holliday Sheet Metal'
}

# Get existing Prospects data
$prospectsPath = "d:\K&L Recycling Outreach\csv\Prospects.csv"
$existingContent = Get-Content $prospectsPath -Raw

$newRecords = @()
foreach ($entry in $orphanedData.GetEnumerator()) {
    $companyId = $entry.Key
    $companyName = $entry.Value
    
    # Check if already exists
    if ($existingContent -match [regex]::Escape($companyId)) {
        Write-Host "SKIP: $companyId already exists" -ForegroundColor Yellow
    } else {
        # Create new prospect record with placeholder values
        # Format: Company ID,Address,Zip Code,Company Name,Industry,Last Outcome,Last Outreach Date,Days Since Last Contact,Next Step Due Countdown,Next Steps Due Date,Contact Status,Close Probability,Priority Score,UrgencyBand,Urgency Score,Totals
        $newRecord = "$companyId,,,""$companyName"""",,Follow-Up,""$(Get-Date -Format 'MM/dd/yyyy')"",0,0,,Nurture,0.1,50,Medium,75,90"
        $newRecords += $newRecord
        Write-Host "ADD: $companyId -> $companyName" -ForegroundColor Green
    }
}

# Append new records to Prospects.csv
if ($newRecords.Count -gt 0) {
    $newRecords -join "`n" | Out-File -FilePath $prospectsPath -Append -Encoding UTF8
    Write-Host ""
    Write-Host "Added $($newRecords.Count) new prospect records" -ForegroundColor Cyan
} else {
    Write-Host "No new records to add" -ForegroundColor Gray
}