import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { UserMessage } from "../components/messages/";
import { SessionShell } from "../components/session-shell";
import z from "zod";
import { useToast } from "src/providers/toast";
import { apiClient } from "src/lib/api-client";
import { getErrorMessage } from "src/lib/http-errors";
import { Mode, modeSchema } from "@gbam/shared";
// This component is going to be the default view anytime a new session is created 

const newSessionStateSchema = z.object({
    message: z.string(),
    mode: modeSchema,
    model: z.string().optional(),
});

const DEFAULT_SESSION_TITLE = "CLI session";

function getInitialSessionTitle() {
    const cwdSegments = process.cwd()
        .replace(/[\\/]+$/, "")
        .split(/[\\/]/)
        .filter(Boolean);
    const currentDirectoryName = cwdSegments.at(-1);

    if (!currentDirectoryName || currentDirectoryName.endsWith(":")) {
        return DEFAULT_SESSION_TITLE;
    }

    return Array.from(currentDirectoryName).slice(0, 100).join("");
}

export function NewSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const hasStartedRef = useRef(false);

    const state = useMemo(() => {
        const parsed = newSessionStateSchema.safeParse(location.state)

        return parsed.success ? parsed.data : null; //After checking if a message was received was it succesful or failed, i failed return null
    }, [location.state])

    //Guard: if navigated here directly without state, go home

    
    useEffect(() => {
        if (!state?.message) {
            navigate("/", {replace: true})
        }
    }, [state, navigate]);

    
    useEffect(() => {
        if (!state || hasStartedRef.current) return; 

        hasStartedRef.current = true
        
        let ignore = false;
        const createSession = async () => {
            try {
                const res = await apiClient.sessions.$post({ 
                    // we are doing this to ensure the user doesnt wait at the homepage when a new session is created(while the backend is working) and instead is redirected to a new session where they wait there
                    json: {
                        title: getInitialSessionTitle(),
                    }
                });

                if (ignore) return;
                if (!res.ok) {
                    throw new Error(await getErrorMessage(res))
                }
                const session = await res.json();
                toast.hide();
                navigate(
                    `/sessions/${session.id}`,
                    { replace: true, state: {session, initialPrompt: state}}
                )

            } catch  (error){
                if (ignore) return;
                toast.show({
                    variant: "error",
                    message: error instanceof Error ? error.message: "Failed to create session",
                });
                navigate("/", {replace: true });
            }
        };

        createSession();
        return () => { //This is so that if the session gets destroyed then it would not show an error and instead just do an early return 
            ignore = true
        };
    }, [state, navigate, toast])

    if (!state) return null; // To make sure the new session screen only renders if there is a location state

    return(
        <SessionShell onSubmit={() => {}} inputDisabled loading>
            <UserMessage message={state.message} mode={state.mode} />
        </SessionShell>
    )
};