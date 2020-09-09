import { lazy } from '@typed/fp/Disposable';
import { ask, doEffect, execPure, Pure } from '@typed/fp/Effect';
import { useEffect, useMemo, useState } from '@typed/fp/hooks';
import { constVoid, pipe } from 'fp-ts/es6/function';
import { filter, snoc } from 'fp-ts/es6/ReadonlyArray';
import { create } from 'most-subject';
export const useConnectionManager = doEffect(function* () {
    const [getConnections, updateConnections] = yield* useState(Pure.of([]));
    const connectionEvents = yield* useMemo(() => create(), []);
    const manager = yield* useMemo((connections) => ({ connections, connectionEvents }), [yield* getConnections]);
    yield* useEffect(function* () {
        const { scheduler } = yield* ask();
        const disposable = lazy();
        disposable.addDisposable(connectionEvents[1].run({
            event(_time, event) {
                disposable.addDisposable(pipe(updateConnections(applyConnectionEvent(event)), execPure));
            },
            error: constVoid,
            end: constVoid,
        }, scheduler));
        return disposable;
    }, []);
    return manager;
});
const applyConnectionEvent = ({ type, connection }) => (state) => type === 'add'
    ? snoc(state, connection)
    : pipe(state, filter((c) => c.id !== connection.id));
//# sourceMappingURL=useConnectionManager.js.map