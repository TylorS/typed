# @typed/fp/Fiber

In a world with [Effect](../Effect/readme.md), your sync and async operations all live in
a relatively synchronous looking world. Fiber is an abstraction a lot like threads which allow 
starting an `Effect` without also waiting for the value.

## Features

1. Fork, Join, and Kill `Fiber`
1. Tracks Parent-Child Relationships between fibers, keeping parents alive until all nested fibers have completed.
1. Cooperative Multitasking between parent and child fibers.
1. Provides the same [always async](https://mostcore.readthedocs.io/en/latest/concepts.html?highlight=async%20guarantee#always-async) guarantee as @most/core. All fibers will run on the next tick, as defined by your provided [Scheduler](https://mostcore.readthedocs.io/en/latest/api.html#scheduler) instance.
