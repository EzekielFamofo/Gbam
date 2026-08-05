import { KeyRound } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsAuthPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <KeyRound className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Sign in & auth</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        GBAM uses a browser-linked login flow instead of asking you to manage API keys in the
        terminal. When you run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/login</code>,
        the CLI opens your browser, the website continues the auth flow, and control is handed
        back to the terminal when sign-in completes.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">How the flow works</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>The CLI starts a temporary localhost callback server.</li>
            <li>The browser opens to the GBAM web experience.</li>
            <li>The website and auth provider complete identity verification.</li>
            <li>The server redirects back to the local CLI callback.</li>
            <li>The CLI stores the returned bearer token locally.</li>
          </ol>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Local credential storage</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Auth state is stored on your machine in
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">~/.gbam/auth.json</code>
            with owner-only permissions where supported. If the server later returns 401,
            the CLI clears local auth and asks you to sign in again.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}