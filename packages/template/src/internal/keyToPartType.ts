function getCodePoints(str: string) {
  return Array.from(str, (c) => c.codePointAt(0)!);
}

// Pre-computed character codes for fast comparisons
const CHAR_CODES = {
  QUESTION: "?".codePointAt(0)!,
  DOT: ".".codePointAt(0)!,
  AT: "@".codePointAt(0)!,
  LOWERCASE_O: "o".codePointAt(0)!,
  LOWERCASE_N: "n".codePointAt(0)!,
  UPPERCASE_A: "A".codePointAt(0)!,
  UPPERCASE_Z: "Z".codePointAt(0)!,
  CASE_OFFSET: "a".codePointAt(0)! - "A".codePointAt(0)!,
} as const;

// Pre-computed string patterns for exact matches
const PATTERNS = {
  REF: getCodePoints("ref"),
  CLASS: getCodePoints("class"),
  CLASSNAME: getCodePoints("classname"),

  DATA: getCodePoints(".data"),
  PROPS: getCodePoints(".props"),
  PROPERTIES: getCodePoints(".properties"),
} as const;

const NAMES = {
  ATTR: "attr",
  BOOLEAN: "boolean",
  REF: "ref",
  CLASS: "class",
  DATA: "data",
  EVENT: "event",
  PROPERTY: "property",
  PROPERTIES: "properties",
} as const;

const NAME_TUPLE = {
  DATA: [NAMES.DATA],
  PROPERTIES: [NAMES.PROPERTIES],
  REF: [NAMES.REF],
  CLASS: [NAMES.CLASS],

  BOOLEAN: (key: string) => [NAMES.BOOLEAN, key] as const,
  PROPERTY: (key: string) => [NAMES.PROPERTY, key] as const,
  EVENT: (key: string) => [NAMES.EVENT, fastUncapitalize(key)] as const,
  ATTR: (key: string) => [NAMES.ATTR, key] as const,
} as const;

// Fast uncapitalize using pre-computed character codes
function fastUncapitalize(str: string): string {
  if (str.length === 0) return str;
  const first = str.codePointAt(0)!;
  if (first >= CHAR_CODES.UPPERCASE_A && first <= CHAR_CODES.UPPERCASE_Z) {
    return String.fromCodePoint(first + CHAR_CODES.CASE_OFFSET) + str.slice(1);
  }
  return str;
}

// Fast string comparison using pre-computed patterns
function matchesPattern(str: string, pattern: ReadonlyArray<number>): boolean {
  for (let i = 0; i < pattern.length; i++) {
    if (str.codePointAt(i) !== pattern[i]) return false;
  }
  return true;
}

export function keyToPartType(key: string) {
  const len = key.length;

  // Check for static keys
  switch (len) {
    case 3: {
      if (matchesPattern(key, PATTERNS.REF)) return NAME_TUPLE.REF;
      break;
    }
    case 5: {
      if (matchesPattern(key, PATTERNS.DATA)) return NAME_TUPLE.DATA;
      if (matchesPattern(key, PATTERNS.CLASS)) return NAME_TUPLE.CLASS;
      break;
    }
    case 6: {
      if (matchesPattern(key, PATTERNS.PROPS)) return NAME_TUPLE.PROPERTIES;
      break;
    }
    case 9: {
      if (matchesPattern(key, PATTERNS.CLASSNAME)) return NAME_TUPLE.CLASS;
      break;
    }
    case 11: {
      if (matchesPattern(key, PATTERNS.PROPERTIES)) return NAME_TUPLE.PROPERTIES;
    }
  }

  // Check for special prefixes
  const first = key.codePointAt(0)!;
  switch (first) {
    case CHAR_CODES.QUESTION:
      return NAME_TUPLE.BOOLEAN(key.slice(1));
    case CHAR_CODES.DOT:
      return NAME_TUPLE.PROPERTY(key.slice(1));
    case CHAR_CODES.AT:
      return NAME_TUPLE.EVENT(fastUncapitalize(key.slice(1)));
    case CHAR_CODES.LOWERCASE_O: {
      if (key.codePointAt(1) === CHAR_CODES.LOWERCASE_N)
        return NAME_TUPLE.EVENT(fastUncapitalize(key.slice(2)));
      return NAME_TUPLE.ATTR(key);
    }
    default:
      return NAME_TUPLE.ATTR(key);
  }
}
