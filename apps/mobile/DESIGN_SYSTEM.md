# Fatbook Mobile — Design System

Source of truth for the Expo/React Native app UI. Written for an AI agent to implement against.

**Golden rule:** every color, spacing, radius, and text size comes from
`src/theme/tokens.ts`. Never hardcode a hex, a pixel radius, or a font size in a
component. If a value you need isn't in the tokens, add it to the tokens first,
then use it.

Import from the `src/theme` module with a relative path (this app has no `@/`
alias — only `@fatbook/*`). From `src/components/*`:

```ts
import { colors, spacing, radius, typography, elevation } from "../theme";
```

---

## 1. Foundations

### 1.1 Color roles

Pick a token by **meaning**, not by how it looks.

| Role | Token | When to use |
|------|-------|-------------|
| Brand / primary action | `colors.brand` | Main CTA (`Add dishes`, `Save`), progress fill |
| Brand pressed | `colors.brandPressed` | Pressed state of a brand button |
| On brand | `colors.onBrand` | Text/icon on a brand surface |
| Destructive | `colors.destructive` | **Delete** and other irreversible actions — never brand-green |
| On destructive | `colors.onDestructive` | Text/icon on a destructive surface |
| Text primary | `colors.text.primary` | Headings, values, primary content |
| Text strong | `colors.text.strong` | Emphasised value inside a secondary line |
| Text secondary | `colors.text.secondary` | Labels, secondary content, icons |
| Text muted | `colors.text.muted` | Goals, placeholders, `/ 2560 kcal` |
| Screen bg | `colors.surface.screen` | Root screen background |
| Card | `colors.surface.card` | Cards, sheets, dialogs |
| Subtle | `colors.surface.subtle` | Chips, icon circles, inputs, secondary buttons |
| Track | `colors.surface.track` | Progress track, hairline fills |
| Border | `colors.border` | Dividers, hairlines |
| Macro protein | `colors.macro.protein` | Anywhere protein appears |
| Macro fat | `colors.macro.fat` | Anywhere fat appears |
| Macro carbs | `colors.macro.carbs` | Anywhere carbs appears |

