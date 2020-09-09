import { ask, doEffect, fail, use, zip } from '@typed/fp/Effect';
import { getKeyedRequirements, runWithHooks, useCallback, useMemo, } from '@typed/fp/hooks';
import { createDecoderFromSchema, createGuardFromSchema } from '@typed/fp/io';
import * as E from 'fp-ts/es6/Either';
import { pipe } from 'fp-ts/es6/function';
import * as O from 'fp-ts/es6/Option';
import * as RA from 'fp-ts/es6/ReadonlyArray';
import { draw } from 'io-ts/es6/Decoder';
import { JsonRpcFailure } from './JsonRpcFailure';
import { isNotification } from './Notification';
import { isRequest } from './Request';
import { isResponse } from './Response';
const EMPTY = [];
export const useServer = doEffect(function* () {
    const notificationHandlers = yield* useMemo(() => new Map(), EMPTY);
    const registerNotification = yield* useCallback((schema, notificationHandler) => {
        const eff = doEffect(function* () {
            const disposable = { dispose: () => notificationHandlers.delete(schema) };
            if (notificationHandlers.has(schema)) {
                return disposable;
            }
            const env = yield* ask();
            const guard = createGuardFromSchema(schema);
            const decoder = createDecoderFromSchema(schema);
            const requirements = yield* getKeyedRequirements(schema);
            notificationHandlers.set(schema, {
                handler: (notification) => runWithHooks(notificationHandler(notification), requirements),
                env,
                guard,
                decoder,
            });
            return disposable;
        });
        return eff;
    }, EMPTY);
    const requestHandlers = yield* useMemo(() => new Map(), EMPTY);
    const registerRequest = yield* useCallback((schema, requestHandler) => {
        const eff = doEffect(function* () {
            const disposable = { dispose: () => requestHandlers.delete(schema) };
            if (requestHandlers.has(schema)) {
                return disposable;
            }
            const env = yield* ask();
            const guard = createGuardFromSchema(schema);
            const decoder = createDecoderFromSchema(schema);
            const requirements = yield* getKeyedRequirements(schema);
            requestHandlers.set(schema, {
                handler: (request) => runWithHooks(requestHandler(request), requirements),
                env,
                guard,
                decoder,
            });
            return disposable;
        });
        return eff;
    }, EMPTY);
    const handleMessage = yield* useCallback((message) => {
        const eff = doEffect(function* () {
            if (isRequest(message)) {
                const requestHandler = findHandler(message, requestHandlers);
                if (O.isSome(requestHandler)) {
                    const { handler, env, decoder } = requestHandler.value;
                    const either = decoder.decode(message);
                    if (E.isLeft(either)) {
                        return yield* fail(JsonRpcFailure, new Error(draw(either.left)));
                    }
                    const response = yield* pipe(handler(message), use(env));
                    return O.some(response);
                }
                const methodNotFound = {
                    jsonrpc: '2.0',
                    id: message.id,
                    error: {
                        code: -32601 /* MethodNotFound */,
                        message: `Method Not Found`,
                    },
                };
                return O.some(methodNotFound);
            }
            if (isNotification(message)) {
                const notificationHandler = findHandler(message, notificationHandlers);
                if (O.isSome(notificationHandler)) {
                    const { handler, env, decoder } = notificationHandler.value;
                    const either = decoder.decode(message);
                    if (E.isLeft(either)) {
                        return yield* fail(JsonRpcFailure, new Error(draw(either.left)));
                    }
                    yield* pipe(handler(message), use(env));
                    return O.none;
                }
                return O.none;
            }
            if (Array.isArray(message) && message.every(isRequest)) {
                const responseOptions = yield* zip(message.map(handleMessage));
                const responses = pipe(responseOptions, RA.compact, RA.filter(isResponse));
                return responses.length > 0 ? O.some(responses) : O.none;
            }
            return O.none;
        });
        return eff;
    }, EMPTY);
    const server = yield* useMemo(() => ({ registerNotification, registerRequest, handleMessage }), EMPTY);
    return server;
});
function findHandler(message, handlerMap) {
    for (const handler of handlerMap.values()) {
        if (handler.guard.is(message)) {
            return O.some(handler);
        }
    }
    return O.none;
}
//# sourceMappingURL=useServer.js.map