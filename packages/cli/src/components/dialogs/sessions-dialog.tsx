import { TextAttributes } from "@opentui/core";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "src/lib/api-client";
import { getErrorMessage } from "src/lib/http-errors";
import { useDialog } from "src/providers/dialog";
import { useToast } from "src/providers/toast";
import { DialogSearchList } from "../dialog-search-list";
import { format } from "date-fns";

type Session = {
    id: string,
    title: string,
    createdAt: string,
};

export const SessionsDialogContent = () => {
    const [sessions, setSessions] = useState<Session[]>([]); //[cite: 14]
    const [loading, setLoading] = useState(true); //[cite: 14]
    const { close } = useDialog(); //[cite: 14]
    const navigate = useNavigate(); //[cite: 14]
    const { show } = useToast(); //[cite: 14]

    useEffect(() => {
        let ignore = false;

        const fetchSessions = async () => {
            try {
                const res = await apiClient.sessions.$get();
                if (!res.ok) {
                    throw new Error(await getErrorMessage(res))
                }

                const data = await res.json();

                if (!ignore) {
                    setSessions(data);
                    setLoading(false);
                }
            } catch (error) {
                if (!ignore) {
                    show({
                        variant: "error",
                        message: error instanceof Error ? error.message : "Failed to fetch sessions",
                    });
                    close();
                }
            }
        };

        fetchSessions();
        
        return () => {
            ignore = true
        }
    }, [close, show]); //[cite: 14]

    const handleSelect = useCallback(
        (session: Session) => {
            close();
            navigate(`/sessions/${session.id}`)
        }, [close, navigate]); //[cite: 14]

    if (loading) {
        return (
            <box flexDirection="column">
                <text attributes={TextAttributes.DIM}>Loading sessions...</text>
            </box>
        ); //[cite: 14]
    }

    return (
        <DialogSearchList
            items={sessions}
            onSelect={handleSelect}
            filterFn={(s, query) => s.title.toLowerCase().includes(query.toLowerCase())}
            renderItem={(session, isSelected) => (
                /* ✅ FIXED: Exchanged React Fragment for an explicit row container to prevent renderer tree faults */
                <box flexDirection="row" flexGrow={1} width="100%">
                    {/* ✅ FIXED: Flattened multi-line layout string formatting */}
                    <text selectable={false} fg={isSelected ? "black" : "white"}>{session.title}</text>
                    <box flexGrow={1}/>
                    <text selectable={false} fg={isSelected ? "black" : undefined} attributes={TextAttributes.DIM}>
                        {format(new Date(session.createdAt), "hh:mm a")}
                    </text>
                </box>
            )}
            getKey={(s) => s.id}
            placeholder="Search sessions"
            emptyText="No matching sessions"
        /> //[cite: 14]
    )
};