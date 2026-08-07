$Out = "sangam_dashboard_dump.txt"
"" | Out-File -FilePath $Out -Encoding utf8

function Add-FileDump {
    param([string]$Path)
    Add-Content -Path $Out -Value "===== FILE: $Path ====="
    if (Test-Path $Path) {
        Get-Content -Path $Path -Raw | Add-Content -Path $Out
    } else {
        Add-Content -Path $Out -Value "(not found)"
    }
    Add-Content -Path $Out -Value ""
}

Add-Content -Path $Out -Value "===== DIR LISTING: dashboard/sales ====="
Get-ChildItem -Path "src\app\(dashboard)\dashboard\sales" -Recurse -File -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName | Add-Content -Path $Out
Add-Content -Path $Out -Value ""

Add-Content -Path $Out -Value "===== DIR LISTING: dashboard/service ====="
Get-ChildItem -Path "src\app\(dashboard)\dashboard\service" -Recurse -File -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName | Add-Content -Path $Out
Add-Content -Path $Out -Value ""

Add-FileDump "src\app\(dashboard)\dashboard\sales\page.tsx"
Add-FileDump "src\app\(dashboard)\dashboard\service\page.tsx"

Add-Content -Path $Out -Value "===== GREP: SalesTarget / target / achievement usage ====="
Get-ChildItem -Path "src" -Recurse -Include *.ts, *.tsx -File -ErrorAction SilentlyContinue |
    Select-String -Pattern "SalesTarget|achievement|monthlyTarget" -AllMatches |
    ForEach-Object { Add-Content -Path $Out -Value ("{0}:{1}:{2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()) }

$lineCount = (Get-Content $Out | Measure-Object -Line).Lines
Write-Host "Dump written to $Out ($lineCount lines)"