# @typed/fp/Effect

> Algebraic effects for TypeScript

This module is at the core of what most of `@typed/fp` is about, and is an approximation
of algebraic effects using Typescript and Generator Functions. This module also exports 
instances of `fp-ts` typeclasses.

Don't worry if you've never heard of algebraic effects though, you'll get the hang of them quickly!

Using this abstraction, you can write code that separates the how (implementation details/effects) from the what (logic/intent). This leads to code that's easy to test and easier to change as time goes on.

`Effect` is pull-based, even though that may be disguised by the API. This makes it a great candidate for
be [sampled](https://mostcore.readthedocs.io/en/latest/api.html#sample) by discrete event streams like those provided by [@most/core](https://mostcore.readthedocs.io/en/latest/index.html). This module has no dependency on `@most/core` directly, but if that's your sort of thing definitely take a look at [@typed/fp/Stream](../Stream/readme.md)

## Features

1. Dependency Injection (using the Reader monad from fp-ts)
2. Unified API for sync and asynhronous effects (using [Resume](../Resume/readme.md))
3. Asynchronous Effect Cancellation
4. Automatic resource aggegration
5. Type-Safe failures without using try/catch
6. Do-notation for Effect
