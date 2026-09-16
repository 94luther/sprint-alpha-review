# Tariff check: the live quote engine against the original signed contract
Run 13 September 2026 from `Desktop\sprint-alpha\tools\compare-tariff.py`.
**Original read:** `UPDATED SLA_2026.pdf`, page 10, by word position. Never a layout dump, because that shifts rows on this document and produces wrong prices.
**Compared against:** `C:\Users\SALES\Desktop\Sprint-Quote-Engine\library\tariffs-domestic.json`, whose own provenance says its source is the SLA **via sprint-leads\RATES.md**, which is a derived file.
Weight steps found in the original: **40**. Per kilo after 20kg: **[9.0, 11.0, 13.0, 16.0]**.
> All above prices include VAT at 14% and Fuel surcharge at 42%

## Verdict
**CLEAN. All 160 prices checked match the original contract exactly.**

The engine was built from a derived file, which breaks the standing rule, but the numbers in it are right. The provenance line should be corrected to say the original was verified on this date, so nobody has to check it again.

## What was read out of the original, in full

| KGs | Zone 1 | Zone 2 | Zone 3 | Zone 4 |
|---|---|---|---|---|
| 0.5 | P87.00 | P98.00 | P114.00 | P152.00 |
| 1.0 | P93.00 | P106.00 | P123.00 | P163.00 |
| 1.5 | P98.00 | P113.00 | P132.00 | P174.00 |
| 2.0 | P103.00 | P121.00 | P140.00 | P185.00 |
| 2.5 | P109.00 | P128.00 | P149.00 | P195.00 |
| 3.0 | P114.00 | P136.00 | P158.00 | P206.00 |
| 3.5 | P120.00 | P144.00 | P166.00 | P217.00 |
| 4.0 | P125.00 | P151.00 | P175.00 | P228.00 |
| 4.5 | P130.00 | P159.00 | P184.00 | P239.00 |
| 5.0 | P136.00 | P166.00 | P192.00 | P250.00 |
| 5.5 | P141.00 | P174.00 | P201.00 | P260.00 |
| 6.0 | P147.00 | P181.00 | P210.00 | P271.00 |
| 6.5 | P152.00 | P189.00 | P218.00 | P282.00 |
| 7.0 | P158.00 | P197.00 | P227.00 | P293.00 |
| 7.5 | P163.00 | P204.00 | P236.00 | P304.00 |
| 8.0 | P168.00 | P212.00 | P244.00 | P315.00 |
| 8.5 | P174.00 | P219.00 | P253.00 | P325.00 |
| 9.0 | P179.00 | P227.00 | P262.00 | P336.00 |
| 9.5 | P185.00 | P235.00 | P270.00 | P347.00 |
| 10.0 | P190.00 | P242.00 | P279.00 | P358.00 |
| 10.5 | P195.00 | P250.00 | P288.00 | P369.00 |
| 11.0 | P201.00 | P257.00 | P296.00 | P380.00 |
| 11.5 | P206.00 | P265.00 | P305.00 | P390.00 |
| 12.0 | P212.00 | P272.00 | P314.00 | P401.00 |
| 12.5 | P217.00 | P280.00 | P322.00 | P412.00 |
| 13.0 | P223.00 | P288.00 | P331.00 | P423.00 |
| 13.5 | P228.00 | P295.00 | P340.00 | P434.00 |
| 14.0 | P233.00 | P303.00 | P348.00 | P445.00 |
| 14.5 | P239.00 | P310.00 | P357.00 | P455.00 |
| 15.0 | P244.00 | P318.00 | P366.00 | P466.00 |
| 15.5 | P250.00 | P325.00 | P374.00 | P477.00 |
| 16.0 | P255.00 | P333.00 | P383.00 | P488.00 |
| 16.5 | P260.00 | P341.00 | P392.00 | P499.00 |
| 17.0 | P266.00 | P348.00 | P400.00 | P510.00 |
| 17.5 | P271.00 | P356.00 | P409.00 | P520.00 |
| 18.0 | P277.00 | P363.00 | P418.00 | P531.00 |
| 18.5 | P282.00 | P371.00 | P426.00 | P542.00 |
| 19.0 | P288.00 | P379.00 | P435.00 | P553.00 |
| 19.5 | P293.00 | P386.00 | P444.00 | P564.00 |
| 20.0 | P298.00 | P394.00 | P452.00 | P575.00 |

Per kilo after 20kg: zone 1 P9.00, zone 2 P11.00, zone 3 P13.00, zone 4 P16.00.
