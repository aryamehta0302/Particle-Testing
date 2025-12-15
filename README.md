<div align="center">
  <h1>🎨 Particle Testing</h1>
  <p><strong>Author:</strong> Arya Mehta</p>
</div>
<div align="center">
   <h1>🎨 Particle Testing</h1>
   <p><strong>Author:</strong> Arya Mehta</p>
   <p>
      <img alt="version" src="https://img.shields.io/badge/version-1.0.0-blue" />
      <img alt="license" src="https://img.shields.io/badge/license-MIT-green" />
      <img alt="author" src="https://img.shields.io/badge/author-Arya%20Mehta-orange" />
      <img alt="ci" src="https://img.shields.io/badge/ci-none-lightgrey" />
   </p>
</div>

# **Particle Testing**

A real-time, interactive 3D particle system that responds to hand gestures. Built with React, Three.js, and MediaPipe hand-tracking, the app showcases configurable particle effects, a compact control toolbox, and performance monitoring.

**Repository Goal:** Personal demo / creative playground for interactive particle visuals and gesture-driven controls.

**Tech stack:** React, TypeScript, Three.js, MediaPipe (@mediapipe/tasks-vision), Tailwind CSS (via CDN), lucide-react icons.

**Live / Demo:** This project is designed to run locally with `vite`.

**Table of Contents**
- **Overview**
- **Features**
- **Installation & Run**
- **Configuration & Theming**
- **Project Structure**
- **What We Changed (Personalization)**
- **Contributing**
- **License**

**Note:** This README contains explicit PowerShell commands for running locally on Windows (your default shell).

--

**Overview**

This project creates a reactive, GPU-driven particle scene that is controlled by detected hand gestures (open hand, fist, clap). It is intended as a personal demo and art project.

**Features**
- **Hand Gesture Control:** Real-time hand tracking via MediaPipe drives particle behavior.
- **Multiple Particle Shapes & Styles:** Switch between preconfigured shapes and styles from the UI toolbox.
- **Color & Theme Options:** Preset color swatches, rainbow mode, and simple theming instructions included.
- **Performance Monitor:** FPS display for tuning visuals.
- **Compact Controls:** A bottom-right toolbox (`components/Controls.tsx`) provides quick access to settings.

--

**Installation & Run**

- Prerequisites: Node.js (LTS recommended) and npm.

Run these in PowerShell from the project root (`.` is the repo root):

```powershell
npm install
npm run dev
```

Build for production:

```powershell
npm run build
```

Preview the production build (after `npm run build`):

```powershell
npm run preview
```

--

**Configuration & Theming**

- Tailwind CSS is included via CDN in `index.html`. For local/theme customization, consider installing Tailwind as a dev dependency and adding a `tailwind.config.js`.
- Quick theme tips:
   - The background is controlled by `body { background-color: #050505; }` in `index.html` (or `index.css`). Change that color for global theme changes.
   - If you want togglable Light/Dark themes, add CSS variables in `index.css` and toggle a `.light`/`.dark` class on the `body` element.

Snippet to add to `index.css` (example):

```css
:root {
   --bg: #050505;
   --text: #ffffff;
   --muted: #9ca3af;
}
.light {
   --bg: #ffffff;
   --text: #0f172a;
   --muted: #6b7280;
}
body { background-color: var(--bg); color: var(--text); }
```

Then toggle by adding/removing the `light` class on the `body` element (e.g., via a small button in the UI).

--

**Project Structure (important files)**
- `index.html` — entry HTML, Tailwind CDN, importmap for demos
- `index.tsx` / `App.tsx` — app entry + layout and main UI
- `components/ParticleSystem.tsx` — Three.js scene and particle logic
- `components/Controls.tsx` — UI toolbox used to change color/shape/style
- `components/HandTracker.tsx` — MediaPipe hand-tracking integration
- `components/PerformanceMonitor.tsx` — FPS display
- `metadata.json` / `package.json` — project metadata and dependencies

--

**What We Changed (Personalization & UI updates)**

This session included personal branding and UI changes to make the project appear authored by you (Arya Mehta). The edits made:
- `package.json` — renamed project to `particle-testing`, bumped version to `1.0.0`, and added `author: "Arya Mehta"`.
- `metadata.json` — updated `name` to `Particle Testing` and added `author` field.
- `README.md` — replaced with this more detailed, branded README.
- `index.html` — added `<meta name="author" content="Arya Mehta" />` and updated `<title>` to the project name.
- `App.tsx` — replaced the top-left header text from `ZEN` to `PARTICLE TESTING` and added a subtitle `BY ARYA MEHTA`.

--

**Badges & CI**

- Included basic static badges at the top of this README. To enable dynamic badges (build status, npm version), add a GitHub Actions workflow or publish to npm and replace the placeholder badge URLs with real ones.

Example GitHub Actions badge (replace `OWNER/REPO` and workflow name):

```markdown
![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
```

--

**Customization / Theming Ideas**

- Add `daisyUI` or `headlessui` alongside Tailwind for prebuilt components and themes.
- Use a small theme toggle in `Controls.tsx` to toggle body classes for light/dark and persist the choice in `localStorage`.
- If you want richer color palettes, expose a color picker in `Controls.tsx` and save the chosen color to `ParticleConfig`.

--

**Contributing**

- Small improvements, bug reports, and UI suggestions welcome. Create issues or PRs.
- Follow the existing TypeScript + React conventions. Keep changes small and focused.

--

**License**

This project is provided under the MIT license. If you want a different license, replace the `LICENSE` file accordingly.

--

If you'd like, I can:
- add a small theme toggle button to the UI (`App.tsx` + `Controls.tsx`),
- wire up a GitHub Actions workflow for a build badge,
- or add an example `tailwind.config.js` and `index.css` theme variables and move Tailwind from CDN to local usage.

Which of these would you like me to do next?
