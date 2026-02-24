# Lucide Icon Replacement

Replace all emoji UI elements with crisp, accessible `lucide-react` SVG icons across the IMS frontend. Emojis render inconsistently across OS/browsers and lack proper accessibility semantics.

## Emoji → Lucide Mapping

| Emoji | Context | Lucide Icon |
|---|---|---|
| 📄 | Sidebar – Fresh | `FileText` |
| ⏳ | Sidebar/badges – Pending | `Clock` |
| ✅ | Sidebar/badges – Ongoing/Done | `CheckCircle` |
| ❌ | Sidebar/badges – Rejected | `XCircle` |
| 🎓 | Sidebar/stat – Completed | `GraduationCap` |
| 📊 | Sidebar – Intern Dashboard | `LayoutDashboard` |
| 👤 | Sidebar – Profile | `User` |
| 🆕 | Admin stat – Fresh count | `FilePlus` |
| 📋 | Empty state | `ClipboardList` |
| 📅 | Date label | `Calendar` |
| 🔒 | Change password button | `Lock` |
| 📄 | View LOI button | `FileText` |

## Proposed Changes

---

### Step 0 — Install `lucide-react`

```bash
cd ims-frontend-main
npm install lucide-react
```

No config changes needed — it's tree-shakeable and works with Create React App / Vite out of the box.

---

### Components

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/components/Sidebar.tsx)

Change `icon` from an emoji string to a **JSX React element** using Lucide, then render it directly.

```diff
+import { FileText, Clock, CheckCircle, XCircle, GraduationCap, LayoutDashboard, User } from 'lucide-react';

 const adminMenuItems = [
-  { path: '/admin/fresh',     label: 'NEW Fresh',           icon: '📄' },
-  { path: '/admin/pending',   label: 'Pending',             icon: '⏳' },
-  { path: '/admin/ongoing',   label: 'Approved & Ongoing',  icon: '✅' },
-  { path: '/admin/rejected',  label: 'Rejected',            icon: '❌' },
-  { path: '/admin/completed', label: 'Completed',           icon: '🎓' },
+  { path: '/admin/fresh',     label: 'NEW Fresh',           icon: <FileText       size={18} aria-hidden="true" /> },
+  { path: '/admin/pending',   label: 'Pending',             icon: <Clock          size={18} aria-hidden="true" /> },
+  { path: '/admin/ongoing',   label: 'Approved & Ongoing',  icon: <CheckCircle    size={18} aria-hidden="true" /> },
+  { path: '/admin/rejected',  label: 'Rejected',            icon: <XCircle        size={18} aria-hidden="true" /> },
+  { path: '/admin/completed', label: 'Completed',           icon: <GraduationCap  size={18} aria-hidden="true" /> },
 ];

 const internMenuItems = [
-  { path: '/intern/dashboard', label: 'Dashboard', icon: '📊' },
-  { path: '/intern/profile',   label: 'Profile',   icon: '👤' },
+  { path: '/intern/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} aria-hidden="true" /> },
+  { path: '/intern/profile',   label: 'Profile',   icon: <User            size={18} aria-hidden="true" /> },
 ];
```

The `icon` type changes from `string` to `React.ReactNode` & renders directly:
```diff
-<span className="sidebar-icon">{item.icon}</span>
+<span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
```

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/AdminDashboard.tsx)

```diff
+import { FilePlus, Clock, CheckCircle, XCircle, GraduationCap } from 'lucide-react';

-<div className="stat-icon">🆕</div>
+<div className="stat-icon"><FilePlus    size={28} aria-hidden="true" /></div>

-<div className="stat-icon">⏳</div>
+<div className="stat-icon"><Clock       size={28} aria-hidden="true" /></div>

-<div className="stat-icon">✅</div>
+<div className="stat-icon"><CheckCircle size={28} aria-hidden="true" /></div>

-<div className="stat-icon">❌</div>
+<div className="stat-icon"><XCircle     size={28} aria-hidden="true" /></div>

-<div className="stat-icon">🎓</div>
+<div className="stat-icon"><GraduationCap size={28} aria-hidden="true" /></div>
```

#### [MODIFY] [FreshApplications.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/FreshApplications.tsx)

