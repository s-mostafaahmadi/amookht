# Version 21 — Premium Study Workspace and Reliable Learning Progress

**Release date:** 2026-11-07

Version 21 turns Amookht into a more complete, persistent and scalable learning workspace. It combines the Premium document library, stylus-first study tools, reliable session tracking, compact content analytics and a refined multilingual experience.

## Premium library and notes

- Private Premium workspace for PDF files, notes and folders
- Secure PDF upload and authenticated, owner-scoped file access
- Nested folders plus desktop and mobile drag-and-drop organization
- Personal notes with typed, handwritten and combined editing modes
- Glass-style text entry and responsive layouts
- Localized Premium previews and subscription cards for free users
- Example Premium plan page with a 499,000 toman price card

## PDF study tools

- Pen and stylus input for supported phones, tablets and computers
- Adjustable pen size and immediate color changes
- Highlight, underline, text and path-aware eraser tools
- Text editing with tap and movement with press-and-hold
- Page navigation controls at the top corners of the PDF
- Improved mobile PDF rendering quality
- Restoration of the last opened PDF page and position
- Automatic annotation saving with visible wait feedback

## Handwriting workspace

- Extended handwriting canvas with press-and-hold scroll controls
- Balanced scrolling speed and mobile selection prevention
- Tight cropping around handwritten content before transfer
- Movable and resizable handwriting stickers in combined notes
- Multiple transferred handwriting items without replacing previous work
- Floating controls for confirm, delete, resize and move actions
- Optimized stroke compression for faster transfer and saving
- Clear progress overlays during transfer and persistence operations

## Navigation and persistence

- Refresh keeps the user on the current page and activity
- Browser Back follows the in-app navigation history
- Safe note and PDF saving before navigation or exit
- Activity checkpoints on skill exit, browser Back, refresh and page close
- Automatic learning-state persistence every 10 seconds
- Background tabs no longer add incorrect learning time
- Learning time is limited to plan skills, mistakes and favorites

## Learning plans and interface

- Learning-plan selection and execution are combined into one flow
- Learners without a selected plan start in plan selection
- Active plans provide a controlled “change learning plan” action
- Sidebar navigation was reordered and account settings moved to the profile
- Responsive language switching no longer overlaps authentication actions
- Light-theme daily progress styling was aligned with the rest of the UI
- The TestDaF Premium preview opens directly without a subscription pop-up

## Content progress and administration

- Compact tree-based content monitoring for administrators
- Topic, subtopic and skill totals for words, texts and questions
- Practised-content counters displayed as completed / total in History
- Live per-user vocabulary progress with stable word identifiers
- Normalized word matching and duplicate avoidance
- Prioritization of unseen vocabulary in future sessions
- Reliable recovery of older activity and vocabulary progress records
- Scalable content-bank organization for larger datasets and user volumes

## TestDaF and Premium experience

- Premium TestDaF simulation preview with exam-like timing and task coverage
- Speaking workflow with recording and saved progress
- Premium feature advertising tailored to each locked feature
- Localized advertising and subscription content in Persian, English and German

## Architecture and safety

- User state is persisted locally first and synchronized with the server
- Library metadata and annotations remain scoped to the authenticated user
- PostgreSQL-backed library and learning-state persistence
- Sensitive runtime configuration, uploaded documents, backups and private keys are excluded from this public release
- No production `.env` file or user-generated document is included

## Validation

- Inline JavaScript syntax validation completed
- Publisher secret and sensitive-filename checks remain enabled
- Version 21 is prepared for its scheduled Publisher release
