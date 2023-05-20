import { pipe } from '@effect/data/Function'
import { type Option, fromNullable } from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'

export interface Navigator extends globalThis.Navigator {}

export const Navigator = C.Tag<Navigator>('@typed/dom/Navigator')

export const canShare: (shareData?: ShareData) => Effect.Effect<Navigator, never, boolean> = (
  shareData?: ShareData,
) => Navigator.with((n) => n.canShare(shareData))

export const share: (shareData: ShareData) => Effect.Effect<Navigator, never, void> = (
  shareData: ShareData,
) => Navigator.withEffect((n) => Effect.promise(() => n.share(shareData)))

export const readClipboardText: Effect.Effect<Navigator, never, string> = Navigator.withEffect(
  (n) => Effect.promise(() => n.clipboard.readText()),
)

export const writeClipboardText: (text: string) => Effect.Effect<Navigator, never, void> = (
  text: string,
) => Navigator.withEffect((n) => Effect.promise(() => n.clipboard.writeText(text)))

export const readClipboard: Effect.Effect<Navigator, never, ClipboardItems> = Navigator.withEffect(
  (n) => Effect.promise(() => n.clipboard.read()),
)

export const makeClipoboardItem = (
  items: Record<string, string | Blob | PromiseLike<string | Blob>>,
  options?: ClipboardItemOptions | undefined,
): Effect.Effect<GlobalThis, never, ClipboardItem> =>
  GlobalThis.with((g) => new g.ClipboardItem(items, options))

export const writeClipboard = (items: ClipboardItems): Effect.Effect<Navigator, never, void> =>
  Navigator.withEffect((n) => Effect.promise(() => n.clipboard.write(items)))

export const checkCookieEnabled: Effect.Effect<Navigator, never, boolean> = Navigator.with(
  (n) => n.cookieEnabled,
)

export const getHardwareConcurrency: Effect.Effect<Navigator, never, number> = Navigator.with(
  (n) => n.hardwareConcurrency,
)

export const getMaxTouchPoints: Effect.Effect<Navigator, never, number> = Navigator.with(
  (n) => n.maxTouchPoints,
)

export const getMediaDevices: Effect.Effect<Navigator, never, MediaDevices> = Navigator.with(
  (n) => n.mediaDevices,
)

export const getMediaSession: Effect.Effect<Navigator, never, MediaSession> = Navigator.with(
  (n) => n.mediaSession,
)

export const checkOnline: Effect.Effect<Navigator, never, boolean> = Navigator.with((n) => n.onLine)

export const checkPdfViewerEnabled: Effect.Effect<Navigator, never, boolean> = Navigator.with(
  (n) => n.pdfViewerEnabled,
)

export const getUserAgent: Effect.Effect<Navigator, never, string> = Navigator.with(
  (n) => n.userAgent,
)

export const createCredential = (
  options?: CredentialCreationOptions,
): Effect.Effect<Navigator, never, Option<Credential>> =>
  pipe(
    Navigator.withEffect((n) => Effect.promise(() => n.credentials.create(options))),
    Effect.map(fromNullable),
  )

export const getCredential = (
  options?: CredentialRequestOptions,
): Effect.Effect<Navigator, never, Option<Credential>> =>
  pipe(
    Navigator.withEffect((n) => Effect.promise(() => n.credentials.get(options))),
    Effect.map(fromNullable),
  )

export const storeCredential = (
  credential: Credential,
): Effect.Effect<Navigator, never, Credential> =>
  Navigator.withEffect((n) => Effect.promise(() => n.credentials.store(credential)))

export const getCurrentPosition = (
  options?: PositionOptions,
): Effect.Effect<Navigator, GeolocationPositionError, GeolocationPosition> =>
  Navigator.withEffect((n) =>
    Effect.tryCatchPromise(
      () =>
        new Promise<GeolocationPosition>((resolve, reject) =>
          n.geolocation.getCurrentPosition(resolve, reject, options),
        ),
      (e) => e as GeolocationPositionError,
    ),
  )

export const watchPosition = (
  options?: PositionOptions,
): Fx.Fx<Navigator, GeolocationPositionError, GeolocationPosition> =>
  Navigator.withFx((n) =>
    Fx.fromEmitter((emitter) => {
      const id = n.geolocation.watchPosition(
        emitter.event,
        (e) => emitter.error(Cause.fail(e)),
        options,
      )

      return Effect.addFinalizer(() => Effect.sync(() => n.geolocation.clearWatch(id)))
    }),
  )
