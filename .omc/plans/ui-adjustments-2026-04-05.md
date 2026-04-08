# Plan: Noble Language Academy UI Adjustments

**Date:** 2026-04-05
**Status:** Draft
**Scope:** Frontend only (`/frontend`)

---

## Requirements Summary

6 UI/UX adjustments to the Noble Cert frontend homepage:

1. Convert testimonial/success section from video embed to text + person image
2. Remove i18n for Chinese (zh) and Japanese (ja) — keep only English (en) and Vietnamese (vi)
3. Rename site title from "Noble Cert" → "Noble Language Academy"
4. Shrink logo, move to header corner, link to homepage (remove large center hero logo)
5. Add new "Partners" section with logo grid (concept from reference image)
6. Unify fonts to 1-2 consistent font families across the site

---

## Acceptance Criteria

| # | Criterion | Testable? |
|---|-----------|-----------|
| 1a | Testimonial section shows text quote + person image (no video/iframe) | Yes — no `<iframe>` or YouTube references in rendered HTML |
| 1b | TestimonialVideo component removed or replaced | Yes — file deleted or refactored |
| 2a | Only `vi` and `en` locales remain in `lib/i18n.tsx` | Yes — type union is `"vi" \| "en"` |
| 2b | `locales/zh.ts` and `locales/ja.ts` deleted | Yes — files don't exist |
| 2c | Language switcher shows only 2 options | Yes — UI renders 2 language choices |
| 3a | `<title>` reads "Noble Language Academy - ..." | Yes — check `layout.tsx` metadata |
| 3b | Header text reads "Noble Language Academy" | Yes — check `header.tsx` |
| 3c | Footer text reads "Noble Language Academy" | Yes — check `footer.tsx` |
| 4a | Logo in header is small (w-8 h-8 or similar) and links to `/` | Yes — already present, verify |
| 4b | Large center logo removed from hero orbit section | Yes — no 132x132 logo in hero |
| 5a | New "Partners" section exists on homepage | Yes — section visible in DOM |
| 5b | Partners section shows logo grid (2 rows, responsive) | Yes — grid layout with partner logos |
| 5c | Section has heading like "Trusted by" / "Đối tác" | Yes — text present |
| 6a | Only Be Vietnam Pro and Merriweather used (no ad-hoc font overrides) | Yes — grep for font-family |
| 6b | Consistent heading = serif, body = sans pattern | Yes — visual audit |

---

## Implementation Steps

### Task 1: Convert Testimonial Section to Text + Image

**Files to modify:**
- `frontend/app/(public)/page.tsx` (lines 344-374) — testimonial section
- `frontend/components/landing/TestimonialVideo.tsx` — delete this file

**Changes:**
1. Remove `TestimonialVideo` import from `page.tsx`
2. Replace the right-side video column with a person image (use Next.js `Image`)
3. Restructure left column: larger quote text, student name, credential, short success story paragraph
4. Add 2-3 more testimonial cards (text + avatar) in a grid or carousel layout
5. Delete `TestimonialVideo.tsx` component file
6. Optionally: can keep `react-youtube` and `react-player` deps for future use or remove them

