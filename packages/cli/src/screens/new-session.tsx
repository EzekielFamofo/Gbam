import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages/";
import { SessionShell } from "../components/session-shell";
// This component is going to be the default view anytime a new session is created 
export function NewSession() {
    const navigate = useNavigate();
    const location = useLocation();

    const state = location.state as {message?: string } | null;

    useEffect(() => {
        if (!state?.message) {
            navigate("/", {replace: true})
        }
    })

    if (!state?.message) return null; // To make sure the new session screen only renders if there is a locaation state

    return(
        <SessionShell onSubmit={() => {}} inputDisabled loading>
            <UserMessage message={state.message} />
            <BotMessage content="This is a sample bot message" model="opus-4-6" />
            <ErrorMessage message="This is a sample error message" />
        </SessionShell>
    )
};7