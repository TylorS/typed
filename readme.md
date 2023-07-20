# @typed/fp

A collection of libraries and tools for building applications using [Effect](https://github.com/Effect-TS).

While some libraries like `Fx`, which provides a push-based stream abstraction, are generally applicable, 
many libraries have a strong focus on building web applications on both the backend and frontend. 

## Community

Please reach out with all your curiosities!

If you're interested in chatting about this project join us on [Discord](https://discord.gg/kpPHEvkaAv).

## Packages

- [CLI](./packages/cli) - CLI for building, serving, and running files in conjunction with our vite plugin
- [Context](./packages/context) - Extensions to @effect/data/Context for working with Effect + Fx
- [DOM](./packages/dom) - Effect-based abstractions for interacting with the DOM
- [Error](./packages/error) - Small library for dealing with errors in Effect + Fx
- [Framework](./packages/framework) - Brings together all the Effect packages into an opinionated composition. 
- [Fx](./packages/fx) - Push-based Streams atop of Effect
- [HTML](./packages/html) - Port of [uhtml](https://github.com/webreflection/uhtml) to work with @typed/fx
- [Navigation](./packages/navigation) - Modeled roughly after the upcoming [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)
- [Path](./packages/path) - Type-safe DSL for working with [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
- [Route](./packages/route) - Effect-based abstraction for describing a Route built on `Path`
- [Router](./packages/router) - Fx-based abstraction for routing with `Route`
- [Vite Plugin](./packages/vite-plugin) - Vite plugin for building CSR and SSR applications with Effect and the packages above.

## Example

There is currently one example in the example directory which will showcase the way our vite plugin works.