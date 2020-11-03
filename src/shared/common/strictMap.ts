import { deepEqualsEq } from '@typed/fp/common/exports'
import { eqStrict } from 'fp-ts//Eq'
import { getEq } from 'fp-ts//Map'

export const strictMap = getEq(eqStrict, deepEqualsEq)
