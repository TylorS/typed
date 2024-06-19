---
title: typescript/cache.ts
nav_order: 3
parent: "@typed/compiler"
---

## cache overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ExternalFileCache (class)](#externalfilecache-class)
    - [getSnapshot (method)](#getsnapshot-method)
  - [ProjectFileCache (class)](#projectfilecache-class)
    - [has (method)](#has-method)
    - [set (method)](#set-method)
    - [remove (method)](#remove-method)
    - [removeAll (method)](#removeall-method)
    - [getFileNames (method)](#getfilenames-method)
    - [getVersion (method)](#getversion-method)
    - [getSnapshot (method)](#getsnapshot-method-1)

---

# utils

## ExternalFileCache (class)

**Signature**

```ts
export declare class ExternalFileCache
```

Added in v1.0.0

### getSnapshot (method)

**Signature**

```ts
getSnapshot(fileName: string): ts.IScriptSnapshot
```

Added in v1.0.0

## ProjectFileCache (class)

**Signature**

```ts
export declare class ProjectFileCache {
  constructor(fileNames: Array<string>)
}
```

Added in v1.0.0

### has (method)

**Signature**

```ts
has(fileName: string): boolean
```

Added in v1.0.0

### set (method)

**Signature**

```ts
set(fileName: string, snapshot?: ts.IScriptSnapshot): void
```

Added in v1.0.0

### remove (method)

**Signature**

```ts
remove(fileName: string): void
```

Added in v1.0.0

### removeAll (method)

**Signature**

```ts
removeAll(): void
```

Added in v1.0.0

### getFileNames (method)

**Signature**

```ts
getFileNames(): Array<string>
```

Added in v1.0.0

### getVersion (method)

**Signature**

```ts
getVersion(fileName: string): string | undefined
```

Added in v1.0.0

### getSnapshot (method)

**Signature**

```ts
getSnapshot(fileName: string): ts.IScriptSnapshot | undefined
```

Added in v1.0.0
