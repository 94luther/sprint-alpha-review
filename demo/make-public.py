"""Turn the working phone demo into a copy that is safe to put on a public page.

Every change here is a REMOVAL of something real, never an invention. What comes out:
  1. The parcel price read off the signed SLA. A negotiated tariff does not belong on the open web.
  2. The office count, which Luther has not confirmed yet (53 / 55 / 57 is still open).
  3. A colleague's name sitting inside an engine message.
  4. A shop's real phone number.
  5. The till contact number, replaced with an obviously fake example.
What goes in: a banner and a footer saying plainly that this is example data and that naming a shop
is not a claim that Sprint has an agreement with it.
"""
import io, sys, re

src, dst, bundle = sys.argv[1], sys.argv[2], sys.argv[3]
s = io.open(src, encoding='utf-8').read()
before = len(s)
log = []


def cut(old, new, why):
    global s
    if old not in s:
        log.append('NOT FOUND (check this): ' + why)
        return
    n = s.count(old)
    s = s.replace(old, new)
    log.append('%s  (%d place%s)' % (why, n, '' if n == 1 else 's'))


# 1. the signed rate card price
cut('<div class="price"><cite title="0.5 kg, zone 1, all inclusive. UPDATED SLA_2026.pdf page 10, read by word position">P87.00</cite>\n          <span>half a kilo</span></div>',
    '<div class="price" style="font-size:15px">Pricing on request<span>half a kilo and up</span></div>',
    'parcel price from the signed rate card removed')

# 2. the office count Luther has not confirmed
cut("'<cite title=\"Counted from SC Profile 2026_.pdf pages 24 to 26\">57 across Botswana.</cite> Addresses from the company profile.'",
    "'Offices and service points across Botswana. Addresses from the company profile.'",
    'unconfirmed office count removed')

# 3. the shop phone number, never rendered but no reason to ship it
cut("phone:'+267 391 6667', person:'Lesego', till:'72 887 004',",
    "person:'Lesego', till:'71 000 000',",
    'shop phone dropped and till number replaced with an example')
cut('72 887 004', '71 000 000', 'any remaining till number replaced')

# 4. banner at the top of every screen, and the claim disclaimer at the foot
banner = ('<div style="max-width:392px;margin:0 auto 14px;font:600 11.5px Inter,sans-serif;'
          'color:#7a4a08;background:#fef0dc;border-radius:14px;padding:10px 14px;line-height:1.5;'
          'text-align:center">Example data. This is a working prototype, not the live Sprint system.'
          '</div>\n<div class="device">')
cut('<div class="device">', banner, 'example data banner added')

foot = ('</div>\n</div>\n<p style="max-width:392px;margin:16px auto 0;font:11.5px/1.6 Inter,sans-serif;'
        'color:#7a7a7a;text-align:center">Shop names and products appear here to show how the app '
        'works. They are not a claim that Sprint Couriers has an agreement with any of them. '
        'Prices shown against a shop are that shop\'s own shelf prices. No real customer, rider or '
        'order is on this page.</p>')
# the last two closing divs of the device block, just before the engine script tag
cut('</div>\n</div>\n\n<script src="engine.bundle.js"></script>', foot + '\n\n<script src="engine.bundle.js"></script>',
    'claim disclaimer added under the phone')

io.open(dst, 'w', encoding='utf-8', newline='\n').write(s)

# 5. the colleague's name inside the engine bundle
b = io.open(bundle, encoding='utf-8').read()
b2 = b.replace(' Barbara has it.', '')
io.open(bundle, 'w', encoding='utf-8', newline='\n').write(b2)
log.append("colleague's name removed from the engine bundle (%d place)" % (1 if b != b2 else 0))

rep = io.open(dst + '.log.txt', 'w', encoding='ascii')
rep.write('public copy built from %s\n%d bytes in, %d bytes out\n\n' % (src, before, len(s)))
for l in log:
    rep.write('  ' + l + '\n')
rep.close()
