# Amookht for Windows v4 — native rewrite plan

Goal: the same features, options and content as learn.tah3in.com, rebuilt as a light native Windows app
(no embedded site), sharing the same account, study state and content with the site.

## What exists today (measured 2026-11-18)

| Part | Size | Plan |
| --- | --- | --- |
| Site app (testdaf-daily-plan.html) | 942 KB | rewrite as modules |
| Lesson engine (testdaf-method.js + ÖSD profile) | 430 KB | rewrite (biggest, most delicate part) |
| Tutor, translator, selection toolbar, free study, grammar bot, premium, sync, … | ≈ 400 KB | rewrite |
| Lesson content: TestDaF 2.1 MB, ÖSD 4.1 MB; grammar bank 400 KB; games 176 KB; simulator 27 KB | ≈ 7 MB | reuse as data (download + cache) |
| Audio (method + free study) | ≈ 570 MB | stream from server, cache on disk |
| Backend (25 route groups: auth, account/state + sync, method, tutor, grammar-drill, library, vocabulary, errors, analytics, widget, sentence-parts, admin, ai-admin, owner-ai, …) | — | reuse unchanged |

## Architecture (lighter than the site)

- One window, one local UI bundle split per feature (no Tailwind CDN, no 1 MB HTML, no runtime string-rewriting).
- **Store + sync**: one in-memory store mirroring the site's state JSON; changes go out as `PATCH /v1/account/state`
  with path versions, live updates arrive over `/v1/sync/ws` — exactly the site's protocol, so site and app stay in step.
- **Content cache**: content packs are downloaded once (version-checked) into `%APPDATA%\Amookht\content`; audio cached
  on first play. Works offline for already-cached lessons.
- **Same rules as the site**: premium/trial gating, levels, daily minutes, NOTDF wording, structures in red chips,
  German-only selection, fa/en/de.

## Milestones (each one is tested; v3 stays the installed app until v4 reaches parity)

1. ✅ **Foundation** (done 2026-11-18, v3.1.0 preview: Ctrl+K → «پیش‌نمایش نسخهٔ بومی (۴)», or `--native`) — shell (keep v3 frame), sign-in, store + sync protocol, content cache, i18n, theme/accent/density/glass/contrast/font settings, navigation.
2. ✅ **Personal pages** (done 2026-11-18, v3.2.0 preview) — دفتر عبارات (deck + mistakes + review mode), علاقه‌مندی‌ها, تاریخچه (both tabs), کتابخانه (folders, PDFs, notes editor), تنظیمات برنامه/حساب.
3. **Plan engine** — اجرای برنامه: plan selection/onboarding, TestDaF and ÖSD daily modules (Lesen, Hören with player/transcript, Schreiben + AI feedback, Sprechen recording + feedback, Wortschatz, Grammatik, Wiederholung SRS, Fehleranalyse, Extra-Lernzeit, Wochenbericht), level and daily-time rules, active study time.
4. **Free study and tools** — مطالعه آزاد (6 exercise types, topics, levels), ربات گرامر, study tutor, translator, selection toolbar (translate/say/notebook/favourite/ask), sentence-part colours, media keys.
5. **Exam and coach** — شبیه‌سازی TestDaF, مربی گفتگو (native chat on the coach API, voices).
6. **Admin/owner** — مدیریت (users, last seen, content bank, AI providers, owner agent).
7. **Parity check and switch** — page-by-page comparison with the site on a test account, then on the owner account after a state backup; installer v4 replaces v3.

8. **Site download section** (user request 2026-11-18): when the app is finished, replace the widget section/tab on
   learn.tah3in.com with the Windows app download (installer) plus install and usage guides with screenshots.

## Safety

- Development and tests run on a **separate test account**; the owner account is only touched in milestone 7, after a backup of its state.
- The app never writes whole-state PUTs; only per-path PATCHes, like the site's sync layer.
- Widget, tray, settings window and the gate header carry over from v3 unchanged.

## Status