**Layout concept:**
```
┌─────────────────────────────────────────────┐
│         Câu chuyện Thành công                │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Avatar   │  │  Avatar   │  │  Avatar   │ │
│  │  Name     │  │  Name     │  │  Name     │ │
│  │  Score    │  │  Score    │  │  Score    │ │
│  │  "Quote"  │  │  "Quote"  │  │  "Quote"  │ │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

---

### Task 2: Simplify i18n (Remove zh, ja)

**Files to modify:**
- `frontend/lib/i18n.tsx` — remove zh/ja from locale types, switch cases, and supported list
- `frontend/locales/zh.ts` — **delete**
- `frontend/locales/ja.ts` — **delete**
- `frontend/locales/en.ts` — keep
- `frontend/locales/vi.ts` — keep
- `frontend/components/layout/header.tsx` — update language switcher dropdown to show only VI/EN

**Changes:**
1. In `lib/i18n.tsx`:
   - Update `Locale` type from `"vi" | "en" | "zh" | "ja"` to `"vi" | "en"`
   - Remove `zh` and `ja` cases from the translation loader switch
   - Remove zh/ja from `supportedLocales` array
2. Delete `locales/zh.ts` and `locales/ja.ts`
3. In header language switcher: remove Chinese and Japanese options from dropdown
4. Verify `en.ts` and `vi.ts` translation files are complete and cover all keys

---

### Task 3: Rename Title to "Noble Language Academy"

**Files to modify:**
- `frontend/app/layout.tsx` (lines 21-70) — metadata object
- `frontend/components/layout/header.tsx` (lines 110-123) — header brand text
- `frontend/components/layout/footer.tsx` (lines 16-17) — footer brand text
- `frontend/locales/vi.ts` — update any "Noble Cert" references in translations
- `frontend/locales/en.ts` — update any "Noble Cert" references in translations

**Changes:**
1. In `layout.tsx` metadata:
   - `title.default`: "Noble Language Academy - Hệ thống chứng chỉ ngôn ngữ chuyên nghiệp"
   - `title.template`: "%s | Noble Language Academy"
   - Update `description`, `creator`, `openGraph`, `twitter` metadata
   - Update `keywords` to include "Noble Language Academy"
2. In `header.tsx`: Change brand text from "Noble Cert" to "Noble Language Academy"
3. In `footer.tsx`: Change brand text from "Noble Cert" to "Noble Language Academy"
4. In locale files: Update footer tagline and any "Noble Cert" string references

---

### Task 4: Adjust Logo Placement

**Files to modify:**
- `frontend/app/(public)/page.tsx` (lines 180-189) — hero center logo
- `frontend/components/layout/header.tsx` — verify logo is small and links to `/`

**Changes:**
1. **Header logo** (already correct): Verify w-8 h-8 logo in header links to `/` — should already be the case
2. **Remove hero center logo**: In `page.tsx` hero orbit section, remove the large 132x132 center logo
   - Replace center of orbit with a decorative element or leave the orbit animation without center piece
   - Or simplify the orbit visual entirely
3. Ensure header logo acts as homepage link (already `<Link href="/">`)

---

### Task 5: Add Partners Section

**New file:**
- `frontend/components/landing/PartnersSection.tsx` — new component

**Files to modify:**
- `frontend/app/(public)/page.tsx` — add PartnersSection import and placement
- `frontend/public/partners/` — add partner logo images

**Changes:**
1. Create `PartnersSection.tsx` component:
   - Heading: "Được đánh giá tốt từ các đơn vị uy tín" / "Trusted Partners"
   - Subheading: "Đối tác của Noble Language Academy"
   - Logo grid: 2 rows, 4 columns on desktop, 2 columns on mobile
   - Each logo: grayscale by default, color on hover (optional effect)
   - Responsive layout matching reference image concept
2. Add partner logo images to `public/partners/` directory
   - User will need to provide actual partner logo files
   - Use placeholder images initially if logos not available
3. Place section on homepage (suggested position: after Value Proposition, before Blog)

**Layout (from reference image):**
```
┌──────────────────────────────────────────────┐
│     Được đánh giá tốt từ các đơn vị uy tín   │
│        Đối tác của Noble Language Academy      │
│                                                │
│   [Logo1]   [Logo2]   [Logo3]   [Logo4]       │
│                                                │
│       [Logo5]     [Logo6]     [Logo7]          │
└──────────────────────────────────────────────┘
```

---

### Task 6: Unify Fonts

**Files to audit:**
- `frontend/app/layout.tsx` — font imports (already good: Be Vietnam Pro + Merriweather)
- `frontend/app/globals.css` — font variable definitions
- `frontend/app/(public)/page.tsx` — check for ad-hoc font classes
- All components — grep for `font-` classes to ensure consistency

**Changes:**
1. **Establish font rules:**
   - `font-sans` (Be Vietnam Pro): Body text, paragraphs, UI elements, buttons, labels
   - `font-serif` (Merriweather): Section headings, brand name, hero title, testimonial quotes
2. Audit all components for inconsistent font usage:
   - Remove any inline `font-family` styles
   - Replace ad-hoc font classes with `font-sans` or `font-serif`
3. Ensure `globals.css` font fallbacks are correct (already set)
4. No new fonts needed — current 2-font system (Be Vietnam Pro + Merriweather) is solid

---

## Implementation Order

| Phase | Tasks | Dependencies | Est. Complexity |
|-------|-------|-------------|-----------------|
| 1 | Task 3 (Rename title) | None | Low |
| 1 | Task 2 (Simplify i18n) | None | Low |
| 1 | Task 6 (Unify fonts) | None | Low |
| 2 | Task 4 (Logo adjustment) | None | Low |
| 2 | Task 1 (Testimonial rework) | None | Medium |
| 2 | Task 5 (Partners section) | Need partner logos | Medium |

**Phase 1** tasks are independent and can run in parallel.
**Phase 2** tasks modify `page.tsx` and should be done sequentially to avoid conflicts.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Partner logos not provided | Partners section incomplete | Use placeholder images with descriptive alt text; user provides real logos later |
| Hardcoded Vietnamese text in page.tsx not in locale files | Some text won't translate to EN | Audit all hardcoded strings and move to locale files during implementation |
| Removing hero center logo breaks orbit animation | Visual regression | Adjust orbit CSS to work without center element, or replace with decorative icon |
| i18n removal may leave orphan references to zh/ja | Runtime errors | Grep entire codebase for "zh", "ja", locale references before deleting |

---

## Verification Steps

1. **Visual check**: Homepage renders all 6 sections correctly (Hero, Stats, Courses, Value Props, Partners, Blog, Testimonials)
2. **Title check**: Browser tab shows "Noble Language Academy - ..."
3. **Language switcher**: Only VI and EN options visible; switching works correctly
4. **Logo**: Small in header corner, links to `/`; no large center logo in hero
5. **Partners section**: Grid displays properly on desktop and mobile
6. **Fonts**: No font inconsistencies — headings use serif, body uses sans
7. **No regressions**: Dark mode still works, responsive layout intact, no console errors
8. **Build passes**: `pnpm build` succeeds with no errors
