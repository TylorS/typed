---
title: typescript/snapshot.ts
nav_order: 9
parent: "@typed/compiler"
---

## snapshot overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [VersionedSnapshot (class)](#versionedsnapshot-class)
    - [getVersion (method)](#getversion-method)
    - [getSnapshot (method)](#getsnapshot-method)
    - [update (method)](#update-method)
    - [fileName (property)](#filename-property)

---

# utils

## VersionedSnapshot (class)

**Signature**

```ts
export declare class VersionedSnapshot {
  constructor(fileName: string, snapshot?: ts.IScriptSnapshot)
}
```

Added in v1.0.0

### getVersion (method)

**Signature**

```ts
getVersion(): string
```

Added in v1.0.0

### getSnapshot (method)

**Signature**

```ts
getSnapshot(): ts.IScriptSnapshot
```

Added in v1.0.0

### update (method)

**Signature**

```ts
update(snapshot?: ts.IScriptSnapshot): void
```

Added in v1.0.0

### fileName (property)

**Signature**

```ts
fileName: string
```

Added in v1.0.0
