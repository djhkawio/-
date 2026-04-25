# AI Ad Creative Generator (Financial Education)

Senior-creative-style ad generator for mobile-first financial education campaigns.

## 4-Layer Generation Pipeline
1. **Strategy Layer**: country, audience age, campaign goal, trust/compliance boundaries
2. **Copy Layer**: localized persuasive hooks/subheads/benefits/CTA (not raw topic filling)
3. **Design Layer**: layout + visual direction mapping (8 templates)
4. **Self-check Layer**: quality scoring and auto-rewrite for weak concepts

## Core Features
- 1254x1254 premium posters (mobile-first)
- 5 distinct concept batch generation
- Argentina-first localization (voseo tone: *querés, aprendé, entendé, empezá*)
- Creative Remix from reference image
- CSV performance import + scoring + weight updates
- Like/Reject preference learning
- Public trend scanner (reference only)
- Structured concept JSON output for renderer

## APIs
- `POST /api/analyze-image`
- `POST /api/trend-scan`
- `POST /api/generate-concepts`

## Important Safety Rules
- Educational framing only
- No guaranteed returns / wealth claims
- No specific firms / CFA / portfolio manager
- No aggressive download CTA
- Disclaimer always included:
  `Educational content only. Not financial advice. Results are not guaranteed.`

## Project Structure
- `app/page.tsx` main UI
- `components/PosterCanvas.tsx` render + export PNG
- `lib/poster.ts` strategy+copy+design+self-check orchestration
- `lib/countryStrategy.ts` country language/culture/compliance hints
- `lib/performanceLearning.ts` CSV learning engine
- `prompts/*` prompt architecture
- `schemas/concept.schema.json` concept contract
- `data/argentina.seed.json` market seed
- `data/userProfile.json` default creative director profile
- `examples/output.config.json` output example

## Run
```bash
npm install
npm run dev
```
