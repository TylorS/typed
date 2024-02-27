---
"@typed/route": minor
"@typed/path": minor
---

Rewrite @typed/path to better cover path-to-regexp syntax.

This release marks a very high confidence that parsing a path that conforms
to the path-to-regexp syntax will be correct. This includes zero-or-more, one-or-more,
and optional modifiers, named parameters, unnamed parameters, custom prefixes, etc.

The only thing missing is arbitrary RegExp support, although some basic support for parsing is
in place, but the parsed types will still always be `string` even though `path-to-regexp`
runtime behavior may parse it as something else. If [TypeScript Support](https://github.com/microsoft/TypeScript/pull/55600)
ever lands for RegExps, it should be trivial to support them.

For a complete and up-to-date list of all supported syntax, see `/test/type-level/path.ts`
within the `@typed/path` package to see type-level tests for both parsing and interpolation.
