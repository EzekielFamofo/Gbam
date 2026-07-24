import type { InferResponseType } from "hono";
import { SessionShell } from "../components/session-shell";
import { apiClient } from "src/lib/api-client";
import z from "zod";
import { ErrorMessage, TranscriptMessage } from "src/components/messages";
import { RenameSessionDialogContent } from "src/components/dialogs/rename-session-dialog";
import { useLocation, useNavigate, useParams } from "react-router";
import { useToast } from "src/providers/toast";
import { useDialog } from "src/providers/dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "src/lib/htttp-errors";
import { useChat, type Message } from "src/hooks/use-chat";
import {
  DEFAULT_CHAT_MODEL_ID,
  findSupportedChatModel,
  type ModeType,
  type SupportedChatModelId,
} from "@gbam/shared";
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

function resolveSupportedModel(model: string | null | undefined): SupportedChatModelId | null {
  if (!model) return null;
  const match = findSupportedChatModel(model);
  return match ? (model as SupportedChatModelId) : null;
}

function SessionChat({
  session,
  initialPrompt,
  onRenameSession,
}: {
  session: SessionData;
  initialPrompt?: { message: string; mode: ModeType; model?: SupportedChatModelId };
  onRenameSession: (newTitle: string) => Promise<void>;
}) {
  const [initialMessages] = useState(() => session.messages as unknown as Message[]);
  const { mode, model, setModel } = usePromptConfig();
  const { isTopLayer } = useKeyboardLayer();
  const dialog = useDialog();
  const hasSubmittedInitialPromptRef = useRef(false);

  // 1. State to manage active permission confirmation prompts
  const [pendingToolAction, setPendingToolAction] = useState<{
    tool: string;
    target: string;
    resolve: (choice: "yes" | "no" | "always") => void;
  } | null>(null);

  // 2. Define the confirmation handler for useChat
  const handleRequestConfirmation = useCallback((tool: string, target: string) => {
    return new Promise<"yes" | "no" | "always">((resolve) => {
      setPendingToolAction({ tool, target, resolve });
    });
  }, []);

  // 3. Pass the confirmation handler into useChat
  const { messages, status, submit, abort, interrupt, error } = useChat(
    session.id, 
    initialMessages, 
    undefined, 
    handleRequestConfirmation
  );

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

    if ((key.ctrl || key.meta) && key.name === "r" && isTopLayer("base")) {
      key.preventDefault();
      dialog.open({
        title: "Rename Session",
        children: (
          <RenameSessionDialogContent
            currentTitle={session.title}
            onSubmit={onRenameSession}
          />
        ),
      });
    }
  });

  const startupModel = useMemo<SupportedChatModelId>(() => {
    const initialModel = resolveSupportedModel(initialPrompt?.model);
    if (initialModel) {
      return initialModel;
    }

    const persistedModel = resolveSupportedModel(session.lastModel);
    return persistedModel ?? DEFAULT_CHAT_MODEL_ID;
  }, [initialPrompt?.model, session.lastModel]);

  useEffect(() => {
    setModel(startupModel);
  }, [setModel, startupModel]);

  useEffect(() => {
    if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
    hasSubmittedInitialPromptRef.current = true;

    void submit({
      userText: initialPrompt.message,
      mode: initialPrompt.mode,
      model: resolveSupportedModel(initialPrompt.model) ?? startupModel,
    });
  }, [initialPrompt, startupModel, submit]);

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
      return submit({ userText: text, mode, model });
    },
    [submit, mode, model],
  );

  const loading = status === "submitted" || status === "streaming";

  return (
    <SessionShell 
      onSubmit={handleSubmit} 
      loading={loading} 
      interruptible={loading}
      pendingToolAction={pendingToolAction}
      onPermissionSelect={(choice) => {
        if (pendingToolAction) {
          pendingToolAction.resolve(choice);
          setPendingToolAction(null);
        }
      }}
    >
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

  const handleRenameSession = useCallback(
    async (newTitle: string) => {
      if (!session) return;

      try {
        const res = await apiClient.sessions[":id"].$patch({
          param: { id: session.id },
          json: { title: newTitle },
        });

        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }

        const updated = await res.json();
        setSession((prev) => (prev ? { ...prev, title: updated.title } : null));

        toast.show({
          variant: "info",
          message: "Session renamed successfully",
        });
      } catch (err) {
        toast.show({
          variant: "error",
          message: err instanceof Error ? err.message : "Failed to rename session",
        });
      }
    },
    [session, toast],
  );

  if (!session) {
    return <SessionShell onSubmit={() => {}} inputDisabled loading />;
  }

  return (
    <SessionChat
      key={session.id}
      session={session}
      initialPrompt={prefetched?.initialPrompt}
      onRenameSession={handleRenameSession}
    />
  );
}