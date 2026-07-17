import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');

  if (!state) {
    return new NextResponse("Missing state parameter", { status: 400 });
  }

  try {
    // 1. Decode the state to find the CLI's local port
    const [encoded] = state.split('.');
    const decodedState = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    const port = decodedState.port;

    if (!port || typeof port !== 'number') {
      throw new Error("Invalid port in state");
    }

    // 2. Build the localhost URL pointing to the CLI's temporary server
    const localUrl = new URL(`http://127.0.0.1:${port}/callback`);
    
    // 3. Forward all the query parameters (code, state, error, etc.) from Clerk
    url.searchParams.forEach((value, key) => {
      localUrl.searchParams.set(key, value);
    });

    // 4. Redirect the browser back to the CLI
    return NextResponse.redirect(localUrl);

  } catch (err) {
    console.error("Failed to parse OAuth state:", err);
    return new NextResponse("Invalid state parameter", { status: 400 });
  }
}