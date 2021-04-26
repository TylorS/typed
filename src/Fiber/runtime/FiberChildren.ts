import { chain, fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { Arity1 } from '@fp/function'
import { createRef, getRef, setRef_ } from '@fp/Ref'
import { flow, pipe } from 'fp-ts/function'

import { Fiber, usingFiberRefs } from '../Fiber'
import { FiberId } from '../FiberId'

export const FiberChildren = createRef(
  fromIO((): ReadonlyMap<FiberId, Fiber<any>> => new Map()),
  Symbol('FiberChildren'),
  alwaysEqualsEq,
)

export const getFiberChildren = pipe(FiberChildren, getRef, usingFiberRefs)

export const setFiberChildren = (fibers: ReadonlyMap<FiberId, Fiber<any>>) =>
  pipe(FiberChildren, setRef_(fibers), usingFiberRefs)

export const modifyFiberChildren = (
  f: Arity1<ReadonlyMap<FiberId, Fiber<any>>, ReadonlyMap<FiberId, Fiber<any>>>,
) => pipe(getFiberChildren, chain(flow(f, setFiberChildren)))

export const addChild = (fiber: Fiber<any>) =>
  modifyFiberChildren((map) => new Map([...map, [fiber.id, fiber]]))

export const removeChild = (fiber: Fiber<any>) =>
  modifyFiberChildren((map) => new Map([...map].filter((x) => x[0] !== fiber.id)))
