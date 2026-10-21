# parinam-praphul-portfolio

A static, responsive, interaction-rich portfolio for Parinam Praphul Bharadwaj.

## Files

- `index.html` — semantic page and profile content
- `style.css` — visual system, responsive layouts, reduced-motion support
- `script.js` — canvas ambience, reveal effects, project case-study dialogs, navigation, project filters, skill matrix, cursor and magnetic button interactions

## Preview

Open `index.html` directly or serve this folder with VS Code Live Server.

## Deploy

Copy the three website files into the root of your GitHub Pages repository. Keep the filenames and relative links unchanged. No build step is required.

## Performance and accessibility

- No GSAP, Framer Motion, Lenis, Tailwind build, or other heavy runtime dependency.
- Lightweight canvas with capped node count and pixel ratio.
- CSS transforms for motion and IntersectionObserver for reveal animations.
- Native `<dialog>` for accessible case-study modals; Escape closes the dialog.
- Reduced-motion support, visible focus styles, skip link, semantic landmarks, and mobile fallbacks.
- The canvas and custom cursor are decorative; the portfolio remains navigable without them.

## Content integrity

Project descriptions use the details provided by the portfolio owner. No unverified performance metrics are presented. Skills without a supplied project association are shown in the matrix without forcing a match.
