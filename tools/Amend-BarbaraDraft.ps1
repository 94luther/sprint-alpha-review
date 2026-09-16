# Brick 9 needs a named Data Protection Officer, and Barbara names people.
# She already has a queued email asking for two names, so amend that draft rather than
# send her a second one. The queue matches on subject, so the subject must NOT change.

$ErrorActionPreference = 'Stop'
$subject = "The delivery app, one page for Michelle, and two names I need"
$newSubject = "The delivery app, one page for Michelle, and three names I need"
$sig = "`r`nLuther Roberts`r`nNew Business Development`r`nSprint Couriers"

$body = @"
Hi Barbara,

I have put the whole delivery app idea onto two pages so it can go up without anyone having to sit through a presentation. It is attached.

The short version is that we already carry most of the country's courier volume and we run 55 branches, and two small Gaborone apps are quietly becoming the name people think of when something needs to come to the door. Pick n Pay went with Wanzy in April. The app is how we keep that habit with us.

There are a few things I need to start, and none of them is money.

Could you tell me who in IT will own this one, and who in finance can sign off how merchants get paid? Those two names are the only thing standing between a plan and a real date.

There is a third name I need, and this one is a legal requirement rather than a preference. Because the app will carry prescription medicines, it handles health information, and the Data Protection Act says we must appoint a Data Protection Officer. That person is the one the regulator calls, and the one who has 72 hours to report if anything ever leaks. The penalty for getting it wrong reaches 50 million pula or 4 percent of turnover. It should not be someone whose targets depend on collecting more data, and they need real time in their week for it. I have written everything else that officer needs, so the only gap is the name.

Could I also get your real cost lines for one delivery, the rider time, the fuel and the branch handling? Without them the profit per order is a guess, and I would rather not put a guess in front of Michelle.

And when you have read the page, would you take it up for me?

Thank you,
$sig
"@

$ol = New-Object -ComObject Outlook.Application
$drafts = $ol.Session.GetDefaultFolder(16).Items
$hit = $null
foreach ($it in $drafts) { if ($it.Subject -eq $subject) { $hit = $it; break } }
if (-not $hit) { throw "draft not found: $subject" }

$oldId = $hit.EntryID
$hit.Body = $body
$hit.Save()
Write-Output ("amended: {0}" -f $hit.Subject)
Write-Output ("EntryID unchanged: {0}" -f ($hit.EntryID -eq $oldId))
Write-Output ("attachments still on it: {0}" -f $hit.Attachments.Count)
Write-Output ("mentions the officer: {0}" -f ($hit.Body -match 'Data Protection Officer'))

# The queue row matches on subject, so confirm the row still resolves to this draft
$queue = "C:\Users\SALES\.claude\skills\send-window\send-queue.json"
$rows = Get-Content $queue -Raw | ConvertFrom-Json
$row = $rows | Where-Object { $_.draftSubjectMatch -eq $subject -or $_.resolvedSubject -eq $subject }
if ($row) {
    Write-Output ("queue row state: {0}, scheduled {1}, entryId matches draft: {2}" -f $row.state, $row.scheduledFor, ($row.entryId -eq $hit.EntryID))
} else {
    Write-Output "WARNING: no queue row found for that subject"
}
