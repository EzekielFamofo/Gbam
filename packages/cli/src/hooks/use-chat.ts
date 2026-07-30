import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  normalizeStoredPermissionConfig,
  type UserPermissionConfig
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

  const executeToolWithPermission = useMemo(() => createPermissionGate(), [sessionId]);

  const permissionConfigRef = useRef<Promise<UserPermissionConfig | null> | undefined>(undefined);

  // Tracks tool calls (bash execution, permission prompts, local edits) still
  // in flight. `chat.status` alone goes back to a non-streaming state the
  // moment the model stops emitting text - it has no idea local work is still
  // running after that - so without this, "Working..." disappears mid-tool-call.
  const [pendingToolCallCount, setPendingToolCallCount] = useState(0);

  const fetchPermissionConfig = useCallback(async () => {
    try {
      const res = await apiClient.permissions.$get();
      if (!res.ok) throw new Error(`Failed to fetch permissions (${res.status})`);
      const data = (await res.json()) as { permissionConfig: unknown };
      return normalizeStoredPermissionConfig(data.permissionConfig);
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

      setPendingToolCallCount((count) => count + 1);

      void (permissionConfigRef.current ?? Promise.resolve(null))
        .then((permissionConfig) =>
          executeToolWithPermission(
            toolCall.toolName,
            toolCall.input,
            mode as ModeType,
            resolvedProjectPath,
            { sessionId, turnId: toolCall.toolCallId },
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
        )
        .finally(() => {
          setPendingToolCallCount((count) => Math.max(0, count - 1));
        });
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

  const submit = useCallback(
    async (params: { userText: string; mode: ModeType; model: SupportedChatModelId }) => {
      await ensureRootAgentsFile();
      permissionConfigRef.current = fetchPermissionConfig();

      return chat.sendMessage({
        text: params.userText,
        metadata: {
          mode: params.mode,
          model: params.model,
        },
      });
    },
    [chat.sendMessage, fetchPermissionConfig],
  );

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    // True while any local tool work is in progress - executing a command,
    // waiting on a permission prompt - independent of whether the model is
    // currently streaming text.
    isExecutingTools: pendingToolCallCount > 0,
    submit,
    abort: chat.stop,
    interrupt: chat.stop,
    renameSession,
  };
}