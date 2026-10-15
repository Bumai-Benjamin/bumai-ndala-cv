"""Render the CV site from content.json (single source of truth)."""
import hashlib, json, math, random
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
C = json.loads((ROOT / 'content.json').read_text())
env = Environment(loader=FileSystemLoader(ROOT / 'templates'), autoescape=select_autoescape(['html', 'j2']), trim_blocks=True, lstrip_blocks=True)

def vhash(rel):
    return hashlib.sha1((SITE / rel).read_bytes()).hexdigest()[:10]

v = {'css': vhash('assets/css/site.css'), 'js': vhash('assets/js/site.js'), 'init': vhash('assets/js/theme-init.js')}

# five-notch dial segments (viewBox 96, centre 48, radius 39)
def arc(cx, cy, r, a0, a1):
    p = lambda a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    return f"M{x0:.2f} {y0:.2f} A{r} {r} 0 0 1 {x1:.2f} {y1:.2f}"
ring_segments = [arc(48, 48, 39, -90 + i * 72 + 11, -90 + i * 72 + 61) for i in range(5)]

# decorative barcode
random.seed('Bumai Ndala · CallAFix')
x, bars = 0, []
while x < 156:
    w = random.choice([1, 1, 1.5, 2, 2, 3])
    bars.append((round(x, 1), w))
    x += w + random.choice([1, 1.5, 2, 2.5])

journey = dict(C['journey'])
journey_json = json.dumps({'nodes': journey['nodes'], 'edges': journey['edges'], 'experience': C['experience']}, ensure_ascii=False).replace('</', '<\\/')

p = C['person']
jsonld = json.dumps({
    '@context': 'https://schema.org', '@type': 'Person',
    'name': p['name_full'], 'givenName': 'Bumai', 'familyName': p['last'],
    'jobTitle': p['role'],
    'worksFor': {'@type': 'Organization', 'name': p['employer']},
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Windhoek', 'addressCountry': 'NA'},
    'email': 'mailto:' + p['email'], 'url': C['site']['url'],
    'sameAs': [p['linkedin']],
    'knowsLanguage': [l['name'] for l in C['languages']],
}, ensure_ascii=False).replace('</', '<\\/')

ctx = dict(C, v=v, ring_segments=ring_segments, barcode=bars, journey_json=journey_json, jsonld=jsonld)

def render(tpl, out, **extra):
    html = env.get_template(tpl).render(**ctx, **extra)
    (out).write_text(html)
    return out

render('index.html.j2', SITE / 'index.html')
render('simple.html.j2', SITE / 'thank-you.html', page_title='Message sent', tab='Contact', heading='Message sent',
       copy="Thanks for reaching out. I'll reply to the email address you gave.")
render('simple.html.j2', SITE / '404.html', page_title='Page not found', tab='404', heading='Nothing here',
       copy="This page doesn't exist. The CV is one click away.")
# helper pages for image rendering (removed after rendering)
render('og.html.j2', SITE / '_og.html')
render('icon.html.j2', SITE / '_icon.html')

url = C['site']['url']
(SITE / 'robots.txt').write_text(f"User-agent: *\nAllow: /\n\nSitemap: {url}sitemap.xml\n")
(SITE / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url><loc>{url}</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n')
(SITE / '_headers').write_text("""/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.pdf
  Cache-Control: public, max-age=3600
""")
print('built', v)
