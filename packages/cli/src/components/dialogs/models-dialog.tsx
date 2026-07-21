import { useCallback } from "react";
import { useDialog } from "src/providers/dialog";
import { DialogSearchList } from "../dialog-search-list";
import { findSupportedChatModel, type SupportedChatModelId } from "@gbam/shared";

type ModelsDialogContentProps = {
    models: SupportedChatModelId[];
    onSelectModel: (modelId: SupportedChatModelId) => void;
};

export const ModelsDialogContent = ({ models, onSelectModel }: ModelsDialogContentProps) => {
    const dialog = useDialog();

    const handleSelect = useCallback(
        (modelId: SupportedChatModelId) => {
            onSelectModel(modelId);
            dialog.close();
        },
        [dialog, onSelectModel]
    );

    return (
        <DialogSearchList
            items={models}
            onSelect={handleSelect}
            filterFn={(modelId, query) => {
                const model = findSupportedChatModel(modelId);
                const searchLower = query.trim().toLowerCase();

                // Match model ID
                if (modelId.toLowerCase().includes(searchLower)) return true;

                if (model) {
                    // Match provider (e.g., "google", "openai")
                    if (model.provider.toLowerCase().includes(searchLower)) return true;

                    // Exact match for cost tier when query contains only '$' signs
                    if (/^\$+$/.test(searchLower)) {
                        if (model.costTier === searchLower) return true;
                    } else if (model.costTier.toLowerCase().includes(searchLower)) {
                        return true;
                    }

                    // Match thinking capability keywords
                    if (model.supportsThinking && ("thinking".includes(searchLower) || "think".includes(searchLower))) {
                        return true;
                    }
                }

                return false;
            }}
            renderItem={(modelId, isSelected) => {
                const modelDef = findSupportedChatModel(modelId);
                const costBadge = modelDef?.costTier ? ` [${modelDef.costTier}]` : "";
                const thinkingBadge = modelDef?.supportsThinking ? " [Thinking]" : "";

                return (
                    <box flexDirection="row">
                        <text selectable={false} fg={isSelected ? "black" : "white"}>
                            {modelId}
                        </text>
                        {costBadge && (
                            <text selectable={false} fg={isSelected ? "black" : "yellow"}>
                                {costBadge}
                            </text>
                        )}
                        {thinkingBadge && (
                            <text selectable={false} fg={isSelected ? "black" : "cyan"}>
                                {thinkingBadge}
                            </text>
                        )}
                    </box>
                );
            }}
            getKey={(modelId) => modelId}
            placeholder="Search models ($$, thinking, openai...)"
            emptyText="No matching models"
        />
    );
};