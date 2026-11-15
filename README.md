# Version 24 ? Path-aware Eraser

This version improves handwriting and PDF annotation controls.

## Changed

- Removed the strikeout tool from the PDF toolbar.
- The note eraser now works continuously while the pointer or stylus moves.
- Touching any segment of a handwritten stroke removes that stroke; the starting point is no longer required.
- Eraser hit testing now respects canvas scale, stroke thickness, and high-DPI PDF rendering.
- PDF erasing continues while dragging across annotations.

## Preserved

- Existing strikeout annotations remain readable for backward compatibility.
- Stylus pressure, selectable pen width, live color changes, and saved annotations remain supported.
