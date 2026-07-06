import type { InferResponseType } from "hono";
import { SessionShell } from "../components/session-shell";
import { apiClient } from "src/lib/api-client";
import z from "zod";
import { BotMessage, ErrorMessage, UserMessage } from "src/components/messages";
import { useLocation, useNavigate, useParams } from "react-router";
import { useToast } from "src/providers/toast";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "src/lib/htttp-errors";

type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;// this is so we know the type of what is returned from the server

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val),
});

function ChatMessage( //we use this function to determine which message(bot/user/error) to show and where
    { msg }: {
        msg: SessionData["messages"][number]
    }
) {
    if (msg.role === "USER")  {
        return <UserMessage message={msg.content} />
    }
    if (msg.role === "ERROR")  {
        return <ErrorMessage message={msg.content} />
    }

    return <BotMessage content={msg.content} model={msg.model} />
};

export function Session() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    const prefetched = useMemo(() => {// we use prefetched if it has been redirected through a new session
        const parsed = sessionLocationSchema.safeParse(location.state);
        return parsed.success ? parsed.data.session : null;
    }, [location.state]);

    const [session, setSession] = useState<SessionData | null>(prefetched);

    useEffect(() => {
      //Skip fetch if session was parsed via location state 
      if (prefetched) return; 

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

    return( 
    <SessionShell onSubmit={() => {}} inputDisabled>
        {session.messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
        ))}
    </SessionShell>)
}