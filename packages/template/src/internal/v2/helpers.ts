import { hasProperty } from "effect/Predicate"

export function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

export function renderToString(value: unknown): string {
  return isNullOrUndefined(value)
    ? ""
    : hasProperty(value, "toString") && typeof value.toString === "function"
    ? value.toString()
    : String(value)
}
