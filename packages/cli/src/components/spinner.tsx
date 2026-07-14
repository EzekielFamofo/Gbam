import { Mode, type ModeType } from "@nightcode/shared";
import "opentui-spinner/react"

type Props = {
    mode?: ModeType; 
}

export function Spinner({ mode = Mode.BUILD }: Props) {
    const activeColor = mode === Mode.PLAN ? "#56D6C2" : "blue"

    return <spinner name="aesthetic" color={activeColor} />
}