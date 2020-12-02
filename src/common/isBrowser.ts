/**
 * A helper for determining if you are currently in a browser environment checking if
 * `window` and `document` are defined.
 */
export const isBrowser: boolean = typeof window !== 'undefined' && typeof document !== 'undefined'
