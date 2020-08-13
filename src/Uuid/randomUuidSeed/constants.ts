export const VALID_UUID_LENGTH = 16 as const

export const isBrowser: boolean = typeof crypto !== 'undefined'
