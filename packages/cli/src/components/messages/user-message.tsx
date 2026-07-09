import { Mode } from "@nightcode/database/enums";

// Component in AI conversation with user
type Props ={
    message:string;
    mode: Mode;
}


export function UserMessage({message,mode}: Props) {
    return (
        <box width="100%" alignItems="center">
            <box border={["left"]} borderColor={mode === Mode.PLAN ? "#56D6C2" : "blue"} width="100%">
                <box justifyContent="center" paddingX={2} paddingY={1} backgroundColor="#1A1A24" width="100%">
                    <text >{message}</text>
                </box>
            </box>
        </box>
    );
};