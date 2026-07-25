import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChat as useAiChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type InferUITools,
  lastAssistantMessageIsCompleteWithToolCalls,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";
import {
  compactConversationForSession,
  DEFAULT_CHAT_MODEL_ID,
  type ModeType,
  type SupportedChatModelId,
  type ToolContracts,
  type PermissionRule,
} from "@gbam/shared";
import { apiClient } from "../lib/api-client";
import { getAuth } from "../lib/auth";
import { ensureRootAgentsFile } from "../lib/ensure-root-agents-file";
import { getAgentsMdContext } from "../lib/local-tools";
import { createPermissionGate } from "../lib/permissions-gate";

export type ChatMessageMetadata = {
  mode?: ModeType;
  model?: SupportedChatModelId | string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

type ChatTools = {
  [Name in keyof InferUITools<ToolContracts>]: {
    input: InferUITools<ToolContracts>[Name]["input"];
    output: unknown;
  };
};

export type Message = UIMessage<ChatMessageMetadata, never, ChatTools>;

export function useChat(
  sessionId: string, 
  initialMessages: Message[], 
  projectPath?: string,
  requestConfirmation?: (tool: string, target: string) => Promise<"yes" | "no" | "always">
) {
  const resolvedProjectPath = projectPath ?? process.cwd();

  // Scoped per session: switching sessions gets a fresh "always allow" cache
  // instead of leaking overrides across unrelated sessions.
  const executeToolWithPermission = useMemo(() => createPermissionGate(), [sessionId]);

  // Held as an in-flight promise, not a nullable value, so any tool call that
  // fires before the fetch resolves awaits the *same* request rather than
  // reading a stale `null` and silently falling back to default rules.
  const permissionConfigRef = useRef<Promise<PermissionRule[] | null> | undefined>(undefined);

  const fetchPermissionConfig = useCallback(async () => {
    try {
      const res = await apiClient.permissions.$get();
      if (!res.ok) throw new Error(`Failed to fetch permissions (${res.status})`);
      const data = (await res.json()) as { permissionConfig: PermissionRule[] | null };
      return data.permissionConfig;
    } catch (err) {
      console.error("Failed to fetch permissions, falling back to defaults:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    permissionConfigRef.current = fetchPermissionConfig();
  }, [fetchPermissionConfig]);

  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: apiClient.chat.$url().toString(),
      headers() {
        const auth = getAuth();
        return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers();
      },
      async prepareSendMessagesRequest({ messages }) {
        const bufferedMessages = compactConversationForSession(messages);
        const lastMessage = bufferedMessages[bufferedMessages.length - 1];
        if (!lastMessage) throw new Error("No message to send");

        const resolvedMode =
          lastMessage.metadata?.mode ??
          bufferedMessages.findLast((m) => m.metadata?.mode)?.metadata?.mode ??
          "BUILD";

        const resolvedModel =
          lastMessage.metadata?.model ??
          bufferedMessages.findLast((m) => m.metadata?.model)?.metadata?.model ??
          DEFAULT_CHAT_MODEL_ID;

        const agentsMd = await getAgentsMdContext(resolvedProjectPath);

        return {
          body: {
            id: sessionId,
            messages: bufferedMessages,
            mode: resolvedMode,
            model: resolvedModel,
            agentsMdHash: agentsMd.hash,
            agentsMdContent: agentsMd.content,
            projectPath: resolvedProjectPath,
          },
        };
      },
    });
  }, [sessionId, resolvedProjectPath]);

  const chat = useAiChat<Message>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onToolCall({ toolCall }) {
      const mode =
        chat.messages.findLast((m) => m.metadata?.mode)?.metadata?.mode ?? "BUILD";

      const confirmHandler = requestConfirmation ?? (async () => "no" as const);

      void (permissionConfigRef.current ?? Promise.resolve(null))
        .then((permissionConfig) =>
          executeToolWithPermission(
            toolCall.toolName,
            toolCall.input,
            mode as ModeType,
            resolvedProjectPath,
            permissionConfig,
            confirmHandler
          )
        )
        .then((output) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            output,
          }),
        )
        .catch((error) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            output: {
              error: error instanceof Error ? error.message : String(error),
            },
          }),
        );
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const renameSession = useCallback(
    async (title: string) => {
      const res = await apiClient.sessions[":id"].$patch({
        param: { id: sessionId },
        json: { title },
      });

      if (!res.ok) {
        throw new Error("Failed to rename session");
      }

      return await res.json();
    },
    [sessionId],
  );

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    submit: async (params: { userText: string; mode: ModeType; model: SupportedChatModelId }) => {
      await ensureRootAgentsFile();
      // Refresh before sending so a dashboard edit made mid-session is picked
      // up on the next turn, rather than only ever being read once at mount.
      permissionConfigRef.current = fetchPermissionConfig();

      return chat.sendMessage({
        text: params.userText,
        metadata: {
          mode: params.mode,
          model: params.model,
        },
      });
    },
    abort: chat.stop,
    interrupt: chat.stop,
    renameSession,
  };
}