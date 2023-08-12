export function classNames<const ClassNames extends ReadonlyArray<any>>(
  ...classNames: ClassNames
): string {
  return classNames.filter(isNonEmptyString).join(' ')
}

function isNonEmptyString(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0
}
