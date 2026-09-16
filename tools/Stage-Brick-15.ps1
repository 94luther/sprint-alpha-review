# Brick 15: the fault model needs Barbara's agreement, not just her inbox.
# Monday 21 September, after the Legal Aid tender is closed and out of the way.
# She already has the frame page landing Thursday 17th, so this is four days later.

$ErrorActionPreference = 'Stop'
$pdf = "C:\Users\SALES\Desktop\sprint-alpha\docs\FAULT_MODEL.pdf"
if (-not (Test-Path $pdf)) { throw "FAULT_MODEL.pdf missing" }
$magic = -join ([System.IO.File]::ReadAllBytes($pdf)[0..3] | ForEach-Object { [char]$_ })
if ($magic -ne '%PDF') { throw "attachment is not a PDF, starts with '$magic'" }
Write-Output "attachment gate passed: $magic, $([math]::Round((Get-Item $pdf).Length/1kb)) kb"

$sig = "`r`nLuther Roberts`r`nNew Business Development`r`nSprint Couriers"
$subject = "Fifteen minutes on who pays when a delivery goes wrong"
$body = @"
Hi Barbara,

There is one decision that has to be made before the delivery app can pay merchants on the same day, and it is yours rather than mine.

When a delivery fails, somebody carries the cost. The shop was out of stock, or the customer was not home, or the rider broke down. At the moment every one of those gets argued about afterwards, one order at a time, by whoever happens to pick up the phone. That works while there are five deliveries a day. It does not work at three hundred, and no merchant will trust a same day payment that might quietly be short.

I have written up what I think the rules should be. It is attached, three pages, and most of it is a single table you can read in two minutes. Nothing in it is decided until you say so.

The one line I feel strongly about is that the rider gets paid unless the rider caused the problem. If a rider loses a morning because a shop had no stock, they will start refusing the hard jobs and hiding the failures, and then we lose the information as well as the goodwill.

There are three numbers I cannot set on my own.

How small a loss should simply be written off rather than chased. Arguing over forty pula costs more than forty pula.

How long a rider waits at a door before the customer counts as not being there. One number, the same for everybody.

And whether a rider who is not paid for a job they abandoned still keeps the rest of that day's earnings. That one is an employment question rather than a delivery question.

There is also one name to fill in. If a rider or a shop thinks we blamed them wrongly, they should be able to appeal once, to one person, inside seven days. Not a form and not a committee. Who should that be?

Could we find fifteen minutes next week? If it is easier, mark up the attachment and send it back and I will take that as the answer.

Thank you,
$sig
"@

$ol = New-Object -ComObject Outlook.Application
$m = $ol.CreateItem(0)
$m.To = "office@example.com"
$m.Subject = $subject
$m.Body = $body
[void]$m.Attachments.Add($pdf)
$m.Save()

$drafts = $ol.Session.GetDefaultFolder(16).Items
$hit = $null
foreach ($it in $drafts) { if ($it.Subject -eq $subject) { $hit = $it; break } }
if (-not $hit) { throw "draft did not save" }
Write-Output ("IN DRAFTS: {0} -> {1} ({2} attachment)" -f $hit.To, $hit.Subject, $hit.Attachments.Count)

& "C:\Users\SALES\.claude\skills\send-window\Add-ToSendQueue.ps1" -Subject $subject -ScheduledFor ([datetime]"2026-09-21 08:45") -ApprovedBy "Luther, 12 September, keep going with the next brick"

# whole queue check: collisions, and how often each person is written to on any one day
$rows = Get-Content "C:\Users\SALES\.claude\skills\send-window\send-queue.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$q = $rows | Where-Object { $_.state -eq 'QUEUED' }
$clash = $q | Group-Object scheduledFor | Where-Object { $_.Count -gt 1 }
if ($clash) { $clash | ForEach-Object { Write-Output ("COLLISION at {0}" -f $_.Name) } } else { Write-Output "no minute collisions ($($q.Count) queued)" }
Write-Output "`nper person, per day:"
$q | ForEach-Object { $d = ([datetime]$_.scheduledFor).ToString('ddd dd MMM'); foreach ($r in $_.recipients) { "$d | $r" } } |
  Group-Object | Where-Object { $_.Count -gt 1 } | Select-Object Count, Name |
  Format-Table -AutoSize | Out-String -Width 120 | Write-Output
