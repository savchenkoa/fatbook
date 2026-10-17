# Domain Docs

This repo uses **single-context** domain documentation: one `GLOSSARY.md` and
`docs/adr/` at the repo root, shared by the web app, mobile app, and packages.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root for domain vocabulary.
- **`docs/adr/`** for decisions relevant to the area you're about to work in.

If these files don't exist, proceed silently. Don't flag their absence or suggest
creating them upfront. The `domain-modeling` skill creates them lazily when
terms or decisions actually get resolved.

## Use the glossary's vocabulary

When naming a domain concept in an issue, refactor proposal, hypothesis, or test,
use the term defined in `GLOSSARY.md`. Avoid synonyms the glossary rejects.

If a concept is missing, reconsider whether you're inventing language the project
doesn't use. If there is a real gap, note it for `domain-modeling`.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, name the ADR and explain why the
decision should be reconsidered instead of silently overriding it.
