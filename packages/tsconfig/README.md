# `@typed/tsconfig`

Shared TypeScript presets for Typed packages and applications. The package supports stock
TypeScript `>=5.7 <8`; no repository-specific compiler patch is required.

## Runtime and compiler matrix

| Lane | TypeScript | ECMAScript target/lib | Module resolution | Runtime owner |
| --- | --- | --- | --- | --- |
| Public presets (`base`, `dom`, `test`, `webworker`) | `>=5.7 <8` (peer) | `ES2024` | `bundler` | Consumer bundler or `noEmit` tooling |
| Emitted `@typed/*` libraries | workspace `7.0.2` + Effect patch | `ES2024` (+ DOM or `WebWorker` where declared) | `bundler` | Node `>=20` ESM consumers |
| Vite examples | stock TypeScript from the preset | `ES2024` + DOM (`@typed/tsconfig/dom`) | `bundler` | Vite `build.target: es2022` owns shipped browser syntax |

Public presets intentionally type against `ES2024`. Example apps keep Vite on `es2022` for
syntax downleveling; override the preset `target`/`lib` to `ES2022` when the browser baseline
must match typings exactly.

`tsconfig.base.json` at the repository root adds declaration emit, composite project state,
and the Effect language-service plugin for workspace `@typed/*` packages.

## Source publication

Published `@typed/*` libraries intentionally ship `src/` alongside `dist/` for editor
navigation and source maps. Tests are excluded from declaration emit and, where configured,
from packed tarballs. Accidental test emission or wildcard test exports are defects, not part
of the source-publication contract.

## Presets

Use the extensionless package export in `extends`:

| `extends`                   | `lib`                           | `types`          | Environment           |
| --------------------------- | ------------------------------- | ---------------- | --------------------- |
| `@typed/tsconfig/base`      | `ES2024`                        | none             | Platform-neutral code |
| `@typed/tsconfig/dom`       | `ES2024`, `DOM`, `DOM.Iterable` | none             | Browser DOM code      |
| `@typed/tsconfig/test`      | `ES2024`                        | `node`, `vitest` | Node and Vitest tests |
| `@typed/tsconfig/webworker` | `ES2024`, `WebWorker`           | none             | Web Worker code       |

All four presets set `target` to `ES2024`, `module` to `ESNext`, `moduleResolution` to
`bundler`, `strict` to `true`, and `skipLibCheck` to `true`.

Consumers own their source boundary and emit policy. Set `include` and `noEmit` in the
consumer project:

```json
{
  "extends": "@typed/tsconfig/dom",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"]
}
```

Compiler options may be overridden when a project deliberately needs a different platform
or type environment. Adding browser types to `base` or `test` opts that consumer out of the
neutral defaults those presets provide.

## Test prerequisites

Projects extending `@typed/tsconfig/test` must install both `@types/node` and `vitest`:

```sh
pnpm add --save-dev @types/node vitest
```

The package's installed-tarball contract is tested with stock TypeScript `5.7.3`, `7.0.2`,
and `next`. This repository also uses the Effect TypeScript language-service patch during
development, but that patch is not part of the published presets and is not a consumer
prerequisite.
