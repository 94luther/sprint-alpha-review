# The amended draft asks for three names but the subject still said two.
# Change both the draft subject and the queue row that points at it, together.

$ErrorActionPreference = 'Stop'
$old = "The delivery app, one page for Michelle, and two names I need"
$new = "The delivery app, one page for Michelle, and three names I need"
$queue = "C:\Users\SALES\.claude\skills\send-window\send-queue.json"

$ol = New-Object -ComObject Outlook.Application
$drafts = $ol.Session.GetDefaultFolder(16).Items
$hit = $null
foreach ($it in $drafts) { if ($it.Subject -eq $old) { $hit = $it; break } }
if (-not $hit) { throw "draft not found: $old" }
$hit.Subject = $new
$hit.Save()
Write-Output ("draft subject now: {0}" -f $hit.Subject)

Copy-Item $queue "$queue.bak-brick9" -Force
$rows = Get-Content $queue -Raw -Encoding UTF8 | ConvertFrom-Json
$changed = 0
foreach ($r in $rows) {
    if ($r.draftSubjectMatch -eq $old) { $r.draftSubjectMatch = $new; $changed++ }
    if ($r.resolvedSubject -eq $old) { $r.resolvedSubject = $new }
}
if ($changed -eq 0) { throw "no queue row matched, queue NOT rewritten" }
$json = $rows | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($queue, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "queue rows updated: $changed"

# Read it back and prove it still lines up with the draft
$check = Get-Content $queue -Raw -Encoding UTF8 | ConvertFrom-Json
$row = $check | Where-Object { $_.draftSubjectMatch -eq $new }
Write-Output ("row state {0}, scheduled {1}, entryId matches draft: {2}" -f $row.state, $row.scheduledFor, ($row.entryId -eq $hit.EntryID))
Write-Output ("total rows in queue: {0}, queued: {1}" -f $check.Count, ($check | Where-Object { $_.state -eq 'QUEUED' }).Count)