- **Milestone 1 — done.** `src/native/` (ES modules over the private `amookht://app/` scheme):
  `core/store.js` (site sync protocol: per-path PATCH, rejections, live WebSocket, resync on gaps, server-time timers),
  `core/content.js` + main-process cache (5 packs, ETag, offline copy), `core/theme.js` (all look options),
  `core/i18n.js` (fa/en/de), frame + palette in `main.js`, native «تنظیمات برنامه» with every option of the site page.
  Tests: `node test/store-test.mjs` (18 sync scenarios on a simulated server). Live read-only run on the owner
  profile copy: state v10782 loaded, live socket up, all packs loaded, 0 writes.
- **Test account (2026-11-18):** `windows-app-test@example.com`, Premium, created on the server by
  `test/server/mk_test_account.py` with a random password nobody knows (no e-mail, no sign-up notice). It is used
  only through tokens saved in `test/test-account.json` (refresh token valid 30 days; rerun the script on the server
  as user `amookht` to mint new ones). `node test/make-test-profile.js <dir>` builds a signed-in profile;
  `npx electron test/native-write.js --user-data-dir=<dir>` is the live write check (6/6 PASS: accent and dark mode
  saved to the account, live socket, synced). Both scripts refuse any other account. `test/` is not packaged.
- **Milestone 2 — done (v3.2.0).** Ported 1:1 from the site, same stored formats:
  - `core/learning.js` (dates, Anki scheduling of mistakes, plan-deck SRS 1·3·7·14·30, word progress,
    favourites with the site's hash ids), `core/site-text.js` (the site's own fa/en/de strings, generated).
  - `pages/errorbook.js` (plan deck: add own words with AI meaning via coach translate, review with Space/1/2,
    Anki CSV; mistakes: filters, search, vocab direction, manual cards, review with Again/Hard/Good/Easy = keys 1–4),
    `pages/favorites.js`, `pages/history.js` (both tabs, charts, daily report, weekly reports, skill goals, clear),
    `pages/library.js` (folders, drag-and-drop, PDF upload, PDF.js 4.10 viewer with pen/highlight/underline/text/eraser
    saved per page, notes typed/handwriting/combined stickers, live SSE updates via main process),
    `pages/account.js` (profile, photo, level rule, password, delete), Telegram card in «تنظیمات برنامه».
  - Main process: `library:file`, `library:upload`, `library:events`; `/coach/api/*` allowed through the gate header.
  - Tests on the test account: `test/native-pages.js` (19), `test/native-library.js` (14), `test/native-account.js` (10).
  - Not yet: the premium level change does not rebuild today's plan in the app (plan engine = milestone 3; the site
    still does it), sentence-part colours and the owner's day files (milestones 4 and 6).
