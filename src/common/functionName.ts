const FUNCTION_NAME_REGEX = /^function\s*([\w$]+)/

const DEFAULT_MATCH = ['', '']

/**
 * Returns the name of a function.
 * @example
 * function foo() {...}
 *
 * functionName(foo) === 'foo'
 */
export function functionName(fn: Function): string {
  if (fn.name) {
    return fn.name
  }

  const [, name] = String(fn).match(FUNCTION_NAME_REGEX) || DEFAULT_MATCH

  return name
}
