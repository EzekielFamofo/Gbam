import { db } from "./client";

async function main() {
  const sessions = await db.session.findMany({
    select: { id: true, messages: true },
  });

  console.log(`Processing ${sessions.length} sessions...`);

  for (const session of sessions) {
    if (!Array.isArray(session.messages)) continue;

    const cleaned = (session.messages as any[]).map((msg) => {
      const cleanMsg = { ...msg };
      delete cleanMsg.providerMetadata;
      delete cleanMsg.providerOptions;
      if (typeof cleanMsg.id === "string" && cleanMsg.id.startsWith("msg_")) {
        delete cleanMsg.id;
      }
      if (Array.isArray(cleanMsg.parts)) {
        cleanMsg.parts = cleanMsg.parts.map((p: any) => {
          delete p.providerMetadata;
          if (typeof p.id === "string" && p.id.startsWith("msg_")) delete p.id;
          return p;
        });
      }
      return cleanMsg;
    });

    await db.session.update({
      where: { id: session.id },
      data: { messages: cleaned },
    });
  }

  console.log("Cleanup complete!");
}

main().finally(() => db.$disconnect());