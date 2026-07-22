import { useCallback, useMemo } from "react";
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
} from "@gbam/shared";
import { apiClient } from "../lib/api-client";
import { getAuth } from "../lib/auth";
import { ensureRootAgentsFile } from "../lib/ensure-root-agents-file";
import { executeLocalTool, getAgentsMdHash } from "../lib/local-tools";

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

export function useChat(sessionId: string, initialMessages: Message[], projectPath?: string) {
  const resolvedProjectPath = projectPath ?? process.cwd();

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

        // Compute and include the hash of AGENTS.md dynamically on every request
        const agentsMdHash = await getAgentsMdHash(resolvedProjectPath);

        return {
          body: {
            id: sessionId,
            messages: bufferedMessages,
            mode: resolvedMode,
            model: resolvedModel,
            agentsMdHash,
            projectPath: resolvedProjectPath, // 👈 Use the hook parameter instead of process.cwd()
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

      void executeLocalTool(toolCall.toolName, toolCall.input, mode)
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