# Brick 10: mobile money merchant terms in writing (blocker C1).
# Three drafts, one per rail. None of the three publishes merchant rates, so they must be asked.
# Mascom's own published merchant terms leave the collection fee blank at clause 5.1.3, and
# describe no automatic settlement to a bank account, so that email cites the document.

$ErrorActionPreference = 'Stop'
$sig = "`r`nLuther Roberts`r`nNew Business Development`r`nSprint Couriers"

$emails = @(
  @{
    To = "b2bcustomer.support@orange.com"
    Subject = "Orange Money merchant rates for a delivery app, three questions"
    Body = @"
Good morning,

I am writing from Sprint Couriers. We are a licensed courier company operating nationally in Botswana, and we are building a delivery app where customers pay for groceries, medicines and parcels at checkout.

We would like Orange Money to be one of the ways they pay, and before we build anything we need to understand what it costs us and how the money reaches us.

Could you help with three questions?

First, what does a merchant pay Orange Money per payment, either as a percentage or a flat amount?

Second, how does the money reach our bank account, and how long does that take from the moment the customer pays?

Third, is there a minimum monthly volume, a monthly charge, or a joining fee?

We also saw that Orange Money Web Payment exists for merchants. Could you tell us whether there is an interface our developers can connect to directly, and who we would speak to about that?

Happy to come in and sign up in person if that is the quickest route. Please let me know what you need from us.

Thank you,
$sig
"@
    When = "2026-09-14 08:35"
  },
  @{
    To = "customerservice@mascom.bw"
    Subject = "MyZakaPay merchant enquiry for a national courier, the rate at clause 5.1.3"
    Body = @"
Good morning,

I am writing from Sprint Couriers. We are a licensed courier company operating nationally in Botswana, and we are building a delivery app where customers pay for groceries, medicines and parcels at checkout. We would like MyZaka to be one of the ways they pay. Could this please reach whoever looks after MyZakaPay merchants.

I have read the MyZakaPay merchant terms published on your website, so my questions are quite specific.

Clause 5.1.3 leaves the collection fee per payment blank. What rate would apply to us, and does it move with volume?

The terms describe the merchant liquidating the wallet, either by cashing out at an agent or by issuing a bank transfer instruction. Is there any arrangement where takings settle automatically into our bank account each day, or is liquidation always something we initiate?

Clause 3.3.4 says we may not deduct charges from the customer, so the collection fee comes out of our side. That is understood, and it is why the rate matters to us.

Is there an interface our developers can connect to so payments are confirmed inside our app rather than by SMS?

We would be glad to meet if that is easier. Please let me know what you need from us to open a merchant account.

Thank you,
$sig
"@
    When = "2026-09-14 09:05"
  },
  @{
    To = "121@btc.bw"
    Subject = "Smega merchant onboarding and the Smega API, enquiry from a national courier"
    Body = @"
Good morning,

I am writing from Sprint Couriers. We are a licensed courier company operating nationally in Botswana, and we are building a delivery app where customers pay for groceries, medicines and parcels at checkout. We would like Smega to be one of the ways they pay. Could this please reach whoever handles merchant onboarding.

I have seen the merchant onboarding page on your website and we can supply the company registration, the tax number and a bank confirmation letter.

Before we start, could you help with three questions?

First, what does a merchant pay per payment, either as a percentage or a flat amount?

Second, how and how quickly do takings reach our bank account?

Third, is there a minimum monthly volume, a monthly charge, or a joining fee?

We also found the Smega developer site at smegaapi.btc.bw. The documentation page would not open for us, it returns a certificate error. Could you point us to the current documentation and tell us how a company applies for access?

Thank you for your time,
$sig
"@
    When = "2026-09-14 09:35"
  }
)

$ol = New-Object -ComObject Outlook.Application
foreach ($e in $emails) {
    if ($e.To -match 'michelle@') { throw "BLOCKED: never mail the MD directly ($($e.To))" }
    $m = $ol.CreateItem(0)
    $m.To = $e.To; $m.Subject = $e.Subject; $m.Body = $e.Body
    $m.Save()
}

# Verify each one is really sitting in Drafts
$drafts = $ol.Session.GetDefaultFolder(16).Items
$found = 0
foreach ($e in $emails) {
    $hit = $null
    foreach ($it in $drafts) { if ($it.Subject -eq $e.Subject) { $hit = $it; break } }
    if ($hit) { $found++; Write-Output ("IN DRAFTS: {0} -> {1}" -f $hit.To, $hit.Subject) }
    else { Write-Output "NOT FOUND: $($e.Subject)" }
}
Write-Output "drafts verified: $found of $($emails.Count)"

# Queue them, gate-checked, inside Monday's send window
$q = "C:\Users\SALES\.claude\skills\send-window\Add-ToSendQueue.ps1"
foreach ($e in $emails) {
    & $q -Subject $e.Subject -ScheduledFor ([datetime]$e.When) -ApprovedBy "Luther, 12 September, keep going with the next brick"
}
