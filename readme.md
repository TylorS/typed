# @typed/fp

A collection of libraries and tools for building applications using [fp-ts v3](https://github.com/fp-ts) and [Effect](https://github.com/Effect-TS).

While some libraries like `Fx`, which provides a push-based stream abstraction, are generally applicable, 
many libraries have a strong focus on building web applications on both the backend and frontend. 

## Community

Please reach out with all your curiousities!

If you're interested in chatting about this project join us on [Discord](https://discord.gg/kpPHEvkaAv).

## Packages

- [Fx](./packages/fx) - Push-based Streams atop of Effect
- [DOM](./packages/dom) - Effect-based abstractions for interacting with the DOM
- [HTML](./packages/html) - Port of [uhtml](https://github.com/webreflection/uhtml) to work with @typed/fx
- [Path](./packages/path) - Type-safe DSL for working with [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
- [Route](./packages/route) - Effect-based abstraction for describing a Route built on `Path`
- [Router](./packages/router) - Fx-based abstraction for routing with `Route`
- [Vite Plugin](./packages/vite-plugin) - Vite plugin for building CSR and SSR applications with Effect and the packages above.
- [CLI](./packages/cli) - CLI for building, serving, and running files in conjunction with our vite plugin
- [Compiler](./packages/compiler) - The compiler code the vite-plugin utilizes

## Example

There is currently one example in the example directory which will showcase the way our vite plugin works.

## Upcoming
- Integrations with @fp-ts/schema
- Itegrations with @fp-ts/optic
