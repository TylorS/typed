/**
 * Returns the type of a value.
 * @name typeOf(value: any): string
 */
export function typeOf(value: string): 'String'
export function typeOf(value: number): 'Number'
export function typeOf(value: null): 'Null'
export function typeOf(value: undefined): 'Undefined'
export function typeOf(value: undefined): 'Undefined'
export function typeOf(value: any): string
export function typeOf(value: any): string {
  if (value === null) {
    return 'Null'
  }

  if (value === void 0) {
    return `Undefined`
  }

  return Object.prototype.toString.call(value).slice(8, -1)
}
