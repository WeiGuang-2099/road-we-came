// Draws scripts/og.html into the link preview card, public/og.png, and the
// itch.io cover, itch/cover.png, with Chrome or Edge in headless mode, so no
// browser package is needed. Set CHROME to the browser's path if it is not
// in one of the usual places.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';

const PAGE = 'scripts/og.html';
const PICTURES = [
  {target: 'public/og.png', query: '', size: '1200,630'},
  {target: 'itch/cover.png', query: '?cover', size: '630,500'},
];

const browser = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find(path => path && existsSync(path));
if (!browser) {
  console.error('No Chrome or Edge found. Set CHROME to the browser path.');
  process.exit(1);
}

for (const {target, query, size} of PICTURES) {
  mkdirSync(dirname(target), {recursive: true});
  // A throwaway profile, so a browser that is already open is left alone.
  const profile = mkdtempSync(join(tmpdir(), 'laishilu-og-'));
  try {
    execFileSync(
      browser,
      [
        '--headless',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=${size}`,
        // The page loads LXGW WenKai from node_modules over file://.
        '--allow-file-access-from-files',
        // Wait for the font files before the picture is taken.
        '--virtual-time-budget=5000',
        `--user-data-dir=${profile}`,
        `--screenshot=${resolve(target)}`,
        pathToFileURL(resolve(PAGE)).href + query,
      ],
      {stdio: 'ignore'},
    );
  } finally {
    rmSync(profile, {recursive: true, force: true});
  }
  console.log(`${target}: drawn from ${PAGE}${query}`);
}
