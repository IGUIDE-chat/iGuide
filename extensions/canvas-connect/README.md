# iGuide Canvas Connect

A Chrome extension that feeds the iGuide daily quiz (`iguide.chat/quiz`) with
what each of your UIUC courses is covering right now.

UIUC does not let students create Canvas access tokens, so the extension reads
Canvas the same way Canvas's own web app does: from your browser, with your own
Canvas sign-in. It only sends `GET` requests, one at a time with a short pause.

## What leaves your browser

Only plain-text course digests: for each current-term course, the upcoming
assignments and exams, recent announcements, open modules, excerpts of the
newest lecture pages, and the start of the syllabus. The `/quiz` page uploads
them with your iGuide sign-in.

Nothing else does. The extension does not use the cookies API, never sees your
NetID password, and never sends a Canvas session anywhere. When Canvas needs you
to sign in, it opens Canvas in a normal tab and you sign in on Canvas's and the
university's own pages.

## Install (unpacked)

1. Download `iguide-canvas-connect.zip` from the `/quiz` page and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder.
4. Open `iguide.chat/quiz`, sign in to iGuide, and click **Connect Canvas**.

## How it works

| File            | Role                                                                                                                   |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `content.js`    | Runs on `iguide.chat` (and `localhost:5173` for dev). Marks the page as having the extension and relays sync requests. |
| `background.js` | Checks the Canvas sign-in, opens a Canvas tab to sign in when the student asked for it, and runs the read.             |
| `canvas.js`     | Picks the most recently started term's courses and builds one digest per course.                                       |

The page asks for a background sync at most once every 20 hours (no tab is ever
opened for that); the **Sync now** / **Connect Canvas** button runs an
interactive sync that may open a Canvas tab.

## Develop

```bash
node --test extensions/canvas-connect/canvas.test.mjs
```

After changing the extension, rebuild the download the `/quiz` page links to
(PowerShell, from the repo root):

```powershell
Compress-Archive -Force -Path extensions/canvas-connect/manifest.json, extensions/canvas-connect/background.js, extensions/canvas-connect/content.js, extensions/canvas-connect/canvas.js -DestinationPath apps/web/public/downloads/iguide-canvas-connect.zip
```
