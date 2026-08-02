# Amookht — Product Releases

This document records the public product milestones after Version 21. It describes user-visible capabilities without publishing credentials, private data, production databases, uploaded files, recordings, logs, or infrastructure secrets.

## Version 22 — Advanced Content Management

Release date: 2026-08-02

### Added

- Separate public and private content databases for the owner
- Content creation for vocabulary, grammar, reading, listening, writing, and speaking
- Topic-aware vocabulary generation with fuzzy topic matching
- Complete vocabulary fields: meaning, level, part of speech, definition, example, translation, usage notes, collocations, and applicable word relations
- Duplicate-word detection before database insertion
- Fine-grained deletion of words, questions, texts, and complete exercises
- In-skill deletion that keeps the learner on the current activity screen
- Private-to-public content publishing with explicit owner control

## Version 23 — Owner AI Assistant

Release date: 2026-08-02

### Added

- Private operational AI assistant for the platform owner
- Provider selection and automatic provider failover
- Support for built-in and owner-configured AI APIs
- Controlled read and write tools for users, content, progress, library statistics, and TestDaF data
- Explicit confirmation before every write or destructive operation
- Retryable failed messages without losing the original prompt
- Compact two-conversation history loading
- Bounded recent-message context instead of resending the complete chat
- Dynamic response budgets and compact tool results to reduce API token usage
- Safe reporting that never claims an operation succeeded before a controlled tool confirms it

## Version 24 — Premium German Conversation Coach

Release date: 2026-08-02

### Added

- Dedicated German conversation coach for Premium, Admin, and Owner accounts
- Short, natural responses modeled after a professional native teacher
- Per-message grammar and phrasing correction
- Corrected sentence plus a brief explanation in the interface language
- Automatic continuation of the conversation with a natural reply or question
- Small context window and a strict response budget for low token consumption
- One retained conversation without a history list for Premium users
- Two recent conversations for Admin and Owner accounts
- Separate storage from the operational Owner AI Assistant
- Floating launcher positioned between Support and the Owner Assistant

## Version 25 — Reliability and User Experience

Release date: 2026-08-02

### Added and improved

- Stable in-app navigation and refresh-state restoration
- Activity timing and progress persistence across skill exits and refreshes
- Faster content saving and handwriting transfer workflows
- Improved PDF, handwriting, stylus, eraser, annotation, and mobile navigation behavior
- Role-aware Premium experiences and localized promotional screens
- More compact management and progress displays
- Backend validation for all six learning skills
- Regression checks for authentication, TestDaF content, AI tools, and provider connectivity
- Database-safe duplicate handling and controlled administrative operations
- Service health checks and recoverable server deployments with backups

## Security and privacy

The public repository intentionally excludes production credentials, `.env` files, database records, private user content, PDFs, notes, recordings, logs, server backups, and provider API keys.
