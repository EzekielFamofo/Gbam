import { Mode } from "@nightcode/database/enums";
import "opentui-spinner/react"

type Props = {
    mode?: Mode; 
}

export function Spinner({ mode = Mode.BUILD }: Props) {
    const activeColor = mode === Mode.PLAN ? "#56D6C2" : "blue"

    return <spinner name="aesthetic" color={activeColor} />
}