- **Milestone 3 — started 2026-11-18 (user chose a full hand rewrite over a shared engine).** Rounds:
  3a engine core + dashboard + plan selection + module frame/timer, 3b Hören/Lesen, 3c Schreiben/Sprechen,
  3d Wortschatz/Wiederholung/Fehleranalyse/Wochenbericht/Extra, 3e ÖSD profile.
  - **3a — done.** `core/engine.js` (hand port: calendar, daily time split, levels, content picks, activities,
    VOL-TIME steps, syncPlan, plan lifecycle, study-mode tabs, renew limit, history segments) works on a long-lived
    draft of the account state and saves changed top-level keys (site saveData). The site saves the done list as
    `completed` and points as `points`. `core/active-time.js` = AmkActive (ACTIME), `core/history-data.js` = the
    site's history record helpers (shared with the history page), `data/method-static.js` + `data/topics.js`
    generated from the site. `pages/dashboard.js`: program choice, onboarding, today's plan, plan/free tabs, weekly
    program (time & path, focus, order, tables, writing samples, grammar, method), activity frame with steps and
    the active-time timer; module bodies show "comes in 3b/3c/3d" with a button to the current version.
  - Tests: `node test/engine-parity.mjs <site testdaf-method.js> <pack>` runs the site's real engine next to the
    port (17 checks: identical picks, minutes, activities, step volumes over 12 level/time combinations × 9 days);
    `test/native-dashboard.js` live on the test account (18 checks).
  - Free study (the «مطالعه آزاد» tab) stays in milestone 4; ÖSD users see a notice until 3e.
  - **3b — done (Hören, Lesen).** `core/work.js` = the engine's shared lesson logic (answers, checking, error
    categories, logErrors → state.errors + method log, computeResults, finish, model-answer gates, unclear sentences,
    AI layer with retry queue). `pages/modules/`: `index.js` (activity frame, countdown with auto-check, review
    mode, all interactions), `kit.js` (HTML pieces), `media.js` (player with word highlight and exam play limit,
    recorder with mic warm-up + voice chain + upload), `hoeren-lesen.js` (all steps of both modules).
    Main process: `amookht://media/assets/…` serves lesson audio through the gate and caches it in
    %APPDATA%\Amookht\media (Range requests work); `speaking:upload` for takes; AI calls get up to 150 s; the mic
    permission now also trusts the native app (and no longer crashes for other origins). Recording playback uses
    the account's `user_id` from /v1/account/me.
  - Tests: `node test/work-parity.mjs <site engine> <pack> <site html>` (9 checks: results, logged mistakes, method
    log and performance records identical to the site's engine for the same answers);
    `test/native-hoeren-lesen.js` live on the test account (20 checks, fake microphone, real AI calls).
  - **3c — done (Schreiben, Sprechen).** `pages/modules/schreiben-sprechen.js`: Argumentation and Grafik (chart,
    analysis, outline, essay with live word count and phrase chips, Korrektur with automatic AI correction that
    fills the five ratings and the Fehlerprotokoll, model text gate), Sprechen per task (prep → record → AI speech
    analysis + checklist → repeat with scores and attempt comparison) and the exam flow (mic warm-up, prep
    countdown, automatic recording and stop, analyses one after another). Analysed takes are deleted on finish
    (analysis kept), replaced takes are cleaned up. Parity test now covers all four skills (17 checks);
    `test/native-schreiben-sprechen.js` live (14 checks). The exam-day Sprechen flow is ported but has only been
    run on normal days so far (no Thursday/Friday yet).
  - **3d — done (Grammatik & Wortschatz, Wiederholung, Fehleranalyse, Wochenbericht, Extra-Lernzeit).**
    `core/review.js` (plan deck SRS 1·3·7·14·30, words into the site word list and "Nicht gewusst" mistakes,
    mistake review with the site's Anki schedule, self-test, weekly metrics, weekly AI analysis, report, phase advice,
    Extra sentence tasks with the site's structures) and `pages/modules/review-modules.js` (all screens, flip cards
    with stars and delete, grammar of the week, AI sentence check, comparison table, report form). The placeholder
    "comes in 3d" is gone: every TestDaF module now runs natively.
  - Tests: `test/work-parity.mjs` now 32 checks (deck entries, word progress, ratings, "Nicht gewusst", quiz score,
    performance records and weekly metrics identical to the site; every step of the five screens draws);
    `test/native-review.js` live (Wortschatz with the real AI sentence check, Wiederholung, Extra). Fehleranalyse and
    Wochenbericht only appear on Fridays, so they are covered by the parity/render checks, not yet run live.
  - **3e — done (ÖSD Zertifikat B2/C1).** `core/oesd.js` = the site's `oesd-method.js` profile (weekly rhythm with
    task formats per day, Sprechen order, grammar of the week, exam structure, methods, phases, e-mail analysis and
    outline fields, wording rewrite); its data blocks are lifted verbatim from the site file. The engine asks it at the
    same places the site calls `PROG()` (content filtered to the exam level from the `oesd` pack, day rhythm, Lesen and
    Schreiben format filters for picks and renew, static texts, state in `oesdMethod`), AI calls send the ÖSD exam
    name, and the dashboard/activity HTML gets the ÖSD wording. The level card (B2/C1; after today's practice has
    started the change applies from tomorrow) sits in today's plan and in the weekly program.
  - Tests: `node test/engine-parity.mjs <site engine> <pack> <site oesd-method.js> <oesd pack>` now 31 checks (adds 6
    ÖSD level/time configs × 9 days, level filter, state key, static texts and wording in fa/de/en against the site's
    real profile); `test/native-oesd.js` live (10 checks: switch the test account to ÖSD, plan, wording, level card,
    level change re-picks content, ÖSD Lesen questions, e-mail Schreiben fields, switch back to TestDaF).
- **Milestone 3 — done.** Every module of both programs runs natively. Not yet live-run: exam-day Sprechen,
  Fehleranalyse and Wochenbericht (Thursday/Friday only; covered by parity/render checks).
