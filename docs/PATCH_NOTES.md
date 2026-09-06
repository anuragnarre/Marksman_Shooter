# 🚀 MARKSMAN — Patch Notes & System Changelog

**Release Date:** September 1, 2026  
**Version:** v1.2.0-beta  
**Environment:** Next.js 15 (App Router) + NestJS + Tailscale VPN  

---

## 🛠️ Summary of Changes & Fixes

### 1. 📱 Mobile UI/UX Overhaul & Transparency Fixes
* **Root Cause Transparency Bug Fixed**: Fixed invalid CSS class `bg-bg-surface` which emitted no CSS properties, leaving mobile menus 100% transparent.
* **Tailwind Theme Color Aliases**: Updated `tailwind.config.ts` to register `'bg-void'`, `'bg-surface'`, `'bg-elevated'`, and `'bg-subtle'` color tokens.
* **Guaranteed Solid Backgrounds**: Added explicit inline CSS properties (`backgroundColor: '#0E1118'`, `opacity: 1`) to `MarketingNav.tsx` and `MobileMenu.tsx` to ensure zero transparency.
* **Dimmed Backdrop Overlay**: Strengthened mobile backdrop overlays (`bg-black/85 backdrop-blur-md`) to dim background page content when navigation menus are open.

---

### 2. 📐 Mobile Aspect Ratio Layout Optimizations (320px – 640px)
* **Header Real Estate Optimization**: Hidden non-essential desktop buttons (`Feedback`, `Share`, `User Avatar`) from `TopBar.tsx` on small screens (`hidden sm:flex`). Reduced right-side icon cluster width from 280px to 110px, freeing 250px+ for the page title.
* **Title Truncation**: Added responsive title truncation (`max-w-[130px] xs:max-w-[180px] sm:max-w-none truncate`) to prevent title text from pushing topbar icons off-screen.
* **Solid Bottom Navigation Bar**: Set `BottomNav.tsx` to 100% solid `var(--bg-surface)` (`#0E1118`) with top drop-shadow (`0 -10px 30px rgba(0,0,0,0.4)`), preventing scrolling page content from bleeding under bottom tabs.
* **AI Coach Floating Badge**: Shifted `AICoachPanel.tsx` trigger button to `bottom-[78px]` on mobile devices so it sits above the `BottomNav` without obscuring tabs.
* **Global Horizontal Overflow Prevention**: Applied `overflow-x: hidden;` to `html` and `body` in `globals.css`.
* **Sub-heading Double Padding Fix**: Fixed `max-w-2xl mx-auto` text wrapping on landing page subheadings in `app/page.tsx`.

---

### 3. 🔔 Mobile Notification System (YouTube / Facebook Bottom-Sheet Pattern)
* **Mobile Bottom Sheet Modal**: Transformed desktop floating dropdown into a responsive mobile bottom sheet modal (`rounded-t-3xl bg-bg-surface p-5 z-[111]`) with a dark backdrop (`z-[110]`), dedicated close `✕` button, and "NEW" notification count badge.
* **Desktop Popover**: Retained floating glass popover panel on desktop screens (`sm:`).

---

### 4. 💻 View Mode Separation (Desktop vs. Mobile Architecture)
* **Desktop View (`≥ 1024px`)**:
  * Expandable left glass sidebar (`260px` / `72px`).
  * Full sticky TopBar with `⌘K` command palette search bar and inline role-colored avatar ring.
  * Hidden mobile bottom navigation bar (`hidden lg:hidden`).
* **Mobile View (`< 1024px`)**:
  * Compact 68px Bottom Navigation Bar with 5 primary thumb-friendly action tabs (Home, Sessions, Center `+New` FAB, Stats, More).
  * Compact TopBar (Logo + Title + Search + Notifications + Theme Toggle).
  * Slide-over Mobile Navigation Drawer (`MobileMenu`) at `z-[101]` with dark backdrop (`z-[100]`), isolated user avatar card, and grouped expanders.

---

### 🌐 5. Tailscale VPN Remote Hosting & Deployment
* **Tailscale Serve Configuration**:
  * Web App (Port 3000) ➔ `https://desktop-rmch6n7.tail1bacbb.ts.net/`
  * API Server (Port 3001) ➔ `https://desktop-rmch6n7.tail1bacbb.ts.net:3001/`
* **Automated Startup Script**: Created `start-tailscale.ps1` to detect Tailscale IP `100.84.212.35` and configure `apps/web/.env.local`.
* **NestJS CORS & Next.js Allowed Origins**: Updated NestJS `main.ts` and Next.js `next.config.ts` to allow cross-origin requests from Tailscale IPs (`100.*`) and `.ts.net` domain origins.

---

### 📋 6. Master Software Plan Documentation
* Created `MARKSMAN_MASTER_PLAN.md` containing all 338 improvement items for shooting range management, individual players, and coaches. Saved at `d:\App and Hardware Project\App\Marksman\shooting\docs\MARKSMAN_MASTER_PLAN.md`.

---

## 🎯 Verification Results
* **Local Dev Server**: `http://localhost:3000` ➔ `HTTP/1.1 200 OK`
* **Tailscale Remote Endpoint**: `https://desktop-rmch6n7.tail1bacbb.ts.net` ➔ `HTTP/1.1 200 OK`
