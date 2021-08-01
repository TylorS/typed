---
title: Scheduler.ts
nav_order: 50
parent: Modules
---

## Scheduler overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [getScheduler](#getscheduler)
  - [runStream](#runstream)
- [Constructor](#constructor)
  - [delay](#delay)
- [Environment](#environment)
  - [SchedulerEnv (interface)](#schedulerenv-interface)

---

# Combinator

## getScheduler

**Signature**

```ts
export declare const getScheduler: E.Env<SchedulerEnv, Scheduler>
```

Added in v0.9.2

## runStream

**Signature**

```ts
export declare const runStream: <A>(
  sink: Sink<A>,
  stream: Stream<A>,
) => E.Env<SchedulerEnv, Disposable>
```

Added in v0.9.2

# Constructor

## delay

**Signature**

```ts
export declare const delay: (ms: Time) => Env<SchedulerEnv, Time>
```

Added in v0.9.2

# Environment

## SchedulerEnv (interface)

**Signature**

```ts
export interface SchedulerEnv {
  readonly scheduler: Scheduler
}
```

Added in v0.9.2
