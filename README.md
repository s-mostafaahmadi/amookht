# Version 23 — Immediate Pen Color

This version fixes color selection latency in the Premium writing tools.

## Fixed

- A newly selected PDF pen or highlighter color now applies to the very next stroke.
- A newly selected handwriting color in personal notes applies immediately.
- Stroke-width sliders also update continuously while the control is moved.
- Both `input` and `change` events are handled for compatibility with mobile and desktop color pickers.

## Preserved

- Stylus pressure support
- Path-aware eraser
- Stable PDF scroll position while switching tools
- Persistent PDF annotations and note handwriting
