# Kyron Realty AI — Design System & UI Standards

This guide documents the design principles, color tokens, component patterns, and motion standards for Kyron Realty AI. All new pages and components should adhere to these conventions for aesthetic consistency.

---

## 1. Core Philosophy: Luxury Dual-Pane Aesthetic

Kyron Realty AI uses a high-contrast dual-theme strategy to project institutional credibility and modern AI sophistication:

- **Light Mode (Clean Operational Surface)**: Used for high-frequency interactive tasks, forms, authentication inputs, data tables, and user profile management. Crisp, high-contrast, uncluttered (`#ffffff` / `slate-50`).
- **Midnight Luxury Dark (Intelligence Showcase & Analytics)**: Used for AI telemetry, predictive property visualizations, real-time live valuation metrics, and pitch showcases (`slate-950` / `#090D16`).

---

## 2. Color Palette & Semantic Tokens

### Primary & Accent
- **Primary Brand Blue**: `#2563eb` (`blue-600`) | Hover: `#1d4ed8` (`blue-700`) | Background Glow: `blue-500/20`
- **Electric Indigo**: `#4f46e5` (`indigo-600`) | Used for subtle gradients, AI aura effects, and badge accents.
- **Signal Emerald (Confidence / Yield)**: `#10b981` (`emerald-500`) / `#34d399` (`emerald-400`). Used for positive growth projections, valuation confidence ratings, and SSL trust badges.
- **Amber Gold (Ratings / Attention)**: `#f59e0b` (`amber-500`) / `#fbbf24` (`amber-400`). Used for review stars and notice warnings.

### Slate Scale
- **Dark Backgrounds**: `bg-slate-950` (`#020617`), `bg-[#090D16]`, `bg-slate-900/80`
- **Light Backgrounds**: `bg-slate-50` (`#f8fafc`), `bg-white` (`#ffffff`), `bg-slate-100` (`#f1f5f9`)
- **Borders**: Light mode `border-slate-200/80` | Dark mode `border-white/10` to `border-white/15`

---

## 3. Glassmorphism & Card Patterns

Defined in `src/app/globals.css`:

### Light Glass Card (`.luxury-card`)
Use for floating cards and summary widgets on light backgrounds.
```css
.luxury-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.05), 0 4px 12px -4px rgba(15, 23, 42, 0.03);
}
```

### Dark Luxury Glass Card (`.luxury-dark-card`)
Use for widgets, metric cards, and testimonial blocks over dark or image backgrounds.
```css
.luxury-dark-card {
  background: rgba(10, 15, 29, 0.76);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}
```

### Hover Transitions (`.luxury-card-hover` / `.luxury-dark-card-hover`)
Always use the custom cubic-bezier easing curve for luxury micro-interactions:
```css
transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 4. Typography & Hierarchy

- **Font Family**: Modern system UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Display Headings**: `font-extrabold` or `font-black` with tight tracking (`tracking-tight`).
- **Gradient Text Accents**: `text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300` on dark backgrounds.
- **Labels & Microcopy**: `text-xs` or `text-[11px]`, uppercase tracking for section eyebrows (`tracking-wider text-slate-400`).

---

## 5. UI Components & Micro-Interactions

- **Badges**: Rounded pill tags with a 1.5px pulse dot for live indicators (`<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />`).
- **Buttons**:
  - Primary: `bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-md shadow-blue-500/20`.
  - Secondary / Outline: `bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl`.
- **Form Inputs**: `bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all`.
- **Icons**: Lucide React with explicit sizing (`w-4 h-4` standard, `w-3.5 h-3.5` inside tags and badges).
