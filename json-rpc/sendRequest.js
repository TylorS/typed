import { doEffect, zip } from '@typed/fp/Effect';
import { oppositeDirection } from './oppositeDirection';
import { sendMessage } from './sendMessage';
import { waitForResponse } from './waitForResponse';
export const sendRequest = (request, direction) => {
    const eff = doEffect(function* () {
        const [response] = yield* zip([
            waitForResponse(request.id, oppositeDirection(direction)),
            sendMessage(request, direction),
        ]);
        return response;
    });
    return eff;
};
//# sourceMappingURL=sendRequest.js.map