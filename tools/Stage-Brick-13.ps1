# Brick 13 cannot be laid: four licences check out, but there is NO insurance policy,
# no vehicle list and no driver records anywhere on this machine. Snowy owns certificates.
# Scheduled Thursday afternoon, after the Legal Aid tender is delivered, so it does not
# add to Monday's load. Snowy is already on a tender email on Monday morning.

$ErrorActionPreference = 'Stop'
$sig = "`r`nLuther Roberts`r`nNew Business Development`r`nSprint Couriers"

$subject = "The insurance schedule and the fleet papers, for the delivery project"
$body = @"
Hi Snowy,

I am putting together the compliance side of the delivery project and I have hit a wall that only you can get me past.

I went through every document on my machine and I can account for the licences. The BOCRA licence runs to August 2028, the tax clearance runs to March 2027, and the PPRA codes run to January 2027. All three are confirmed from the originals.

What I cannot find anywhere is insurance. Not the goods in transit policy, not the motor cover, nothing. It may well be that everything is in order and simply lives with you or the broker rather than on my side, which is why I am asking rather than assuming.

Could you send me these when you have a moment?

The goods in transit policy schedule, and in particular the page that lists the exclusions. I need to know whether medicines and liquor are covered, because the app is planning to carry both, and a lot of policies quietly exclude them.

The motor or fleet insurance schedule.

The vehicle list with registration numbers and when each licence disc runs out.

The driver licences and professional driving permits with their expiry dates.

The public liability cover, if we carry any.

There is one more thing, and it is a small one. Our BOCRA licence notice refers to the terms and conditions in an Annexure 1, and that annexure is not in anything I have. If you have the full licence pack, could you include it? I would rather read the conditions we operate under than guess at them.

None of this is urgent this week. The Legal Aid tender comes first and I know you are on that. Any time next week is fine.

Thank you,
$sig
"@

$ol = New-Object -ComObject Outlook.Application
if ("office@example.com" -match 'michelle@') { throw "BLOCKED: never mail the MD directly" }
$m = $ol.CreateItem(0)
$m.To = "office@example.com"
$m.Subject = $subject
$m.Body = $body
$m.Save()

$drafts = $ol.Session.GetDefaultFolder(16).Items
$hit = $null
foreach ($it in $drafts) { if ($it.Subject -eq $subject) { $hit = $it; break } }
if (-not $hit) { throw "draft did not save" }
Write-Output ("IN DRAFTS: {0} -> {1}" -f $hit.To, $hit.Subject)

& "C:\Users\SALES\.claude\skills\send-window\Add-ToSendQueue.ps1" -Subject $subject -ScheduledFor ([datetime]"2026-09-17 15:30") -ApprovedBy "Luther, 12 September, keep going with the next brick"

# Re-check the whole queue for minute collisions after adding
$rows = Get-Content "C:\Users\SALES\.claude\skills\send-window\send-queue.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$q = $rows | Where-Object { $_.state -eq 'QUEUED' }
$clash = $q | Group-Object scheduledFor | Where-Object { $_.Count -gt 1 }
if ($clash) { $clash | ForEach-Object { Write-Output ("COLLISION at {0}: {1} rows" -f $_.Name, $_.Count) } }
else { Write-Output "queue check: no two sends share a minute ($($q.Count) queued)" }