**One green.** Brand-green is one token used for CTAs and progress only. It is
not the color of Delete, not the color of every icon, not text color. This
directly fixes the "green is overloaded" finding (FAT-74 #4).

### 1.2 Spacing

`spacing.xs|sm|md|lg|xl|2xl|3xl` = `4 8 12 16 20 24 32`. Screen horizontal
padding is `spacing.lg` (16). Never use an off-scale value.

### 1.3 Radius

`radius.control` (8) inputs / small controls · `radius.md` (16) buttons ·
`radius.lg` (20) · `radius.card`/`radius.pill` (32) outer cards & chips ·
`radius.full` circles.
Stacked cards use the "outer corners rounded 32, inner corners 8" pattern (see
`MealCard` `isFirst`/`isLast`).

### 1.4 Typography

Font is **Rubik** via `<AppText weight="regular|medium|bold|extrabold">`. Use a
semantic style from `typography`:

| Style | Size | Use |
|-------|------|-----|
| `hero` | 80 | Home calorie number |
| `title` | 23 | Screen title, meal name |
| `subtitle` | 17 | Gauge value, emphasised numbers |
| `body` | 16 | Default body, kcal goal line |
| `label` | 13 | Row secondary line |
| `caption` | 12 | Chip text, gauge labels |
| `micro` | 11 | Smallest supporting text |

Always render text through `AppText`, never RN `<Text>` directly (keeps the
Rubik family consistent).

---

## 2. Components

Each component below is a **closed set** of variants and states. Implement the
listed variants; do not invent new ones inline. Files live in `src/components/`.

### 2.1 Button — ✅ built (`components/Button.tsx`)

Primary interactive control. Replaces ad-hoc `TouchableOpacity` + styled `View`.

- **Variants:** `primary` (brand fill) · `secondary` (subtle fill, primary text) · `destructive` (red fill) · `ghost` (transparent, brand text).
- **Sizes:** `lg` (h48, full-width CTA — bottom action bars) · `md` (h40, default) · `sm` (h32). Radius is `radius.md` (16) to match the Figma CTA.
- **States:** built-in `pressed` (uses `brandPressed`), `disabled` (opacity 0.5), `loading` (spinner, non-pressable).
- **Required props:** `title`, `onPress`, `variant` (no default — force an explicit choice). Optional: `size`, `disabled`, `loading`, `fullWidth`, `style`.

Rules:
- `Delete` → `variant="destructive"`. Confirmation dialog's confirm button too.
- `Save` / `Add …` / `Clone` → `variant="primary"`.
- `Cancel` → `variant="secondary"` or `ghost`.

```tsx
<Button title="Delete" variant="destructive" onPress={onDelete} />
<Button title="Add dishes" variant="primary" size="lg" onPress={onAdd} />
```

### 2.2 Card — ✅ built (`components/Card.tsx`)

Content container on `surface.screen`.

- **Props:** `children`, optional `position` (`single | first | middle | last`) for stacked lists, `onPress` (makes it pressable), `style`.
- Background `surface.card`, radius per `position` (32 outer / 8 inner), `elevation.card`, padding `spacing.lg`.
- No color variants — a card is always a card. Status is shown by its content, not by tinting the card.

### 2.3 Sheet (bottom sheet) — replaces the modal zoo

**One** component for all inline edits and menus. Fixes the "three different
modals" finding (FAT-74 #2). No more center-dialog-of-random-size.

- **Variants:** `form` (title + fields + Cancel/Save footer) · `menu` (list of actions) · `confirm` (title + message + Cancel/confirm).
- Anchored to the bottom, `surface.card`, top corners `radius.card`, grabber handle, safe-area padding.
- **`EditValueSheet`** (built on `form`): single numeric field. Use it for
  `Serving size`, `Calories`, `Cooked weight`, portion grams — anything that is
  "edit one number". Props: `title`, `value`, `unit`, `onSave`, `onCancel`.
- **`ConfirmSheet`** (`confirm`): props `title`, `message`, `confirmLabel`,
  `destructive?` (routes confirm button to `destructive` variant), `onConfirm`,
  `onCancel`. Delete uses `destructive`.

```tsx
<EditValueSheet title="Serving size" value={238} unit="g" onSave={save} onCancel={close} />
<ConfirmSheet title="Delete dish" message="Are you sure you want to delete this dish?"
  confirmLabel="Delete" destructive onConfirm={del} onCancel={close} />
```

### 2.4 MacroRow — ✅ built (`components/MacroRow.tsx`)

The one compact P/F/C format for list rows, cards, and meal contents. Fixes the
"three BJU formats" finding (FAT-74 #1). Retires the rogue emoji format
(`⚡🥩🧈🍚`) that wasn't in Figma at all.

- Figma layout `P: 23 g  F: 6 g  C: 7 g`, but each letter (`P`/`F`/`C`) is tinted
  in its `colors.macro.*` color so the color code is present in lists, not just
  in rings/tiles. Values in `colors.text.secondary`.
- Macros are never rendered with emoji or as one flat gray blob.
- Calories are **separate** (not a macro): render them on their own line,
  `colors.text.secondary`, e.g. `180 kcal` or `180 kcal, 238 g`.

```tsx
<AppText style={caloriesStyle}>{kcal} kcal</AppText>
<MacroRow proteins={23} fats={6} carbs={7} />
```

The colored-hero treatment on the Dish detail screen (big `colors.macro.*`
circles + `40 g / Protein`) is a **distinct** component (macro tiles), not
MacroRow — different context (detail hero vs list row). Don't force one into the
other.

### 2.5 ListItem

Row used in Dishes / ingredients / meal contents.

- **Structure:** title (`title`/`body` weight medium) + secondary line (`kcal, weight` in `text.secondary`) + `MacroRow` + trailing affordance.
- **Trailing:** `chevron` (navigate) or `plus` (add). One rule app-wide: `plus` when the target is empty/addable, `chevron` when it has content and navigates. Fixes the inconsistent `+`/`>` finding.
- **Props:** `title`, `subtitle`, `macros?`, `trailing` (`chevron | plus | none`), `onPress`.

---

## 3. Rules & anti-patterns

Do:
- ✅ Import every visual value from `@/theme`.
- ✅ Choose color by role (`destructive` for delete), not by appearance.
- ✅ Route all text through `AppText`; all number edits through `EditValueSheet`.
- ✅ Reuse `MacroRow` for any macro display.

Don't:
- ❌ Hardcode a hex, radius, or font size in a component.
- ❌ Make a destructive action brand-green.
- ❌ Build a new bespoke modal/dialog — use `Sheet`.
- ❌ Render macros in plain gray or with emoji.
- ❌ Use raw `<Text>` or off-scale spacing.

---

## 4. Coverage map

Status of every screen. When you touch one, migrate its inline styles to tokens
+ the components above rather than matching the old hardcoded values.

| Screen | Design language | In Figma | Action |
|--------|-----------------|----------|--------|
| `DiaryScreen` (Home) | Figma (new) | ✅ | migrate to components |
| `MealDetailScreen` | Figma (new) | ✅ | migrate |
| `DishDetailScreen` | Figma (new) | ✅ | migrate |
| `DishesListScreen` | Figma (new) | ✅ | migrate + dedup / sections / empty state |
| `AddEatingScreen` | built, unverified | ❌ | needs design (compose from §2 + UX best practices) |
| `AddIngredientsScreen` | built, unverified | ❌ | needs design |
| `EditDishScreen` | built, unverified | ❌ | needs design |
| `LoginScreen` | built, unverified | ❌ | needs design |
| `AccountScreen` | **legacy web** | ❌ | needs design |
| `GoalsScreen` | **legacy web** | ❌ | needs design |
| `Insights` tab | **placeholder** (`App.tsx`) | ❌ | design from scratch (legacy = trend charts) |

Only the four screens marked ✅ have an approved Figma design. Everything else
(**needs design**) must be designed from scratch as a composition of the
components in §2 + UX best practices — not ported from `../web/src/features/`.
The web app is a **different visual language** (teal primary, emoji macros); use
it for *behavior/data* reference only, never colors/layout.

Legacy sources for missing pages:
- Trends/Insights → `../web/src/features/insights/` (`daily-trend-chart`, `food-value-diff`, `time-span-select`)
- Profile/settings → `../web/src/features/account/`

Migrated to tokens: `App.tsx` tab bar, `MacroGauge`, `MealCard`,
`NutritionSummary`. Remaining screens still hold inline styles — migrate on
touch.

Open follow-ups tracked in **FAT-74** (design audit).
