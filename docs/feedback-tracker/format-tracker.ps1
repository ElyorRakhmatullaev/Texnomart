# Форматирование трекера: перенос текста, закреп шапки, автовысота, подсветка групп колонок
$path = "C:\Users\User\Desktop\Texnomart\Трекер_комментариев_дизайн_фронт_бэк.xlsx"
$excel = $null
$wb = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $wb = $excel.Workbooks.Open($path)

    # ---- Лист «Трекер» ----
    $ws = $wb.Worksheets.Item("Трекер")
    $ws.Activate()
    $used = $ws.UsedRange
    $used.VerticalAlignment = -4160   # xlTop

    foreach ($col in @("B","D","E","F","H","I","K","L","N")) {
        $ws.Columns($col).WrapText = $true
    }

    # Шапка: жирный, перенос, заливка по группам колонок
    $hdr = $ws.Rows(1)
    $hdr.Font.Bold = $true
    $hdr.WrapText = $true
    $hdr.RowHeight = 34
    $ws.Range("A1:E1").Interior.Color = 15921906    # серый — комментарий
    $ws.Range("F1:H1").Interior.Color = 12579839    # жёлтый — дизайн-прототип
    $ws.Range("I1:K1").Interior.Color = 16706267    # голубой — фронтенд
    $ws.Range("L1:N1").Interior.Color = 14480860    # зелёный — бэкенд

    # Автовысота строк под перенос
    $used.Rows.AutoFit() | Out-Null

    # Закрепить шапку
    $excel.ActiveWindow.SplitRow = 1
    $excel.ActiveWindow.SplitColumn = 0
    $excel.ActiveWindow.FreezePanes = $true

    # ---- Лист «Легенда» ----
    $ws2 = $wb.Worksheets.Item("Легенда")
    $ws2.Activate()
    $ws2.UsedRange.VerticalAlignment = -4160
    $ws2.Columns("B").WrapText = $true
    $ws2.Columns("A").Font.Bold = $true
    $ws2.Cells.Item(1,1).Font.Size = 14
    $ws2.UsedRange.Rows.AutoFit() | Out-Null

    $ws.Activate()
    $ws.Cells.Item(2,1).Select() | Out-Null
    $wb.Save()
    Write-Output "OK: formatted and saved"
}
catch {
    Write-Output ("FAIL: " + $_.Exception.Message)
}
finally {
    if ($wb) { $wb.Close($true) }
    if ($excel) { $excel.Quit() }
    foreach ($o in @($wb, $excel)) {
        if ($o) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($o) | Out-Null }
    }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
