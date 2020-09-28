import { curry } from '@typed/fp/lambda/exports'

/**
 * Toggle a boolean off/on if given boolean is undefined or sets the value if boolean is not undefined.
 * @param bool :: boolean | undefined
 * @param togglable :: boolean
 * @returns :: boolean
 */
export const toggleOrSet: {
  (bool: boolean | undefined, toggleableBoolean: boolean): boolean
  (bool: boolean | undefined): (toggleableBoolean: boolean) => boolean
} = curry((bool: boolean | undefined, toggleableBoolean: boolean): boolean =>
  bool === void 0 ? !toggleableBoolean : bool,
) as {
  (bool: boolean | undefined, toggleableBoolean: boolean): boolean
  (bool: boolean | undefined): (toggleableBoolean: boolean) => boolean
}
