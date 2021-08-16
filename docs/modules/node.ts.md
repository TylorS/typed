---
title: node.ts
nav_order: 34
parent: Modules
---

## node overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Environment](#environment)
  - [HttpEnv](#httpenv)
- [FS](#fs)
  - [chmod](#chmod)
  - [copyFile](#copyfile)
  - [link](#link)
  - [mkdir](#mkdir)
  - [read](#read)
  - [readFile](#readfile)
  - [readdir](#readdir)
  - [rm](#rm)
  - [rmdir](#rmdir)
  - [stat](#stat)
  - [symlink](#symlink)
  - [unlink](#unlink)
  - [write](#write)
  - [writeFile](#writefile)

---

# Environment

## HttpEnv

**Signature**

```ts
export declare const HttpEnv: {
  readonly http: (
    url: string,
    options?: http.HttpOptions | undefined,
  ) => E.Of<Ei.Either<Error, http.HttpResponse>>
}
```

Added in v0.9.4

# FS

## chmod

**Signature**

```ts
export declare const chmod: (
  path: fs.PathLike,
  mode: fs.Mode,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## copyFile

**Signature**

```ts
export declare const copyFile: (
  src: fs.PathLike,
  dest: fs.PathLike,
  flags?: number | undefined,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## link

**Signature**

```ts
export declare const link: (
  existingPath: fs.PathLike,
  newPath: fs.PathLike,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## mkdir

**Signature**

```ts
export declare const mkdir: (
  path: fs.PathLike,
  options?: string | number | fs.MakeDirectoryOptions | null | undefined,
) => E.Env<unknown, Ei.Either<unknown, string | undefined>>
```

Added in v0.13.1

## read

**Signature**

```ts
export declare const read: <TBuffer extends Uint8Array>(
  handle: fs.promises.FileHandle,
  buffer: TBuffer,
  offset?: number | null | undefined,
  length?: number | null | undefined,
  position?: number | null | undefined,
) => E.Env<unknown, Ei.Either<unknown, { bytesRead: number; buffer: TBuffer }>>
```

Added in v0.13.1

## readFile

**Signature**

```ts
export declare const readFile: (
  path: string | Buffer | URL | fs.promises.FileHandle,
  options?:
    | (fs.BaseEncodingOptions & Abortable & { flag?: string | number | undefined })
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'base64url'
    | 'latin1'
    | 'binary'
    | 'hex'
    | null
    | undefined,
) => E.Env<unknown, Ei.Either<unknown, string | Buffer>>
```

Added in v0.13.1

## readdir

**Signature**

```ts
export declare const readdir: (
  path: fs.PathLike,
  options: fs.BaseEncodingOptions & { withFileTypes: true },
) => E.Env<unknown, Ei.Either<unknown, fs.Dirent[]>>
```

Added in v0.13.1

## rm

**Signature**

```ts
export declare const rm: (
  path: fs.PathLike,
  options?: fs.RmOptions | undefined,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## rmdir

**Signature**

```ts
export declare const rmdir: (
  path: fs.PathLike,
  options?: fs.RmDirOptions | undefined,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## stat

**Signature**

```ts
export declare const stat: (
  path: fs.PathLike,
  opts?: fs.StatOptions | undefined,
) => E.Env<unknown, Ei.Either<unknown, fs.Stats | fs.BigIntStats>>
```

Added in v0.13.1

## symlink

**Signature**

```ts
export declare const symlink: (
  target: fs.PathLike,
  path: fs.PathLike,
  type?: string | null | undefined,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## unlink

**Signature**

```ts
export declare const unlink: (path: fs.PathLike) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1

## write

**Signature**

```ts
export declare const write: (
  handle: fs.promises.FileHandle,
  string: string,
  position?: number | null | undefined,
  encoding?:
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'base64url'
    | 'latin1'
    | 'binary'
    | 'hex'
    | null
    | undefined,
) => E.Env<unknown, Ei.Either<unknown, { bytesWritten: number; buffer: string }>>
```

Added in v0.13.1

## writeFile

**Signature**

```ts
export declare const writeFile: (
  path: string | Buffer | URL | fs.promises.FileHandle,
  data: string | Uint8Array,
  options?:
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'base64url'
    | 'latin1'
    | 'binary'
    | 'hex'
    | (fs.BaseEncodingOptions & {
        mode?: string | number | undefined
        flag?: string | number | undefined
      } & Abortable)
    | null
    | undefined,
) => E.Env<unknown, Ei.Either<unknown, void>>
```

Added in v0.13.1
