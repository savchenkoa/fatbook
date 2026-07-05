/**
 * Fatbook mobile design tokens — single source of truth.
 *
 * Values were extracted from the existing screens (MealCard, NutritionSummary,
 * MacroGauge, AppText) so the token names describe what is already on screen.
 * Never hardcode a hex/spacing literal in a component — import from here.
 *
 * Plain object (not a hook) so it works in StyleSheet.create at module scope.
 */

/** Raw palette — do not use directly in components; use `colors` semantic roles. */
const palette = {
    white: "#FFFFFF",
    gray900: "#111827",
    gray700: "#374151",
    gray500: "#6B7280",
    gray400: "#9CA3AF",
    gray200: "#E5E7EB",
    gray100: "#F3F4F6",
    gray50: "#F5F5F5",
    green: "#35E400", // brand accent (from Figma button)
    greenDark: "#2EC800", // pressed state (~12% darker)
    red500: "#EF4444",
    // Macro accents (from Figma)
    blue: "#5EDCFF",
    amber: "#FFCC3F",
    teal: "#00DFBA",
} as const;

export const colors = {
    /** Primary brand action + progress fill. */
    brand: palette.green,
    /** Pressed/active brand state. */
    brandPressed: palette.greenDark,
    /** Foreground on top of brand surfaces. */
    onBrand: palette.white,

    /** Destructive/irreversible actions (Delete). Must never be brand-green. */
    destructive: palette.red500,
    onDestructive: palette.white,

    text: {
        /** Headings, values, primary content. */
        primary: palette.gray900,
        /** Emphasised inline value inside secondary text. */
        strong: palette.gray700,
        /** Labels, secondary content, icons. */
        secondary: palette.gray500,
        /** De-emphasised: goals, placeholders, "/ 2560 kcal". */
        muted: palette.gray400,
        /** Text on brand/dark surfaces. */
        inverse: palette.white,
    },

    surface: {
        /** App background behind cards. */
        screen: palette.gray50,
        /** Cards, sheets, dialogs. */
        card: palette.white,
        /** Chips, icon circles, inputs, secondary buttons. */
        subtle: palette.gray100,
        /** Progress tracks, hairline fills. */
        track: palette.gray200,
    },

    /** Hairline borders / dividers. */
    border: palette.gray200,

    /** Protein / Fat / Carbs accent colors — used everywhere macros appear. */
    macro: {
        protein: palette.blue,
        fat: palette.amber,
        carbs: palette.teal,
    },
} as const;

/** 4-based spacing scale. Use role or number; do not invent off-scale values. */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
} as const;

/** Corner radii. `card` = outer container, `control` = buttons/inputs, `pill` = chips. */
export const radius = {
    control: 8,
    md: 16,
    lg: 20,
    card: 32,
    pill: 32,
    full: 999,
} as const;

/** Rubik weights — must match the families loaded in App.tsx / AppText. */
export const fontWeight = {
    regular: "regular",
    medium: "medium",
    bold: "bold",
    extrabold: "extrabold",
} as const;

/**
 * Semantic type styles. Pair `size`/`lineHeight` with `weight` when calling
 * <AppText weight={...}>. Sizes trace directly to current screens.
 */
export const typography = {
    /** Hero calorie number on Home. */
    hero: { size: 80, lineHeight: 80, weight: fontWeight.extrabold },
    /** Screen/section title, meal name. */
    title: { size: 23, lineHeight: 28, weight: fontWeight.bold },
    /** Gauge value, emphasised numbers. */
    subtitle: { size: 17, lineHeight: 22, weight: fontWeight.medium },
    /** Default body / kcal goal line. */
    body: { size: 16, lineHeight: 22, weight: fontWeight.regular },
    /** Row secondary line, small kcal text. */
    label: { size: 13, lineHeight: 18, weight: fontWeight.regular },
    /** Chip text, gauge labels/goals. */
    caption: { size: 12, lineHeight: 16, weight: fontWeight.regular },
    /** Smallest supporting text. */
    micro: { size: 11, lineHeight: 14, weight: fontWeight.regular },
} as const;

/** Card/sheet elevation. Matches the soft shadow already used on cards. */
export const elevation = {
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
} as const;

export const theme = { colors, spacing, radius, typography, fontWeight, elevation } as const;
export type Theme = typeof theme;
