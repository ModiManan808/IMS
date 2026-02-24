# Lucide Icon Replacement — Walkthrough

## Install

```bash
npm install lucide-react   # +1 package, exit 0
```

---

## Files Changed (7)

### `Sidebar.tsx` — Nav icons
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/components/Sidebar.tsx)

| Emoji | Lucide |
|---|---|
| 📄 | `FileText` |
| ⏳ | `Clock` |
| ✅ | `CheckCircle` |
| ❌ | `XCircle` |
| 🎓 | `GraduationCap` |
| 📊 | `LayoutDashboard` |
| 👤 | `User` |

Icon type changed from `string` → `React.ReactNode`, rendered directly as JSX.

---

### `AdminDashboard.tsx` — Stat card icons
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/AdminDashboard.tsx)

`🆕 ⏳ ✅ ❌ 🎓` → `FilePlus Clock CheckCircle XCircle GraduationCap` at `size={28}`

---

### `FreshApplications.tsx` — LOI badges & button
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/FreshApplications.tsx)

- LOI badges: `✅/❌/⏳` → `CheckCircle/XCircle/Clock` at `size={14}`
- View LOI button: `📄` → `FileText` at `size={16}`
- Select options: emoji removed → plain text (browsers strip HTML in `<option>`)

---

### `InternDashboard.tsx` — Date, status, empty state
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/intern/InternDashboard.tsx)

- `📅` date → `Calendar size={14}`
- `✅ Today's report submitted` → `CheckCircle size={15}`
- `✅/⏳` status stat → `CheckCircle/Clock size={22}` with `aria-label`
- `📋` empty state → `ClipboardList size={48} strokeWidth={1.5}`

---

### `Profile.tsx` — Password button
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/intern/Profile.tsx)

`🔒` → `Lock size={15}` (button already had `aria-label`, so icon gets `aria-hidden="true"`)

---

### `ApplicationForm.tsx` — Success heading
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx)

`✅` → `CheckCircle size={28} color="#4caf50"`

---

### `index.css` — Global SVG alignment
render_diffs(file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/index.css)

```css
svg { vertical-align: middle; flex-shrink: 0; }
button svg:first-child, span svg:first-child, ... { margin-right: 5px; }
```

---

## Build Verification

```
npm run build → Exit code: 0
```
No TypeScript errors. Only unrelated Node.js deprecation warnings.

## Accessibility Pattern

| Icon type | Treatment |
|---|---|
| Decorative (next to visible text) | `aria-hidden="true"` |
| Semantic (standalone status) | `aria-label="Submitted"` / `aria-label="Pending"` |
| Inside already-labelled button | `aria-hidden="true"` (button has `aria-label`) |
