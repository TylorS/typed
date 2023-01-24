import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { type Option, fromNullable } from '@fp-ts/data/Option'
import * as C from '@typed/context'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'

export interface Navigator extends globalThis.Navigator {}

export const Navigator = C.Tag<Navigator>('@typed/dom/Navigator')

export const canShare = (shareData?: ShareData) => Navigator.with((n) => n.canShare(shareData))

export const share = (shareData: ShareData) =>
  Navigator.withEffect((n) => Effect.promise(() => n.share(shareData)))

export const readClipboardText = Navigator.withEffect((n) =>
  Effect.promise(() => n.clipboard.readText()),
)

export const writeClipboardText = (text: string) =>
  Navigator.withEffect((n) => Effect.promise(() => n.clipboard.writeText(text)))

export const readClipboard = Navigator.withEffect((n) => Effect.promise(() => n.clipboard.read()))

export const makeClipoboardItem = (
  items: Record<string, string | Blob | PromiseLike<string | Blob>>,
  options?: ClipboardItemOptions | undefined,
) => GlobalThis.with((g) => new g.ClipboardItem(items, options))

export const writeClipboard = (items: ClipboardItems) =>
  Navigator.withEffect((n) => Effect.promise(() => n.clipboard.write(items)))

export const checkCookieEnabled = Navigator.with((n) => n.cookieEnabled)
export const getHardwareConcurrency = Navigator.with((n) => n.hardwareConcurrency)
export const getMaxTouchPoints = Navigator.with((n) => n.maxTouchPoints)
export const getMediaDevices = Navigator.with((n) => n.mediaDevices)
export const getMediaSession = Navigator.with((n) => n.mediaSession)
export const checkOnline = Navigator.with((n) => n.onLine)
export const checkPdfViewerEnabled = Navigator.with((n) => n.pdfViewerEnabled)
export const getUserAgent = Navigator.with((n) => n.userAgent)

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

export const storeCredential = (credential: Credential) =>
  Navigator.withEffect((n) => Effect.promise(() => n.credentials.store(credential)))

export const getCurrentPosition = (options?: PositionOptions) =>
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
        emitter.emit,
        (e) => emitter.failCause(Cause.fail(e)),
        options,
      )

      return Effect.addFinalizer(() => Effect.sync(() => n.geolocation.clearWatch(id)))
    }),
  )