```diff
+import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

 const getLoiBadge = (status?: string) => {
   switch (status) {
     case 'Verified':
-      return <span className="loi-badge verified">✅ LOI Verified</span>;
+      return <span className="loi-badge verified"><CheckCircle size={14} aria-hidden="true" /> LOI Verified</span>;
     case 'Rejected':
-      return <span className="loi-badge rejected">❌ LOI Rejected</span>;
+      return <span className="loi-badge rejected"><XCircle size={14} aria-hidden="true" /> LOI Rejected</span>;
     default:
-      return <span className="loi-badge pending">⏳ LOI Pending</span>;
+      return <span className="loi-badge pending"><Clock size={14} aria-hidden="true" /> LOI Pending</span>;
 }};

-<button className="view-loi-button">📄 View LOI Document</button>
+<button className="view-loi-button"><FileText size={16} aria-hidden="true" /> View LOI Document</button>

 {/* Plain text in <option> — no icons (browser strips HTML anyway) */}
-<option value="Pending">⏳ Pending</option>
-<option value="Verified">✅ Verified</option>
-<option value="Rejected">❌ Rejected</option>
+<option value="Pending">Pending</option>
+<option value="Verified">Verified</option>
+<option value="Rejected">Rejected</option>
```

> [!NOTE]
> `<option>` tags cannot render HTML/SVG — emojis are removed and replaced with plain text labels.

#### [MODIFY] [InternDashboard.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/intern/InternDashboard.tsx)

```diff
+import { Calendar, CheckCircle, Clock, ClipboardList } from 'lucide-react';

-<p className="dash-date">📅 {todayStr}</p>
+<p className="dash-date"><Calendar size={14} aria-hidden="true" /> {todayStr}</p>

-<div className="dash-submitted-badge">✅ Today's report submitted</div>
+<div className="dash-submitted-badge"><CheckCircle size={15} aria-hidden="true" /> Today's report submitted</div>

-{todayReportExists ? '✅' : '⏳'}
+{todayReportExists
+  ? <CheckCircle size={22} color="#2e7d32" aria-label="Submitted" />
+  : <Clock       size={22} color="#e65100" aria-label="Pending" />}

-<div className="dash-empty-icon">📋</div>
+<div className="dash-empty-icon"><ClipboardList size={48} strokeWidth={1.5} aria-hidden="true" /></div>
```

#### [MODIFY] [Profile.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/intern/Profile.tsx)

```diff
+import { Lock } from 'lucide-react';

-🔒 {showChangePassword ? 'Cancel Change Password' : 'Change Password'}
+<Lock size={15} aria-hidden="true" /> {showChangePassword ? 'Cancel Change Password' : 'Change Password'}
```

#### [MODIFY] [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx)

```diff
+import { CheckCircle } from 'lucide-react';

-<h2>✅ Application Submitted Successfully!</h2>
+<h2><CheckCircle size={28} color="#4caf50" aria-hidden="true" /> Application Submitted Successfully!</h2>
```

---

### CSS Adjustments

Lucide icons render as inline SVGs. Add these small rules to align icons with adjacent text in buttons and badges:

```css
/* global — in index.css or App.css */
.sidebar-icon svg,
.loi-badge svg,
.dash-date svg,
.dash-submitted-badge svg,
.change-password-toggle svg,
.view-loi-button svg,
.dash-empty-icon svg {
  vertical-align: middle;
  flex-shrink: 0;
}

/* Inline icon + text spacing */
button svg, span svg, p svg { margin-right: 5px; }
```

---

## Verification Plan

### Build Check
```bash
cd ims-frontend-main
npm run build
```
No TypeScript errors expected since `lucide-react` ships full type definitions.

### Visual Checklist
- [ ] Sidebar nav icons render at `18px`, are vertically centered with label text
- [ ] Admin dashboard stat cards show icon at `28px`, matching previous emoji size
- [ ] LOI badges (`✅/❌/⏳`) render with icon + text properly vertically aligned
- [ ] Intern dashboard empty state shows `ClipboardList` at `48px`  
- [ ] `📅` date is replaced inline with `Calendar` icon
- [ ] Password toggle button shows `Lock` icon before text
- [ ] Application success page shows `CheckCircle` before heading

### Accessibility Checklist
- [ ] Decorative icons have `aria-hidden="true"` → screen readers skip them
- [ ] Status icons with semantic meaning (`CheckCircle`/`Clock` in stat card) have `aria-label`
- [ ] `<option>` elements use plain text labels (no icon)
- [ ] Run axe DevTools — no new violations introduced
