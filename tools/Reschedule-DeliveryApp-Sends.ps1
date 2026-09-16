# The LAB 0341 tender (closes Fri 18 Sep) already owned Monday morning: five rows, two of them
# landing on the exact minutes I had taken, and Barbara receiving four touches before 08:40.
# The tender outranks a November pilot. Move the delivery app rows out of its way.
#   - Barbara's frame page: off Monday entirely, to Thursday 17 Sep 15:00, after the tender is
#     delivered at 13:00 that day, so she reads it when she can actually act on it.
#   - The three external payment rails and the medicines regulator: still Monday, but late
#     morning, clear of every tender row, because their reply clocks are the slow ones.

$ErrorActionPreference = 'Stop'
$queue = "C:\Users\SALES\.claude\skills\send-window\send-queue.json"

$moves = @{
  "The delivery app, one page for Michelle, and three names I need"      = "2026-09-17 15:00"
  "Question about courier delivery of dispensed prescription medicines"  = "2026-09-14 09:35"
  "Orange Money merchant rates for a delivery app, three questions"      = "2026-09-14 10:05"
  "MyZakaPay merchant enquiry for a national courier, the rate at clause 5.1.3" = "2026-09-14 10:35"
  "Smega merchant onboarding and the Smega API, enquiry from a national courier" = "2026-09-14 11:05"
}

Copy-Item $queue "$queue.bak-reschedule" -Force
$rows = Get-Content $queue -Raw -Encoding UTF8 | ConvertFrom-Json

$changed = 0
foreach ($r in $rows) {
    $s = if ($r.resolvedSubject) { $r.resolvedSubject } else { $r.draftSubjectMatch }
    if ($moves.ContainsKey($s)) {
        if ($r.state -ne 'QUEUED') { throw "row '$s' is $($r.state), refusing to reschedule a row that is not QUEUED" }
        $was = $r.scheduledFor
        $r.scheduledFor = ([datetime]$moves[$s]).ToString("yyyy-MM-ddTHH:mm:ss")
        Write-Output ("moved: {0}`n        {1}  ->  {2}" -f $s, $was, $r.scheduledFor)
        $changed++
    }
}
if ($changed -ne $moves.Count) { throw "expected $($moves.Count) rows to move, moved $changed. Queue NOT rewritten." }

$json = $rows | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($queue, $json, (New-Object System.Text.UTF8Encoding($false)))

# Read back and show the whole Monday to Thursday picture, and any remaining minute collisions
$check = Get-Content $queue -Raw -Encoding UTF8 | ConvertFrom-Json
$q = $check | Where-Object { $_.state -eq 'QUEUED' } | Sort-Object scheduledFor
Write-Output "`n--- the send queue after the move ---"
$q | Select-Object `
      @{n='when';e={([datetime]$_.scheduledFor).ToString('ddd dd MMM HH:mm')}}, `
      @{n='to';e={$_.recipient}}, `
      @{n='subject';e={$_.resolvedSubject.Substring(0,[Math]::Min(52,$_.resolvedSubject.Length))}} |
  Format-Table -AutoSize | Out-String -Width 200 | Write-Output

$clash = $q | Group-Object scheduledFor | Where-Object { $_.Count -gt 1 }
if ($clash) { $clash | ForEach-Object { Write-Output ("STILL COLLIDING at {0}: {1} rows" -f $_.Name, $_.Count) } }
else { Write-Output "no two sends share a minute" }

Write-Output "`n--- how many times each person is written to on Monday 14 Sep ---"
$q | Where-Object { ([datetime]$_.scheduledFor).Date -eq ([datetime]"2026-09-14").Date } |
  ForEach-Object { $_.recipients } | Group-Object | Sort-Object Count -Descending |
  Select-Object Count, Name | Format-Table -AutoSize | Out-String -Width 120 | Write-Output
