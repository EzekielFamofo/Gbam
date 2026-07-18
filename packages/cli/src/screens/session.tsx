import type { InferResponseType } from "hono";
import { SessionShell } from "../components/session-shell";
import { apiClient } from "src/lib/api-client";
import z from "zod";
import { ErrorMessage, TranscriptMessage } from "src/components/messages";
import { useLocation, useNavigate, useParams } from "react-router";
import { useToast } from "src/providers/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "src/lib/htttp-errors";
import { useChat, type Message } from "src/hooks/use-chat";
import { type ModeType, type SupportedChatModelId, DEFAULT_CHAT_MODEL_ID } from "@gbam/shared";
import { useKeyboardLayer } from "src/providers/keyboard-layer";
import { useKeyboard } from "@opentui/react";
import { usePromptConfig } from "src/providers/prompt-config";

type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;

const sessionLocationSchema = z.object({
  session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val),
  initialPrompt: z
    .object({
      message: z.string(),
      mode: z.custom<ModeType>(),
      model: z.custom<SupportedChatModelId>().optional(),
    })
    .optional(),
});

function SessionChat({
  session,
  initialPrompt,
}: {
  session: SessionData;
  initialPrompt?: { message: string; mode: ModeType; model: SupportedChatModelId };
}) {
  const [initialMessages] = useState(() => session.messages as unknown as Message[]);
  const { mode, setModel } = usePromptConfig();
  const { isTopLayer } = useKeyboardLayer();
  const { messages, status, submit, abort, interrupt, error } = useChat(session.id, initialMessages);
  const hasSubmittedInitialPromptRef = useRef(false);

  useEffect(() => {
    return () => {
      void abort();
    };
  }, [abort]);

  useKeyboard((key) => {
    if (key.name === "escape" && isTopLayer("base") && status === "streaming") {
      key.preventDefault();
      interrupt();
    }
  });

  const startupModel = useMemo(() => {
    return initialPrompt?.model ?? session.metadata?.lastUsedModel ?? DEFAULT_CHAT_MODEL_ID;
  }, [initialPrompt, session.metadata]);

  useEffect(() => {
    setModel(startupModel);
  }, [setModel, startupModel]);

  useEffect(() => {
    if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
    hasSubmittedInitialPromptRef.current = true;
    void submit({
      userText: initialPrompt.message,
      mode: initialPrompt.mode,
      model: startupModel,
    });
  }, [initialPrompt, submit]);

  const streamingAssistantMessageId = useMemo(() => {
    if (status !== "submitted" && status !== "streaming") {
      return null;
    }

    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      if (message?.role === "assistant") {
        return message.id;
      }
    }

    return null;
  }, [messages, status]);

  const handleSubmit = useCallback(
    (text: string) => {
      return submit({ userText: text, mode, model: startupModel });
    },
    [submit, mode, startupModel],
  );

  const loading = status === "submitted" || status === "streaming";

  return (
    <SessionShell onSubmit={handleSubmit} loading={loading} interruptible={loading}>
      {messages.map((message) => (
        <TranscriptMessage
          key={message.id}
          message={message}
          streaming={message.id === streamingAssistantMessageId}
        />
      ))}
      {error && <ErrorMessage message={error.message} />}
    </SessionShell>
  );
}

export function Session() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const prefetched = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  const [session, setSession] = useState<SessionData | null>(prefetched?.session ?? null);

  useEffect(() => {
    if (prefetched?.session) return;

    setSession(null);

    if (!id) return;

    let ignore = false;
    const fetchSession = async () => {
      try {
        const res = await apiClient.sessions[":id"].$get({
          param: { id },
        });
        if (ignore) return;
        if (!res.ok) throw new Error(await getErrorMessage(res));
        const resolved = await res.json();
        setSession(resolved);
      } catch (err) {
        if (ignore) return;
        toast.show({
          variant: "error",
          message: err instanceof Error ? err.message : "Failed to load session",
        });
        navigate("/", { replace: true });
      }
    };

    void fetchSession();
    return () => {
      ignore = true;
    };
  }, [id, prefetched, toast, navigate]);

  if (!session) {
    return <SessionShell onSubmit={() => {}} inputDisabled loading />;
  }

  return <SessionChat key={session.id} session={session} initialPrompt={prefetched?.initialPrompt} />;
}
