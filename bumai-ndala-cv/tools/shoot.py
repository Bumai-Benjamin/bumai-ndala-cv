import asyncio, sys, threading, functools, http.server, socketserver
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
PORT = 8765
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve():
    h = functools.partial(Quiet, directory=str(ROOT / 'site'))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), h) as s: s.serve_forever()
threading.Thread(target=serve, daemon=True).start()

async def shot(b, w, h, theme, name, full=True, motion='no-preference'):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, color_scheme=theme, reduced_motion=motion)
    pg = await ctx.new_page()
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    await pg.goto(f'http://127.0.0.1:{PORT}/')
    await pg.wait_for_timeout(1800)
    if full:
        hgt = await pg.evaluate('document.documentElement.scrollHeight')
        for y in range(0, hgt, 300):
            await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(90)
        await pg.wait_for_timeout(2600)
        await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(700)
    await pg.screenshot(path=str(ROOT / 'shots' / f'{name}.png'), full_page=full)
    await ctx.close()
    return errs

async def main():
    (ROOT / 'shots').mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        jobs = [a.split(':') for a in sys.argv[1:]] or [['1440','900','light','desk-light']]
        for w, h, theme, name in jobs:
            errs = await shot(b, int(w), int(h), theme, name)
            print(name, 'errors:', errs)
        await b.close()
asyncio.run(main())
