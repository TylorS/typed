import { createRef, getRef, Ref } from '@fp/Ref'

import { askQuestion } from './askQuestion'
import { GetStr } from './getStr'
import { PutStr } from './putStr'

// Reference to the current name, asking for it when necessary.
export const Name: Ref<GetStr & PutStr, string> = createRef(askQuestion(`What's your name?`))

export const getName = getRef(Name)
