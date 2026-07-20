import { useMemo } from "react";
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
import { executeLocalTool } from "../lib/local-tools";

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

export function useChat(sessionId: string, initialMessages: Message[]) {
  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: apiClient.chat.$url().toString(),
      headers() {
        const auth = getAuth();
        return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers();
      },
      prepareSendMessagesRequest({ messages }) {
        const bufferedMessages = compactConversationForSession(messages);
        const lastMessage = bufferedMessages[bufferedMessages.length - 1];
        if (!lastMessage) throw new Error("No message to send");

        // Resolve mode and model independently across conversation history
        const resolvedMode =
          lastMessage.metadata?.mode ??
          bufferedMessages.findLast((m) => m.metadata?.mode)?.metadata?.mode ??
          "BUILD";

        const resolvedModel =
          lastMessage.metadata?.model ??
          bufferedMessages.findLast((m) => m.metadata?.model)?.metadata?.model ??
          DEFAULT_CHAT_MODEL_ID;

        return {
          body: {
            id: sessionId,
            messages: bufferedMessages, // Send full buffered stack for server DB merging
            mode: resolvedMode,
            model: resolvedModel,
          },
        };
      },
    });
  }, [sessionId]);

  const chat = useAiChat<Message>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onToolCall({ toolCall }) {
      // Find the active mode from the most recent message that defined it
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
          // Return error structured in output so LLM can read and self-correct
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

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    submit: (params: { userText: string; mode: ModeType; model: SupportedChatModelId }) => {
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
  };
}