- **Milestone 4 — in progress (free study and tools).**
  - **4a — done: «مطالعه آزاد».** As on the site, the free tab is the games space (`pages/free-space.js`, port of
    `free-space.js`: pairs, der/die/das, meaning hunt, letter mix, sentence builder, phrases; topic and level picker;
    best stars) plus the grammar bot (`pages/grammar-drill.js`, port of `grammar-drill.js`: AI via /v1/grammar-drill,
    offline sentence bank otherwise). Both are generated from the site files by scratchpad scripts; inline handlers
    became data attributes (strict CSP). The free tab keeps its own hidden plan like the site
    (`buildPersonalizedActivities` ported; parity check: 18 cases identical). Fixed: the tab rollover rule ran on every
    redraw (the site runs it once at load), which flipped the free tab straight back.
  - **4b — done: floating tools.** `tools/*.js` = the site's study-tutor.js (tutor panel + selection toolbar:
    translate, speech, notebook, favourite, ask), amk-translate.js, amk-struct.js, amk-sentparts.js, amk-mediakeys.js,
    amk-tabnext.js, ported almost verbatim by `port_tools.py` and fed by `core/site-shim.js` (site globals on top of the
    store/engine). The lesson modules expose the site's `contextInfo` / `lookupWord` / audio seek for them. The main
    process now passes binary answers (coach speech audio). Engine draft now refreshes on every store change, so edits
    from other pages are never written back stale.
  - Tests: `test/native-free.js` (15 live checks, real grammar-bot AI), `test/native-tools.js` (17 live checks: tutor
    answer with lesson context, selection translate/⭐/📒, coach voice, translator, sentence colours, structure chips).
  - Still to do in 4: remaining small add-ons (coach inbox bridge belongs to milestone 5 with the coach).
- **Milestone 5 — done (exam and coach).**
  - **TestDaF simulator** (`pages/testdaf-sim.js`, hand port of the site's simulator): exam library (built-in exam from
    the «simulation» pack + the public exams from /v1/testdaf-exams), per-exam progress and visits, intro, overview,
    the four timed sections (Lesen 40, Hören 35 with the transcript read aloud — coach voice for premium, system voice
    otherwise — Schreiben with live 350–400 word count, Sprechen with 7 recordings uploaded like the site), hand-in
    rules, result card. Same stored keys as the site (testdafSim, testdafExamStates, testdafExamVisits,
    selectedTestdafExamId). Admin import/builder/delete of exams moves to milestone 6.
  - **Conversation coach** (`pages/coach.js`): like the site, the coach's own frontend runs in a same-origin frame
    (`amookht://app/coach/`). The main process caches its files from /coach/ (6 h, offline copy) and proxies its
    `api/…` calls with the signed-in token and gate header (incl. 401 → refresh), so the coach never holds a real token.
    Same origin means the selection toolbar, «open in Amookht» links and the coach → app bridge (`tools/coach-bridge.js`,
    ported) work as on the site. The app's translator hides on the coach page (`dcoach-active`), as on the site.
    Note: like the site's review filter, mistakes from the coach are not added to «اشتباهات»; starred phrases go to
    favourites.
  - Fixes: the tool adapter now drops unchanged drafts when the store changes (no stale write-back).
  - Tests: `test/native-sim.js` (15 live checks incl. a real recording upload), `test/native-coach.js` (6 live checks:
    coach loads through the proxy, real AI answer, coach voice, bridge into favourites).
