$Out = "sangam_investigation_dump.txt"
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

Add-FileDump "prisma\seed-permissions.ts"

$permFiles = @(
    "src\lib\permissions\can.ts",
    "src\lib\permissions\guard.ts",
    "src\lib\permissions\role-routes.ts",
    "src\lib\permissions\roles.ts"
)
foreach ($f in $permFiles) {
    Add-FileDump $f
}

Add-Content -Path $Out -Value "===== MIGRATIONS mentioning role/permission ====="
if (Test-Path "prisma\migrations") {
    $migMatches = Get-ChildItem -Path "prisma\migrations" -Recurse -File |
        Select-String -Pattern "role|permission" -List |
        Select-Object -ExpandProperty Path -Unique
    foreach ($m in $migMatches) {
        Add-Content -Path $Out -Value "--- migration: $m ---"
        Get-Content -Path $m -Raw | Add-Content -Path $Out
        Add-Content -Path $Out -Value ""
    }
} else {
    Add-Content -Path $Out -Value "(prisma\migrations not found)"
}

Add-Content -Path $Out -Value "===== GREP: team/report/subordinate/manager call sites (with line numbers) ====="
if (Test-Path "src") {
    $hits = Get-ChildItem -Path "src" -Recurse -Include *.ts, *.tsx -File |
        Select-String -Pattern "team|report|subordinate|manager|teamLead" -AllMatches
    foreach ($h in $hits) {
        Add-Content -Path $Out -Value ("{0}:{1}:{2}" -f $h.Path, $h.LineNumber, $h.Line.Trim())
    }
} else {
    Add-Content -Path $Out -Value "(src not found)"
}

$lineCount = (Get-Content $Out | Measure-Object -Line).Lines
Write-Host "Dump written to $Out ($lineCount lines)"