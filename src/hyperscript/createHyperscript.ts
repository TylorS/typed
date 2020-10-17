import { L } from 'ts-toolbelt'

import { ArgsOf } from '../common/types'
import { Effect } from '../Effect/Effect'
import { Fn } from '../lambda/exports'
import { PropMatch } from './PropsMatch'

export declare function createHyperscript<Uri>(): <
  A extends (type: any, props: any, ...children: readonly any[]) => any
>(
  h: A,
) => HyperscriptEffect<Uri, A>

export type HyperscriptEffect<
  Uri,
  A extends (type: any, props: any, ...children: readonly any[]) => any
> = <
  Type extends ArgsOf<A>[0],
  Props extends HyperscriptEffectProps<Uri, any, ArgsOf<A>[1]>,
  Children extends L.Drop<ArgsOf<A>, '2'>
>(
  type: Type,
  props: Props,
  ...children: Children
) => ReturnType<A> & { __ENV__: EnvOfProps<Props> }

export type HyperscriptEffectProps<Uri, E, Props> = {
  [K in keyof Props]: Uri extends keyof PropMatch<Props[K]>
    ? true extends PropMatch<Props[K]>[Uri]
      ? Props[K] extends Fn
        ? EffectProp<E, Props[K]>
        : Props[K]
      : Props[K]
    : Props[K]
}

export type EffectProp<E, T extends Fn> = (...args: ArgsOf<T>) => Effect<E, ReturnType<T>>

export type EnvOfProps<A> = A extends HyperscriptEffectProps<any, infer R, any> ? R : never