- **Milestone 6 — done (admin and owner).**
  - `pages/admin.js` (hand port of the site's admin page): role filters with counts, search, verified-account creation
    (admins and owner), user list with verification, blocked state and last seen, and for the owner role change,
    block / unblock and delete with confirmation; 15 s live refresh. The practice monitor is switched off on the site
    (`ADMIN-NOPRACTICE`), so it stays off.
  - Ported site add-ons (tools/, via port_tools.py + core/site-shim.js): `ai-admin.js` (owner «مدیریت هوش مصنوعی»
    box on the admin page), `lastseen.js`, `owner-chat.js` (the site's 34 ownerAI* functions + owner-agent.js, owner
    only; bare inline handlers became data attributes, the functions are globals as on the site).
  - Simulator admin tools: import an exam file (validated like the site), download, delete, manual builder, section /
    question delete.
  - Owner day files (`core/owner-files.js`): the site's TDM.dayFileSnapshot (parity check: identical, including the
    site's quirk that Sprechen tasks are stored as «Aufgabe n» without text), captured when the plan is finished and
    before renew, button + file view on History plan days, delete.
  - Not ported: the legacy «Data Import» content-bank page (no link to it remains on the site).
  - Safety: `AMOOKHT_READONLY=1` makes the main process refuse every write (API, uploads, coach) and log
    READONLY-BLOCKED. `test/native-admin-readonly.js` (13 checks) ran on a copy of the owner's signed-in profile:
    admin list, owner controls, AI box, owner assistant with its conversations, simulator admin tools, History day-file
    buttons — and the app attempted 0 writes.
- **Milestone 7 — done except installing (2026-11-18).**
  - Owner state backed up before any write: server `/opt/amookht/backups/owner-state-before-v4-20261118T175712Z/`
    (the full `user_app_states` row, version 11695, root-only) and locally `%APPDATA%\Amookht\backups\`
    (`test/backup-owner-state.js`, read-only).
  - Page-by-page check on the owner account, read-only (`test/native-owner-check.js`, 20 checks): today's plan,
    done marks and picks as stored, every notebook card and favourite shown, history days, library, coach,
    simulator, settings, account, admin; no script errors; the only write attempted was the AI sentence-colour
    lookup (`POST /v1/sentence-parts`, no account change — the site makes the same call).
  - First live writes on the owner account (`test/native-owner-write.js`): a setting switched off and on through
    the app; every other key stayed identical to the backup. This found a real bug (site add-ons were not re-run
    after pages redraw themselves) — fixed: any change in the page area re-runs the site-style render hooks; the
    owner chat never repaints under the cursor.
  - v4 is the default: `useNativeEngine` is true unless the account menu's v3 view was chosen later (or `--site`);
    4.0 moves every install to v4 once (`engineV4` flag). Status bar shows «Amookht 4.0.0».
  - Installer `dist/Amookht-Setup-4.0.0.exe` (81 MB) built; the packaged build was checked (native page loads,
    sign-in, every page, tools). Not installed yet.
  - **Installed 2026-11-18** on this PC (silent install, C:\Program Files\Amookht): starts in v4, signed in as the owner, synced.

## 4.1 (2026-11-18)

- **Sidebar redesign** (owner: "the menu looks too plain"): same order, grouped under small headings
  (یادگیری · تمرین و آزمون · پیشرفت و تنظیمات), a coloured icon tile per section, stronger active state, coloured badges,
  and a «برنامه امروز» card on top with a progress ring (opens the plan; follows plan/completed/study-mode changes).
- **Automatic updates** (owner request): `electron-updater` 6.3.9 with a generic feed at
  `https://learn.tah3in.com/downloads/` (`latest.yml` + installer + blockmap, gate-free). The app checks 15 s after
  start and every 4 h, downloads in the background, shows a status-bar chip (downloading % → «نسخهٔ … آماده است ·
  راه‌اندازی دوباره»), installs on quit or at once from the chip. Off in dev runs, read-only runs or with
  `AMOOKHT_NO_UPDATE=1`; `AMOOKHT_UPDATE_URL` points a build at a test feed. Verified: a 4.1.0 build found a 4.1.1 on a
  local feed, downloaded and verified it, and showed the chip.
- **Releasing a new version**: bump `version` in package.json → `npm run dist` → upload
  `dist/Amookht-Setup-<v>.exe`, its `.blockmap` and `dist/latest.yml` to `/opt/amookht/app/downloads/` (installer and
  blockmap first, `latest.yml` last) → point the `Amookht-Setup.exe` link at the new file. Keep the previous blockmap
  for smaller (differential) downloads. Installed apps update themselves.
- Site: «دانلود اپلیکیشن‌ها» offers «آموخت برای ویندوز» (`/downloads/Amookht-Setup.exe`) instead of the old widget;
  `/widgets/guide.html` is the new install/usage guide with screenshots (`/widgets/img/`, taken on the test account by
  `test/capture-shots.js`). The old `AmookhtWidget.exe` stays downloadable for old links but is no longer shown.
