import { InputRenderable, ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useKeyboardLayer } from "./providers/keyboard-layer";
import { useKeyboard } from "@opentui/react";

const MAX_VISIBLE_ITEMS = 6;

type DialogSearchListProps<T> ={ // defining the types for  the properties of the dialog search list component 
    items: T[];
    onSelect: (item: T) => void;
    onHighlight?: (item: T) => void;
    filterFn: (item: T, query: string) => boolean;
    renderItem: (item: T, isSelected: boolean) => ReactNode;
    getKey: (item: T) =>string;
    placeholder?: string;
    emptyText?: string;  
};

export function DialogSearchList<T> ({
    items,
    onSelect,
    onHighlight,
    filterFn,
    renderItem,
    getKey,
    placeholder = "Search",
    emptyText = "No results",
}: DialogSearchListProps<T>) {
    const [selectedIndex, setSelectedIndex] = useState(0);// To keep track of the value being searched
    const [searchValue, setSearchValue] = useState("");// To keep track of the value being searched
    const inputRef = useRef<InputRenderable>(null); // To  focus the search input field
    const scrollRef = useRef<ScrollBoxRenderable>(null);// To automatically scroll highlighted items into view
    const { isTopLayer } = useKeyboardLayer();// for checking if it is the top layer

    const handleContentChange = useCallback(() => {
        const text = inputRef.current?.value ?? "";
        setSearchValue(text);
        setSelectedIndex(0);

        const scrollbox = scrollRef.current;
        if (scrollbox) {
            scrollbox.scrollTo(0);
        }
    }, []);

    const filtered = searchValue
        ? items.filter((item) => filterFn(item, searchValue))//If user inputs a value, filter based on the value otherwise just show the max visible values 
        : items;

    const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_ITEMS);

    useKeyboard((key) => {
        if (!isTopLayer("dialog")) return; // if dialog is not top layer then ignore ctrl c and other shortcuts
   
        if (key.name === "return" || key.name === "enter" ) {
            const item = filtered[selectedIndex];// When the user presses enter return flitered list
            if (item) { // if item is found select it
                onSelect(item);
            }
        } else if (key.name === "up") {
            setSelectedIndex((i) => {
                const newIndex = Math.max(0,i - 1)
                //this is so that when it reaches the top of the visible items if thats not index 0, it scrolls to the next index
                const sb = scrollRef.current;
                if (sb && newIndex < sb.scrollTop) {
                    sb.scrollTo(newIndex);
                }
                const item = filtered[newIndex];
                if (item && onHighlight) onHighlight(item);// if the item being filtered exists then highlight it
                return newIndex;
            });
        } else if (key.name === "down") {// basically the same thing as up, just a bit different and more complicated
            setSelectedIndex((i) => {
                if (filtered.length === 0) {
                    return 0;
                }
                const newIndex = Math.min(filtered.length - 1, i + 1);
                const sb = scrollRef.current;
                if (sb) {
                    const viewportHeight = sb.viewport.height;
                    const visibleEnd = sb.scrollTop + viewportHeight - 1;
                    if (newIndex > visibleEnd) {
                        sb.scrollTo(newIndex- viewportHeight + 1);
                    }
                }
                const item = filtered[newIndex];
                if (item && onHighlight) onHighlight(item);
                return newIndex;
            }); 
        }
    });

    return ( //  The Ui for the component
        <box flexDirection="column" gap={1}>
            <input ref={inputRef} placeholder={placeholder} focused onContentChange={handleContentChange} />
            {filtered.length === 0 ? (
                <text attributes={TextAttributes.DIM}>{emptyText}</text>
            ) : (
                <scrollbox ref={scrollRef} height={visibleHeight}>
                    {filtered.map((item, i) => { //keeps filtering till it gets the item
                        const isSelected = i === selectedIndex;
                        return (// changes color if the user is hovering over that item or has scrolled to that item
                            <box key={getKey(item)} flexDirection="row" height={1} overflow="hidden" backgroundColor={isSelected ? "#89B4FA" : undefined} onMouseMove={() => {setSelectedIndex(i); if (onHighlight) onHighlight(item);}} onMouseDown={() => onSelect(item)}>
                                {renderItem(item, isSelected)}                                            
                            </box>
                        )
                    })}
                </scrollbox>
            )}
        </box>
    );
};
