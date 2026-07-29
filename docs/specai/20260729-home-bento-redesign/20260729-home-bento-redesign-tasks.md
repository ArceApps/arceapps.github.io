# Home Page Bento Grid Redesign Task Checklist

- [ ] **Task 1: Add i18n Translation Keys**
  - [ ] Add `home.bento.*` keys to `src/i18n/ui.ts` for English and Spanish.
  - [ ] Verify TypeScript compilation of `ui.ts`.

- [ ] **Task 2: Build Layout & Container Components**
  - [ ] Create `src/components/bento/BentoGrid.astro`.
  - [ ] Create `src/components/bento/BentoCard.astro` with hover elevation `-translate-y-2` and shadow transitions.

- [ ] **Task 3: Build Specialty Bento Cards**
  - [ ] Create `src/components/bento/BentoHeroCard.astro` (Developer Intro + Status Badge).
  - [ ] Create `src/components/bento/BentoFeaturedWorkCard.astro` (Featured App/Project highlight).
  - [ ] Create `src/components/bento/BentoDevlogCard.astro` (Building in Public + Pulsing Live Dot).
  - [ ] Create `src/components/bento/BentoTechStackCard.astro` (Interactive Technology Badges).
  - [ ] Create `src/components/bento/BentoQuickLinksCard.astro` (GitHub & Play Store CTAs).

- [ ] **Task 4: Integrate Bento Grid into HomePage.astro**
  - [ ] Replace old Hero component in `src/components/pages/HomePage.astro` with new Bento Grid.
  - [ ] Ensure `lang` prop (`en` / `es`) flows correctly into all subcomponents.

- [ ] **Task 5: Verification & Build Check**
  - [ ] Run `pnpm build`.
  - [ ] Update `20260729-home-bento-redesign-verify.md` with pass status.
