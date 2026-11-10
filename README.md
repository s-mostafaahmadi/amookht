# Version 22 — Stylus and Annotation Tools

This version improves the Premium PDF and notes workspace for phones, tablets, and stylus-enabled devices.

## Added

- Stylus handwriting canvas for personal notes
- Pointer Events support for pen, touch, and mouse input
- Pressure-sensitive stroke width on compatible pens
- Pointer capture for uninterrupted strokes near canvas edges
- Persistent note handwriting stored as normalized JSON in PostgreSQL
- Configurable pen color and stroke width for handwritten notes
- Note handwriting eraser and clear-all action

## Improved

- PDF eraser now checks the complete pen or highlight path instead of only its first point.
- Dragging the eraser can remove pen strokes, highlights, underlines, strikeouts, and text annotations.
- Selecting a PDF tool no longer re-renders the page or resets the scroll position.
- The active tool changes in place while the PDF viewport remains stable.
- PDF.js is self-hosted with the correct JavaScript MIME type.
- Loading overlays are shown while uploading and preparing PDF documents.

## Backend

- Migration: `011_note_handwriting`
- `library_notes.drawing` uses JSONB and defaults to an empty list.
- Note create/read/update endpoints include the drawing payload.
- Drawing payloads are limited to 5,000 strokes per note.

## Validation

- Stylus note CRUD was verified against the production API.
- Premium authorization and ownership rules remain enforced.
- Public frontend markers, PDF tool stability, migration head, and backend health were verified after deployment.
