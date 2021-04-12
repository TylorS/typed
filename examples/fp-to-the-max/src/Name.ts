import { Env } from '@fp/Env'
import { createRef, getRef, Ref, Refs } from '@fp/Ref'

import { askQuestion } from './askQuestion'
import { GetStr } from './getStr'
import { PutStr } from './putStr'

// Reference to the current name, asking for it when necessary.
export const Name: Ref<GetStr & PutStr, string> = createRef(askQuestion(`What's your name?`))

export const getName: Env<GetStr & PutStr & Refs, string> = getRef(Name)
