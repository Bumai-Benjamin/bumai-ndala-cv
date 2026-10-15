# Bumai Ndala · CV site

Personal CV website for Bumai Benjamin Ndala, Mobile Application Administrator for CallAFix at Mfumu Investments and Computer Science (Software Development) student at NUST, Windhoek.

Live at **https://bumai-ndala.netlify.app** once the Netlify project is linked to this repo.

## What's in here

| Path | What it is |
| --- | --- |
| `content.json` | All CV content. Edit this to change the site and the PDF. |
| `templates/` | Jinja templates: the page, the printable CV, the share image and the favicon. |
| `site/` | The built site that Netlify publishes. |
| `tools/build.py` | Renders `templates/` + `content.json` into `site/`. |
| `tools/render.py` | Renders the PDF CV, the share image and the favicons with Playwright. |
| `tools/shoot.py`, `tools/smoke_test.py` | Screenshots and an interaction check for local review. |
| `netlify.toml` | Tells Netlify to publish `site/` with no build step. |

## Update the CV

```bash
pip install -r tools/requirements.txt
python -m playwright install chromium

# edit content.json, then:
python tools/build.py     # rebuild the HTML
python tools/render.py    # rebuild the PDF, share image and favicons
```

Commit and push. Netlify redeploys `site/` on every push to `main`.

## Design

The look blends three references:

- **Soft porcelain console** (from the reference video): folder-tab panels, black pill buttons, a career journey drawn as a connected pipeline, and dialogs that blur the page behind them.
- **Skeuomorphism**: a CallAFix staff badge on a lanyard, keycap skills, dial meters for languages and a metal light/dark switch.
- **Material 3**: navigation rail, segmented buttons, floating action button, bottom navigation bar on phones and ripple feedback.

Palette: periwinkle and porcelain with near-black actions, in light and dark themes. Type: Roboto Flex (display), Manrope (text) and Roboto Mono (labels), all self-hosted.

## Contact form

The form uses Netlify Forms. Messages appear under **Forms** in the Netlify project. Add an email notification there to get them in your inbox.

## Privacy

The site and PDF intentionally leave out the ID number, date of birth, ID and licence scans, and referees' contact details. References are "available on request".
