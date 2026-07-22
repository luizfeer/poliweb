---
name: carmo-local-design
description: Use this skill to generate well-branded interfaces and assets for Carmo Local (Portal Hiperlocal de Carmo do Rio Claro/MG), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the Amazon-style hyperlocal city app.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `ui_kits/app/`, `preview/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Use the components in `ui_kits/app/components.jsx` and `ui_kits/app/screens.jsx` as references.

If working on production code (the `luizfeer/hail-mary` Next.js app), copy the design tokens from `colors_and_type.css` into the Tailwind v4 theme and read the rules in README.md to become an expert in designing with this brand.

Tone is PT-BR, "você", interior mineiro, sentence case. Visual is dense Amazon-style mobile with terracotta primary, cerrado green secondary, Fraunces display + Inter body. Lucide icons. No emoji in structural UI.

If the user invokes this skill without any other guidance, ask them what they want to build or design (slide, screen, banner, full prototype?), ask some questions about audience and layer (público, turismo, comércio, transparência, comunidade), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
