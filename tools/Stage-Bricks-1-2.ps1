# Stage the Outlook drafts for bricks 1 and 2 of the delivery app house.
# Brick 1: the frame page goes to Barbara, who carries it to Michelle.
# Brick 2: the BoMRA question on courier carriage of dispensed prescriptions.
# Creates drafts only. Queueing for Monday is a separate step (Add-ToSendQueue.ps1).

$ErrorActionPreference = 'Stop'
$framePdf = "C:\Users\SALES\Desktop\sprint-alpha\docs\FRAME.pdf"

if (-not (Test-Path $framePdf)) { throw "FRAME.pdf is missing at $framePdf" }
$bytes = [System.IO.File]::ReadAllBytes($framePdf)[0..3]
$magic = -join ($bytes | ForEach-Object { [char]$_ })
if ($magic -ne '%PDF') { throw "FRAME.pdf does not start with %PDF, it starts with '$magic'" }
Write-Output "attachment gate passed: $magic, $([math]::Round((Get-Item $framePdf).Length/1kb)) kb"

$sig = "`r`nLuther Roberts`r`nNew Business Development`r`nSprint Couriers"

$barbaraSubject = "The delivery app, one page for Michelle, and two names I need"
$barbaraBody = @"
Hi Barbara,

I have put the whole delivery app idea onto two pages so it can go up without anyone having to sit through a presentation. It is attached.

The short version is that we already carry most of the country's courier volume and we run 55 branches, and two small Gaborone apps are quietly becoming the name people think of when something needs to come to the door. Pick n Pay went with Wanzy in April. The app is how we keep that habit with us.

There are three things I need to start, and none of them is money.

Could you tell me who in IT will own this one, and who in finance can sign off how merchants get paid? Those two names are the only thing standing between a plan and a real date.

Could I also get your real cost lines for one delivery, the rider time, the fuel and the branch handling? Without them the profit per order is a guess, and I would rather not put a guess in front of Michelle.

And when you have read the page, would you take it up for me?

Thank you,
$sig
"@

$bomraSubject = "Question about courier delivery of dispensed prescription medicines"
$bomraBody = @"
Good morning,

I am writing from Sprint Couriers, a licensed courier company operating nationally in Botswana.

We are looking at carrying dispensed medicines from licensed pharmacies to patients, and we would like to be sure we do it the way the Authority expects before we build anything.

Could you help us with three questions?

First, may a licensed courier carry a sealed, pharmacist dispensed prescription from a BoMRA licensed pharmacy to the patient it was dispensed for, and if so, what conditions apply to the courier?

Second, is there anything the Authority requires of the company carrying it, such as a permit, a record of custody, or a check of the patient's identity at handover?

Third, does the Authority set temperature or cold chain requirements for medicines in transit, including how the temperature should be recorded?

We would rather ask first and build it correctly than start and find we have it wrong. If it would be easier to speak to someone, I am happy to come in.

Thank you for your time,
$sig
"@

$ol = New-Object -ComObject Outlook.Application
$made = @()

function New-Draft {
    param($To, $Subject, $Body, $Attach)
    $m = $ol.CreateItem(0)
    $m.To = $To
    $m.Subject = $Subject
    $m.Body = $Body
    if ($Attach) { [void]$m.Attachments.Add($Attach) }
    $m.Save()
    return $m
}

$m1 = New-Draft -To "office@example.com" -Subject $barbaraSubject -Body $barbaraBody -Attach $framePdf
$made += [pscustomobject]@{ Brick = 1; To = $m1.To; Subject = $m1.Subject; Attachments = $m1.Attachments.Count }

$m2 = New-Draft -To "info@bomra.co.bw" -Subject $bomraSubject -Body $bomraBody -Attach $null
$made += [pscustomobject]@{ Brick = 2; To = $m2.To; Subject = $m2.Subject; Attachments = $m2.Attachments.Count }

# Verify they are actually sitting in Drafts, not just in memory
$drafts = $ol.Session.GetDefaultFolder(16).Items
$found = 0
foreach ($s in @($barbaraSubject, $bomraSubject)) {
    $hit = $null
    foreach ($it in $drafts) { if ($it.Subject -eq $s) { $hit = $it; break } }
    if ($hit) { $found++; Write-Output ("IN DRAFTS: {0} | to {1} | {2} attachment(s)" -f $hit.Subject, $hit.To, $hit.Attachments.Count) }
    else { Write-Output "NOT FOUND IN DRAFTS: $s" }
}
Write-Output "drafts verified in Drafts folder: $found of 2"
$made | Format-Table -AutoSize | Out-String -Width 200 | Write-Output
