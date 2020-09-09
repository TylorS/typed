import { filter, take } from '@most/core';
import { lazy } from '@typed/fp/Disposable';
import { ask, async, doEffect, fromEnv } from '@typed/fp/Effect';
import { pipe } from 'fp-ts/es6/function';
import { constVoid } from 'fp-ts/es6/function';
import { isResponse } from './Response';
export const waitForResponse = (requestId, direction) => {
    const eff = doEffect(function* () {
        const { connection } = yield* ask();
        const [, messages] = connection[direction];
        const response = yield* pipe(messages, filter(isResponse), filter((r) => r.id === requestId), takeOne);
        return response;
    });
    return eff;
};
function takeOne(stream) {
    return fromEnv((e) => async((resume) => pipe(stream, take(1), resumeStream(e.scheduler, resume))));
}
function resumeStream(scheduler, resume) {
    return (stream) => {
        const disposable = lazy();
        disposable.addDisposable(stream.run({
            event(_, x) {
                disposable.addDisposable(resume(x));
            },
            error: constVoid,
            end: constVoid,
        }, scheduler));
        return disposable;
    };
}
//# sourceMappingURL=waitForResponse.js.map