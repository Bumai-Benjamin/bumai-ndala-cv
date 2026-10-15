"""Render the PDF CV (print stylesheet), the Open Graph image and favicons."""
import asyncio, threading, functools, http.server, socketserver, io
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
PORT = 8767
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve():
    h = functools.partial(Quiet, directory=str(SITE))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), h) as s: s.serve_forever()
threading.Thread(target=serve, daemon=True).start()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # PDF
        pg = await b.new_page()
        await pg.goto(f'http://127.0.0.1:{PORT}/'); await pg.emulate_media(media='print')
        await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(400)
        await pg.pdf(path=str(SITE / 'bumai-ndala-cv.pdf'), format='A4', print_background=True, prefer_css_page_size=True)
        await pg.close()
        # OG image
        pg = await b.new_page(viewport={'width': 1200, 'height': 630})
        await pg.goto(f'http://127.0.0.1:{PORT}/_og.html'); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(400)
        (SITE / 'assets/img').mkdir(parents=True, exist_ok=True)
        og = await pg.screenshot(type='jpeg', quality=88)
        (SITE / 'assets/img/og.jpg').write_bytes(og)
        await pg.close()
        # favicons
        pg = await b.new_page(viewport={'width': 512, 'height': 512})
        await pg.goto(f'http://127.0.0.1:{PORT}/_icon.html'); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(300)
        png = await pg.screenshot(omit_background=True)
        await b.close()
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    im.resize((180, 180), Image.LANCZOS).save(SITE / 'apple-touch-icon.png')
    im.resize((32, 32), Image.LANCZOS).save(SITE / 'favicon-32.png')
    im.resize((192, 192), Image.LANCZOS).save(SITE / 'icon-192.png')
    im.save(SITE / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    for f in ('_og.html', '_icon.html'):
        (SITE / f).unlink(missing_ok=True)
    print('rendered')
asyncio.run(main())
