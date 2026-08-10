$Out = "sangam_employee_dump.txt"
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

Add-FileDump "src\app\(dashboard)\dashboard\admin\employees\employee-form.tsx"
Add-FileDump "src\app\(dashboard)\dashboard\admin\employees\new\page.tsx"
Add-FileDump "src\app\(dashboard)\dashboard\admin\employees\[id]\edit\page.tsx"
Add-FileDump "src\app\(dashboard)\dashboard\admin\employees\page.tsx"

Add-Content -Path $Out -Value "===== FIND: employee actions files ====="
Get-ChildItem -Path "src" -Recurse -Filter "employee*.actions.ts" -File |
    Select-Object -ExpandProperty FullName | Add-Content -Path $Out

Add-Content -Path $Out -Value "===== FIND: employee validation schemas ====="
Get-ChildItem -Path "src\lib\validations" -Filter "*employee*" -File -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName | Add-Content -Path $Out

$lineCount = (Get-Content $Out | Measure-Object -Line).Lines
Write-Host "Dump written to $Out ($lineCount lines)"