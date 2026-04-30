$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$path = "c:\Users\Danilo\Desktop\cnc-cut-commander-main\Planilha Controle de Corte v0.2.xlsm"

try {
    Write-Host "Tentando abrir a planilha..."
    $workbook = $excel.Workbooks.Open($path)
    Write-Host "Planilha aberta. Varrendo módulos VBA...`n"

    foreach ($module in $workbook.VBProject.VBComponents) {
        Write-Host "========================================"
        Write-Host "MODULO: $($module.Name)"
        Write-Host "========================================"
        
        try {
            $lineCount = $module.CodeModule.CountOfLines
            if ($lineCount -gt 0) {
                $code = $module.CodeModule.Lines(1, $lineCount)
                Write-Host $code
            } else {
                Write-Host "[Módulo sem linhas de código]"
            }
        } catch {
            Write-Host "[ERRO DE ACESSO: O Excel bloqueou o acesso ao código VBA.]"
            Write-Host "Para liberar: Arquivo > Opções > Central de Confiabilidade > Configurações da Central... > Configurações de Macro > Marcar 'Confiar no acesso ao modelo de objeto do projeto VBA'"
        }
        Write-Host "`n"
    }

    $workbook.Close($false)
} catch {
    Write-Host "ERRO AO PROCESSAR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
