import { disposeAll } from '@most/disposable'
import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import {
  getCurrentNamespace as getCurrentNamespace_,
  Namespace,
  usingNamespace,
} from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { createGetShared, createSetShared, RuntimeEnv } from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { bind, chainFirst as chainFirst_ } from 'fp-ts/dist/Chain/'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { constVoid, pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { matchW, some } from 'fp-ts/dist/Option'

import { createNamespaceDisposable } from '../NamespaceDisposable'
import { createGetNamespaceChildren } from './NamespaceChildren'
import { createGetNamespaceParent, createNamespaceParent } from './NamespaceParent'

export function createAddToTree<F extends URIS2, E = never>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (parent: Namespace) => Kind2<F, WidenI<RuntimeEnv<F> | E>, void>

export function createAddToTree<F extends URIS3, R = never, E = never>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): (parent: Namespace) => Kind3<F, WidenI<RuntimeEnv<F> | R>, E, void>

export function createAddToTree<F extends URIS4, S = never, R = never, E = never>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): (parent: Namespace) => Kind4<F, S, WidenI<RuntimeEnv<F> | R>, E, void>

export function createAddToTree<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (parent: Namespace) => HKT<F, void>

export function createAddToTree<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const Do = M.of({})
  const bindTo = bind(M)
  const getCurrentNamespace = getCurrentNamespace_(M)
  const NamespaceParent = createNamespaceParent(M)
  const NamespaceDisposable = createNamespaceDisposable(M)
  const getNamespaceParent = createGetNamespaceParent(M)
  const getNamespaceChildren = createGetNamespaceChildren(M)
  const setShared = createSetShared(M)
  const getShared = createGetShared(M)
  const chainFirst = chainFirst_(M)
  const using = usingNamespace(M)
  const voidM = M.fromIO(constVoid)

  return (parent: Namespace) =>
    pipe(
      Do,
      bindTo('env', () => M.ask<RuntimeEnv<F>>()),
      bindTo('namespace', getCurrentNamespace),
      bindTo('currentParent', () => getNamespaceParent),
      chainFirst(
        // Delete namespace from another existing parent
        ({ currentParent, namespace }): HKT<F, void> =>
          pipe(
            currentParent,
            matchW(
              () => voidM,
              (parentNamespace) =>
                parentNamespace === parent
                  ? voidM
                  : pipe(
                      getNamespaceChildren,
                      M.map((children) => {
                        children.delete(namespace)
                      }),
                      using(parentNamespace),
                    ),
            ),
          ),
      ),
      bindTo('parentsChildren', () => pipe(getNamespaceChildren, using(parent))),
      // Add namespace as child
      chainFirst(({ currentParent, namespace, parentsChildren }) => {
        const addParent = pipe(NamespaceParent, setShared(some(parent)))
        const addChild = () => {
          parentsChildren.add(namespace)
        }
        const modifyTree = pipe(addParent, M.map(addChild))

        return pipe(
          currentParent,
          matchW(
            () => modifyTree,
            (parentNamespace) => (parentNamespace === parent ? voidM : modifyTree),
          ),
        )
      }),
      bindTo('namespaceDisposable', () => getShared(NamespaceDisposable)),
      bindTo('parentDisposable', () => pipe(NamespaceDisposable, getShared, using(parent))),
      M.map(({ parentDisposable, namespaceDisposable, parentsChildren, namespace }) => {
        namespaceDisposable.addDisposable(
          disposeAll([
            parentDisposable.addDisposable(namespaceDisposable),
            // Remove from parent when disposed
            { dispose: () => parentsChildren.delete(namespace) },
          ]),
        )
      }),
    )
}
