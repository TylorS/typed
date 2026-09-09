import * as Cause from "effect/Cause";

export function getUniqueManyKeys<A, B extends PropertyKey>(
  values: ReadonlyArray<A>,
  getKey: (value: A) => B,
): ReadonlyArray<B> | Cause.IllegalArgumentError {
  const keys: Array<B> = [];
  const seen = new Set<B>();
  for (let index = 0; index < values.length; index++) {
    const key = getKey(values[index]);
    if (seen.has(key)) {
      const formatted = typeof key === "symbol" ? key.toString() : JSON.stringify(key);
      return new Cause.IllegalArgumentError(`Duplicate keyed() key ${formatted}`);
    }
    keys[index] = key;
    seen.add(key);
  }
  return keys;
}

export function encodeManyKey(key: PropertyKey, localSymbolOrdinals: Map<symbol, number>): string {
  switch (typeof key) {
    case "string":
      return `v1_s.${encodeUtf16Base64Url(key)}`;
    case "number":
      return `v1_n.${encodeUtf16Base64Url(normalizeNumber(key))}`;
    case "symbol": {
      const globalKey = Symbol.keyFor(key);
      if (globalKey === undefined) {
        const ordinal = getLocalSymbolOrdinal(key, localSymbolOrdinals);
        const description =
          key.description === undefined ? "u" : `s.${encodeUtf16Base64Url(key.description)}`;
        return `v1_l.${ordinal}.${description}`;
      }
      return `v1_g.${encodeUtf16Base64Url(globalKey)}`;
    }
  }
}

export function validateHydratableManyKeys(
  keys: ReadonlyArray<PropertyKey>,
): Cause.IllegalArgumentError | undefined {
  for (const key of keys) {
    if (typeof key === "symbol" && Symbol.keyFor(key) === undefined) {
      return new Cause.IllegalArgumentError(
        "Local symbol keys cannot be hydrated; use a string, number, or Symbol.for() key",
      );
    }
  }
}

function getLocalSymbolOrdinal(key: symbol, localSymbolOrdinals: Map<symbol, number>): number {
  const existing = localSymbolOrdinals.get(key);
  if (existing !== undefined) return existing;
  const ordinal = localSymbolOrdinals.size;
  localSymbolOrdinals.set(key, ordinal);
  return ordinal;
}

function normalizeNumber(value: number): string {
  if (Number.isNaN(value)) return "NaN";
  if (value === Infinity) return "Infinity";
  if (value === -Infinity) return "-Infinity";
  if (Object.is(value, -0)) return "0";
  return String(value);
}

function encodeUtf16Base64Url(value: string): string {
  let binary = "";
  for (let index = 0; index < value.length; index++) {
    const codeUnit = value.charCodeAt(index);
    binary += String.fromCharCode(codeUnit >>> 8, codeUnit & 0xff);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}
