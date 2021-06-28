import * as Ref from '@fp/Ref'

import { askQuestion } from './askQuestion'

/**
 * A reference to the current user's name. Upon first usage the user's name will be asked for.
 */
export const Name = Ref.create(askQuestion(`What's your name?`))
