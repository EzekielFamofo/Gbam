import type { InferResponseType } from "hono";
import { SessionShell } from "../components/session-shell";
import { apiClient } from "src/lib/api-client";
import z from "zod";
import { BotMessage, ErrorMessage, UserMessage } from "src/components/messages";
import { useLocation, useNavigate, useParams } from "react-router";
import { useToast } from "src/providers/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "src/lib/htttp-errors";
import { useChat, type Message } from "src/hooks/use-chat";
import {type ModeType, type SupportedChatModelId } from "@nightcode/shared";
import { useKeyboardLayer } from "src/providers/keyboard-layer";
import { useKeyboard } from "@opentui/react";
import { usePromptConfig } from "src/providers/prompt-config";

type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;// this is so we know the type of what is returned from the server

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val),
    initialPrompt: z
        .object({
            message: z.string(),
            mode: z.custom<ModeType>(),
            model: z.custom<SupportedChatModelId>()
        })
    .   optional(),
});


function ChatMessage( //we use this function to determine which message(bot/user/error) to show and where
    { msg }: {
        msg: Message
    }
) {
    if (msg.role === "user")  {
        const text = msg.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(""); 

        return <UserMessage message={text} mode={msg.metadata?.mode ?? "BUILD"} />
    }

    return (
        <BotMessage 
            parts={msg.parts}
            model= {msg.metadata?.model ?? "unknown"}
            mode={msg.metadata?.mode ?? "BUILD"}
            durationMs={msg.metadata?.durationMs}
            streaming={false}
        />
    );
};

function SessionChat({ session, initialPrompt}: {session: SessionData, initialPrompt?: { message: string; mode: ModeType, model: SupportedChatModelId}}) {
    const [initialMessages] = useState(() => session.messages as unknown as Message[]);
    const { mode, model } = usePromptConfig();
    const { isTopLayer } = useKeyboardLayer();
    const { messages, status , submit, abort, interrupt, error } = useChat(session.id, initialMessages);
    const hasSubmittedInitialPromptRef = useRef(false)

    // Stop the pending reply when the user leaves this session
    useEffect(() => {
        return () => {
            void abort();
        };
    }, [abort]);

    //Let the user cancel a reply even before the first streames chunk arrives.
    useKeyboard((key) => {
        if (key.name === "escape" && isTopLayer("base") && status === "streaming") {
            key.preventDefault();
            interrupt();
        }
    });

    useEffect(() => {
        if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
        hasSubmittedInitialPromptRef.current = true;
        void submit({
            userText: initialPrompt.message,
            mode: initialPrompt.mode,
            model: initialPrompt.model,
        });
    }, [initialPrompt, submit])

    return(
        <SessionShell onSubmit={(text) => submit({ userText: text, mode, model })} loading={ status === "submitted" || status === "streaming" }  interruptible={ status === "submitted" || status === "streaming"}>
            {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg}/>
            ))}
            {error && <ErrorMessage message={error.message} />}
        </SessionShell>
    )
}

export function Session() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    const prefetched = useMemo(() => {// we use prefetched if it has been redirected through a new session
        const parsed = sessionLocationSchema.safeParse(location.state);
        return parsed.success ? parsed.data : null;
    }, [location.state]);

    const [session, setSession] = useState<SessionData | null>(prefetched?.session ?? null);

    useEffect(() => {
      //Skip fetch if session was parsed via location state 
      if (prefetched?.session) return; 

      setSession(null);

      if(!id) return;
      
      let ignore = false;
      const fetchSession = async () => {
        try {
            const res = await apiClient.sessions[":id"].$get({
                param: { id : id },
            });
            if (ignore) return;
            if (!res.ok) throw new Error( await getErrorMessage(res));
            const resolved = await res.json();
            setSession(resolved);
        } catch (err) {
            if (ignore) return;
            toast.show({
                variant: "error",
                message: err instanceof Error ? err.message: "Failed to load session",
            });
            navigate("/", {replace: true});
        }
      };

      fetchSession();
      return () => {
        ignore = true;
      }
    }, [id, prefetched, toast, navigate]);

    if (!session) {
        return <SessionShell onSubmit={() => {}} inputDisabled loading />
    }

    return <SessionChat key={session.id} session={session} initialPrompt={prefetched?.initialPrompt} />
}