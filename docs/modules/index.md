---
title: Modules
has_children: true
permalink: /docs/modules
nav_order: 3
---

# @typed/fp

`@typed/fp` is conceptually an extension of [fp-ts](https://gcanti.github.io/fp-ts/), with
[cancelable async effects](./modules/Resume.ts.md), [streams](https://github.com/mostjs/core),
[state management](./modules/Ref.ts.md), and more.

This project is under heavy development. We intend to align with `fp-ts` v3. A 1.0 will be released
once both codebases are stable.

## Features

- [`@most/core`](https://github.com/mostjs/core) [Streams](./Stream.ts.md)
- [Cancelable Async Effect](./Resume.ts.md)
- [Dependency Injection](./Env.ts.md)
- [State Management](./Ref.ts.md)
- Testable, Free of globals
- Type-Safe
- Composable
- Concurrent
- Asynchronous
- Resource-safe
- Resilient
- Deeply integrated with [fp-ts](https://gcanti.github.io/fp-ts/)

## Core Modules

- [Resume](./Resume.ts.md)
- [Env](./Env.ts.md)
- [Stream](./Stream.ts.md)
- [Ref](./Ref.ts.md)
