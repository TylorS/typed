# @typed/context

Context is a direct extension of `@fp-ts/data/Context`. The main addition is the extension of `Context.Tag<A>` with methods
for utilizing the Tag for constructing environments and providing it to [Effect](https://github.com/Effect-TS/io) and [Fx](../fx).