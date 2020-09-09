import { ask, doEffect } from '@typed/fp/Effect';
export const sendMessage = (message, direction) => doEffect(function* () {
    const { connection } = yield* ask();
    const [sink] = connection[direction];
    yield* sendEvent(sink, message);
});
const sendEvent = (sink, value) => doEffect(function* () {
    const { scheduler } = yield* ask();
    sink.event(scheduler.currentTime(), value);
});
//# sourceMappingURL=sendMessage.js.map