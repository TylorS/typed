import { Env } from '@fp/Env'
import { createRef, getRef, Ref, Refs } from '@fp/Ref'

import { askQuestion } from './askQuestion'
import { GetStr } from './getStr'
import { PutStr } from './putStr'

/**
 * A reference to the current user's name. Upon first usage the user's name will be asked for.
 */
export const Name: Ref<GetStr & PutStr, string> = createRef(askQuestion(`What's your name?`))

/**
 * Get the current user's Name.
 */
export const getName: Env<GetStr & PutStr & Refs, string> = getRef(Name)
