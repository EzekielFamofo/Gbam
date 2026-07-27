# AGENTS.md

## Project context
- This is a Bun monorepo for Gbam.
- Main app areas are `packages/cli`, `packages/server`, `packages/shared`, and `packages/web`.
- The CLI is the main user-facing tool: a terminal chat app for working with AI conversations and project context.
- The most important architectural boundary is that the **CLI has access to the user's local project**, while the **server owns API orchestration, persistence, auth, and model execution**.

## Package responsibilities

### `packages/cli`
- Hosts the terminal UI and the interactive chat experience.
- Starts and reopens sessions, chooses mode/agent behavior, and selects models.
- Stores local auth state and attaches bearer tokens to API requests.
- Has the only real access to the user's filesystem and shell for agent tool execution.
- Reads the repo's `AGENTS.md` from the user's project and forwards that context to the server with chat requests.

### `packages/server`
- Bun + Hono API for chat, sessions, auth callback handling, billing, dashboard data, and credit enforcement.
- Owns persistence of conversation state and session metadata.
- Builds the system prompt used for each model call.
- Validates chat payloads and mode/model/tool compatibility.
- Streams model output back to the CLI.
- Production API is exposed at `https://api.gbam.dev`; this is the server the CLI and web app target by default in production. That production server is hosted on **Railway**.

### `packages/shared`
- Holds the shared contracts that keep CLI and server in sync.
- Important shared definitions include:
  - mode/schema definitions
  - tool input schemas and tool contract generation
  - supported model metadata
  - conversation compaction helpers
- If a chat payload, tool shape, or mode behavior needs to match on both sides, it probably belongs here.

### `packages/web`
- Browser app for dashboard/account flows.
- Participates in CLI login by initiating the browser-based auth flow before handing control back to the API callback.
- Also uses the production API defaults for dashboard and billing-related requests.

## CLI features
- Start a new conversation/session.
- Switch agents/modes.
- Choose an AI model.
- Browse and reopen past sessions.
- Rename sessions.
- Login/logout in the browser.
- Open upgrade/usage billing pages.
- Interrupt streaming responses with `Esc`.

## How the CLI and server interact

### 1. Type-safe RPC boundary
- The server exports a Hono route type (`AppType`) from `packages/server`.
- The CLI creates its API client with `hc<AppType>(...)`, so request paths and response types stay aligned with the server routes.
- This means route changes in `packages/server` can directly affect compile-time behavior in `packages/cli`.
- When tracing a request from the CLI, check both the calling code in `packages/cli` and the matching route in `packages/server/src/routes`.

### 2. API target selection
- In local development, the CLI defaults to `http://localhost:3001` unless `API_URL` is set.
- For browser-based login and most production-facing flows, the defaults point at:
  - API: `https://api.gbam.dev`
  - Web: `https://gbam.dev`
- Treat `api.gbam.dev` as the public entrypoint to the Railway-hosted backend.

### 3. Session lifecycle
- Creating a session starts in the CLI.
- The CLI creates a new session by POSTing to `/sessions`, usually with a title derived from the current working directory.
- Reopening a session loads persisted data from `/sessions/:id`.
- Renaming a session uses `PATCH /sessions/:id`.
- Listing historical sessions uses `GET /sessions`.
- Session persistence lives on the server; the CLI is mostly a thin client for these operations.

### 4. Chat flow: responsibility split
This is the key interaction model to understand.

#### What the CLI does
- Collects the current visible message history.
- Resolves the active mode and selected model.
- Reads the local project's `AGENTS.md` and computes a stable hash.
- Sends the following to `/chat`:
  - session id
  - compacted messages
  - mode
  - model
  - `agentsMdHash`
  - `agentsMdContent`
  - `projectPath`
- Receives streamed assistant output.
- Executes tool calls locally when the model asks to use tools like file reads, edits, directory listing, grep, or shell execution.

