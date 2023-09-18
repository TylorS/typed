---
title: index.ts
nav_order: 9
parent: "@typed/fx"
---

## index overview

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

It is defined as a super-type of `Effect`, `Stream`, and `Cause`. This
allows for all operators that accept an `Fx` to also capable of
accepting an `Effect`, `Stream`, or `Cause`. An Effect or Cause represents a single
event or error, while a Stream represents a series of events or errors that will
be pulled from the producer as soon as possible.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

---
