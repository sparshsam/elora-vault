# Screenshots

This directory contains screenshots of the Elora application for the GitHub README.

## How to Generate Screenshots

### Option 1: Manual (Recommended)
1. Run the app locally: `npm run dev`
2. Open each page in a browser at 1440x900 (desktop) and 390x844 (mobile)
3. Take screenshots and save them here as PNG files
4. Update the README.md references

### Option 2: Playwright (Automated)
If you have Playwright installed:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Then create a script `scripts/screenshots.mjs`:

```javascript
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const PAGES = [
  { path: '/', name: 'landing' },
  { path: '/dashboard', name: 'dashboard', auth: true },
  { path: '/bets/new', name: 'new-bet', auth: true },
  { path: '/bets/open', name: 'open-bets', auth: true },
  { path: '/history', name: 'bet-history', auth: true },
  { path: '/transactions', name: 'transactions', auth: true },
  { path: '/settings', name: 'settings', auth: true },
  { path: '/deposit', name: 'deposit', auth: true },
];

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  for (const { path, name, auth } of PAGES) {
    const page = await context.newPage();
    if (auth) {
      // You'll need to handle auth here
      // e.g., set cookies or sign in programmatically
    }
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `assets/screenshots/${name}.png`, fullPage: true });
    await page.close();
  }

  // Mobile screenshots
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  for (const { path, name, auth } of PAGES) {
    const page = await mobileContext.newPage();
    if (auth) {
      // Handle auth
    }
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `assets/screenshots/${name}-mobile.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
}

captureScreenshots().catch(console.error);
```

## Required Screenshots

For the README, these screenshots are referenced:

| File | Content |
|------|---------|
| `landing.png` | Landing page hero section |
| `dashboard.png` | Dashboard with vault overview |
| `new-bet.png` | Bet form with live preview |
| `open-bets.png` | Open bets with settlement actions |
| `mobile-nav.png` | Mobile bottom navigation |
| `dashboard-mobile.png` | Dashboard on mobile viewport |

## Notes
- Screenshots should be taken with a logged-in user that has some data
- Use the `assets/screenshots/` path for all references
- Compress PNG files before committing (e.g., `optipng` or `pngquant`)