#### What the server does
- Authenticates the request.
- Validates the body with shared schemas.
- Loads the existing session from the database.
- Merges incoming messages with stored history.
- Determines whether `AGENTS.md` changed by comparing the incoming hash with the previously stored session hash.
- Builds the system prompt, optionally injecting the `AGENTS.md` content that came from the CLI.
- Resolves the selected model provider and streams the model response.
- Persists the compacted conversation and latest session metadata.
- Records usage and enforces the credit system.

### 5. Critical filesystem boundary
- The server does **not** have direct access to the user's project files.
- The CLI is the side that can actually read files, edit files, list directories, and run shell commands in the user's working tree.
- The server can still instruct the model about those tools because the tool contracts are shared, but the actual tool execution happens locally in the CLI process.
- This is why `projectPath` must be passed through the chat flow: tool execution must resolve against the user's intended project, not the server runtime.

### 6. Why `AGENTS.md` matters so much
- At the start of a session, the agent needs repository-specific context.
- The CLI reads the local `AGENTS.md` and sends its contents with chat requests.
- The server injects that content into the system prompt, which gives the model the repo guidance even though the backend itself cannot read the repo.
- The server also stores an `agentsMdHash` on the session so it can detect when repo guidance changed between turns.
- In other words: `AGENTS.md` context is discovered locally by the CLI, but consumed centrally by the server when constructing the prompt.

### 7. Tooling model
- Tool definitions come from `@gbam/shared`.
- The server uses those contracts to validate and advertise available tools based on mode.
- The CLI uses the resulting tool calls to run the real local implementations.
- This split is easy to miss: the server defines the conversational/tool contract, but the CLI performs the side effects.

### 8. Mode handling
- Mode is not just a UI toggle.
- The selected mode is sent from the CLI to the server on every chat request.
- The server uses mode to:
  - choose which tools are available
  - build the appropriate system prompt
  - enforce whether the agent is in read-only planning behavior or full build behavior
- If mode behavior looks wrong, inspect both the CLI metadata being attached to messages and the server-side system-prompt/tool-contract logic.

### 9. Model handling
- The CLI chooses the model, but the server is the authority that validates whether the model id is supported.
- Supported model metadata is shared through `@gbam/shared`, while final resolution/provider wiring happens on the server.
- Session records also store the last used mode and model so resumed conversations can restore context.

## Auth flow across CLI, web, and server
- Login is initiated from the CLI, but it is not a direct CLI → API token request.
- The CLI starts a temporary local callback server on a random localhost port.
- The browser is opened to the web app, which continues the auth flow.
- The web app sends the user into Clerk's OAuth authorize flow using a fixed redirect URI pointing to the API server: `https://api.gbam.dev/auth/callback`.
- The server's `/auth/callback` route decodes the state and redirects the browser back to the CLI's temporary localhost callback server.
- The CLI then exchanges the returned code for a token and stores it locally.
- After login, the CLI's API client attaches `Authorization: Bearer ...` on requests.
- If the server responds with `401`, the CLI clears local auth state.

## Billing and credits
- Billing endpoints live on the server.
- The CLI opens upgrade/portal flows by calling server billing routes, which return hosted URLs.
- The server also protects chat and session creation with credit checks.
- Usage metering and ledger updates are server responsibilities, not CLI responsibilities.

## Practical debugging heuristics for agents
- If a failure involves local files, tool execution, `AGENTS.md`, or shell commands, start in `packages/cli`.
- If a failure involves auth, session persistence, streaming, billing, usage accounting, or system prompt construction, start in `packages/server`.
- If both sides disagree about request shape, mode values, models, or tool schemas, inspect `packages/shared` first.
- If login redirects seem confusing, remember the path is **CLI → web → Clerk → server callback → local CLI callback**.
- If behavior differs between local and production, check whether the code path is using `localhost:3001` or the Railway-hosted `https://api.gbam.dev` backend.

NEVER use build commands, except when specified by the user
Never reread Agents.md
If user gives a task that require build mode tools while you are in plan, dont hallucinate and just ask user to switch you over to build mode.

