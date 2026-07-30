import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "install.sh");
  
  try {
    const scriptContent = fs.readFileSync(filePath, "utf-8");

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch {
    return new NextResponse("Installer script not found.", { status: 404 });
  }
}