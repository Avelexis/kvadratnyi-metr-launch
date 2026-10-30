<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Keep the store as one scrolling index route with hash navigation because the approved brief explicitly requests a single scrolling landing page.
- Centralize both languages and verified store facts in the browser-safe store-content module to keep translation and factual claims consistent.
- Keep assistant controls disconnected behind a separate Radix dialog until an ElevenLabs session integration is configured and tested; do not fake responses or voice activity.
- Keep enquiry submission local and explicitly unavailable until a real submission service is connected; validation must never imply delivery.
- Load language preference after hydration and persist only user language choices to avoid server/client rendering mismatches.
- Share hydration-safe language and client metadata updates through usePageLanguage on content routes; omit canonical until a real published domain is configured.
- Validate enquiries in the shared enquiry module; require name, phone, product/category and consent while keeping quantity/comments optional.
- Keep the privacy route factual about the current disconnected services and require owner policy approval before enabling data collection.
- Hide the assistant launcher while contacts are visible so it cannot obscure inquiry controls.
- The public catalog page relies on row-level rules (active, non-demo, current prices only); the assistant lookup reads the full internal catalog server-side and labels demo prices as indicative, with all price/stock rules in src/lib/catalog.ts so verified and demo prices stay distinguishable.
- The assistant reads the catalog only through the searchCatalog client tool backed by a public read-only server function, never raw SQL.
