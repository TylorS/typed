import { createRef } from '@fp/Ref'

import { askQuestion } from './askQuestion'

/**
 * A reference to the current user's name. Upon first usage the user's name will be asked for.
 */
export const Name = createRef(askQuestion(`What's your name?`))
