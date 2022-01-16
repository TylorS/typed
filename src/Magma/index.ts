import { Magma } from 'fp-ts/Magma'

export const First: Magma<any> = { concat: (_s) => (f) => f }
export const Second: Magma<any> = { concat: (s) => (_f) => s }
