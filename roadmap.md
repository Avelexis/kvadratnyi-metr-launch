# Website delivery
- [x] Build bilingual single-page store website with all approved sections.
- [x] Build honest disconnected contact and assistant interfaces.
- [x] Verify language, navigation, forms and seven viewport widths.

# Targeted refinements
- [x] Audit and refine navigation, hero calls to action, readable controls and assistant placement.
- [x] Add product/quantity/consent enquiry fields and bilingual privacy page without fake submission.
- [x] Add clearly illustrative gallery and language-aware metadata.
- [x] Verify six viewport widths, navigation, language, consent and enquiry outcomes.

# ElevenLabs voice assistant
- [x] Link ElevenLabs connector; API key server-side only.
- [x] Server function mints WebRTC token + WebSocket signed URL for agent_1701m52xk1jde2fbyhkrcvgez4hs.
- [x] Rebuild assistant panel on @elevenlabs/react: voice start/end, mic permission, connecting/listening/speaking/error states, single session, cleanup, live text chat.
- [x] Verify live: key initially lacked convai_write (user fixed); WebRTC blocked in sandbox → automatic WebSocket fallback connected; agent "Аліса" answered in Ukrainian; text chat, end session and Escape close verified.

# Remaining integrations
- [ ] Contact form: needs a delivery service and recipient address; owner must confirm data controller, recipient, retention and data-rights contact before enabling submissions.

- [x] Product catalog database, /catalog page, assistant searchCatalog tool (demo rows hidden)
- [ ] Admin catalog screen — blocked: needs sign-in and an admin account
- [x] ElevenLabs Server Tool webhook: POST /api/public/search-catalog (shared-secret header, zod validation, reuses searchForAssistant; verified live — cement query returns 266.11 UAH indicative)
- [ ] ElevenLabs dashboard setup — owner action: add Server Tool "searchCatalog" (URL, x-catalog-secret header, query schema) + agent instructions to call it before price answers
