import { Mode, type ModeType } from "@gbam/shared"
import { useCallback } from "react";
import { useDialog } from "src/providers/dialog";
import { DialogSearchList } from "../dialog-search-list";

const AVAILABLE_MODES: ModeType[] = [Mode.BUILD, Mode.PLAN];

type AgentsDialogContentProps = {
    currentMode: ModeType;
    onSelectMode: (mode: ModeType) => void
}

function getModeLabel(mode: ModeType) {
    return mode === Mode.PLAN ? "Plan" : "Build";
}

export const AgentsDialogContent = ({ currentMode, onSelectMode}: AgentsDialogContentProps) => {
    const dialog = useDialog(); //[cite: 11]

    const handleSelect = useCallback((nextMode: ModeType) => {
        onSelectMode(nextMode);
        dialog.close();
    }, [dialog, onSelectMode]); //[cite: 11]

    return (
        <DialogSearchList 
            items={AVAILABLE_MODES}
            onSelect={handleSelect}
            filterFn={(item, query) => getModeLabel(item).toLowerCase().includes(query.toLowerCase())}
            renderItem={(item, isSelected) => (
                <box flexDirection="row" gap={1}>
                    {/* ✅ FIXED: Flattened text layout to prevent indentation syntax translation */}
                    <text selectable={false} fg={isSelected ? "black" : "white"}>{(item === currentMode) ? "•" : " "}</text>
                    <text selectable={false} fg={isSelected ? "black" : "white"}>{getModeLabel(item)}</text>
                </box>
            )}
            getKey={(item) => item}
            placeholder="Search agents"
            emptyText="No matching agents"
        /> /* ✅ FIXED: Changed to self-closing to avoid compiling raw whitespace between tags */
    )
}