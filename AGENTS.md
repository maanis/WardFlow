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
- WardFlow rules live as pure functions in `src/lib/wardflow/logic.ts` (permission-checked mutations); UI calls them via `useWard().run` so role permissions are enforced in handlers, not just hidden buttons.
- Data persists to browser localStorage only (no backend), loaded in `useEffect` to avoid SSR hydration mismatch.
- Routing uses TanStack Router file routes (the platform's fixed router), not react-router-dom.
