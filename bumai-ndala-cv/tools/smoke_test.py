"""Exercise the interactive parts and capture viewport screenshots."""
import asyncio, threading, functools, http.server, socketserver
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
PORT = 8766
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):  # mimic Netlify Forms accepting the post
        n = int(self.headers.get('Content-Length', 0)); body = self.rfile.read(n).decode()
        print('POST', self.path, body[:200]); self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
def serve():
    h = functools.partial(Quiet, directory=str(ROOT / 'site'))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), h) as s: s.serve_forever()
threading.Thread(target=serve, daemon=True).start()
S = ROOT / 'shots'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(f'http://127.0.0.1:{PORT}/'); await pg.wait_for_timeout(1500)
        # journey: scroll in, hover a node, filter
        await pg.evaluate("document.getElementById('journey').scrollIntoView()"); await pg.wait_for_timeout(2600)
        await pg.hover('[data-node="callafix"]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=str(S / 'i-journey-hover.png'))
        await pg.click('[data-filter="work"]'); await pg.mouse.move(5, 5); await pg.wait_for_timeout(600)
        await pg.screenshot(path=str(S / 'i-journey-filter.png'))
        await pg.click('[data-filter="all"]')
        # node dialog
        await pg.click('[data-node="callafix"]'); await pg.wait_for_timeout(800)
        await pg.screenshot(path=str(S / 'i-node-dialog.png'))
        print('node dialog open:', await pg.evaluate("document.getElementById('dlg-node').open"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        print('node dialog closed:', not await pg.evaluate("document.getElementById('dlg-node').open"))
        # contact dialog: empty submit -> errors, then valid submit
        await pg.click('.rail-fab'); await pg.wait_for_timeout(700)
        print('focused:', await pg.evaluate("document.activeElement.name"))
        await pg.click('[data-submit]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(S / 'i-form-errors.png'))
        print('errors shown:', await pg.evaluate("[...document.querySelectorAll('.field-error')].map(e=>e.textContent).filter(Boolean)"))
        await pg.fill('input[name=name]', 'Test Person'); await pg.fill('input[name=email]', 'test.person@example.com')
        await pg.fill('textarea[name=message]', 'Hello Bumai, this is a test message from the local preview.')
        await pg.click('[data-submit]'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=str(S / 'i-form-done.png'))
        print('done visible:', await pg.evaluate("!document.querySelector('[data-contact-done]').hidden"))
        await pg.click('[data-contact-done] [data-close]'); await pg.wait_for_timeout(500)
        # keycap typing + theme toggle
        await pg.evaluate("document.getElementById('skills').scrollIntoView()"); await pg.wait_for_timeout(1500)
        await pg.click('.key-wide'); await pg.wait_for_timeout(700)
        print('typed:', await pg.text_content('[data-typed]'))
        await pg.click('.rail [data-theme-switch]'); await pg.wait_for_timeout(700)
        print('theme now:', await pg.get_attribute('html', 'data-theme'), 'saved:', await pg.evaluate("localStorage.getItem('theme')"))
        await pg.screenshot(path=str(S / 'i-skills-dark.png'))
        print('active tab:', await pg.evaluate("document.querySelector('.tabs a[aria-current=true]').dataset.tab"))
        print('page errors:', errs)
        await b.close()
asyncio.run(main())
