import { EqStrict } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { getEq } from 'fp-ts/ReadonlyMap'

import { chain, fromIO } from '../../Env'
import { Arity1 } from '../../function'
import { createRef, getRef, setRef } from '../../Ref'
import { Fiber, withFiberRefs } from '../Fiber'
import { FiberId } from '../FiberId'

export const FiberChildren = createRef(
  fromIO((): ReadonlyMap<FiberId, Fiber<unknown>> => new Map()),
  undefined,
  getEq(EqStrict, EqStrict),
)

export const getFiberChildren = pipe(FiberChildren, getRef, withFiberRefs)

export const setFiberChildren = (fibers: ReadonlyMap<FiberId, Fiber<unknown>>) =>
  pipe(FiberChildren, setRef(fibers), withFiberRefs)

export const modifyFiberChildren = (
  f: Arity1<ReadonlyMap<FiberId, Fiber<unknown>>, ReadonlyMap<FiberId, Fiber<unknown>>>,
) => pipe(getFiberChildren, chain(flow(f, setFiberChildren)))

export const addChild = (fiber: Fiber<unknown>) =>
  modifyFiberChildren((map) => new Map([...map, [fiber.id, fiber]]))

export const removeChild = (fiber: Fiber<unknown>) =>
  modifyFiberChildren((map) => new Map([...map].filter((x) => x[0] !== fiber.id)))
