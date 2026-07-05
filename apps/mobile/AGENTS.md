# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Design system

Any UI work must follow `DESIGN_SYSTEM.md`. Import every color, spacing, radius,
and font size from `src/theme` (relative path, e.g. `../theme` — this app has no
`@/` alias) — never hardcode hex/px/size literals.
Choose colors by role (`colors.destructive` for delete, `colors.brand` for the
primary CTA), and reuse the documented components (`Button`, `Sheet`/
`EditValueSheet`, `MacroRow`, `Card`, `ListItem`) instead of building bespoke
variants inline.
