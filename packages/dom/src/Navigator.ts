import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as T from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import { Option, fromNullable } from '@fp-ts/data/Option'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'

export interface Navigator extends globalThis.Navigator {}

export namespace Navigator {
  export const Tag: T.Tag<Navigator> = T.Tag<Navigator>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getNavigator: Effect.Effect<Navigator, never, globalThis.Navigator> = Effect.service(
  Navigator.Tag,
)

export const canShare = (shareData?: ShareData) => Navigator.access((n) => n.canShare(shareData))

export const share = (shareData: ShareData) =>
  Navigator.accessEffect((n) => Effect.promise(() => n.share(shareData)))

export const readClipboardText = Navigator.accessEffect((n) =>
  Effect.promise(() => n.clipboard.readText()),
)

export const writeClipboardText = (text: string) =>
  Navigator.accessEffect((n) => Effect.promise(() => n.clipboard.writeText(text)))

export const readClipboard = Navigator.accessEffect((n) => Effect.promise(() => n.clipboard.read()))

export const makeClipoboardItem = (
  items: Record<string, string | Blob | PromiseLike<string | Blob>>,
  options?: ClipboardItemOptions | undefined,
) => GlobalThis.access((g) => new g.ClipboardItem(items, options))

export const writeClipboard = (items: ClipboardItems) =>
  Navigator.accessEffect((n) => Effect.promise(() => n.clipboard.write(items)))

export const checkCookieEnabled = Navigator.access((n) => n.cookieEnabled)
export const getHardwareConcurrency = Navigator.access((n) => n.hardwareConcurrency)
export const getMaxTouchPoints = Navigator.access((n) => n.maxTouchPoints)
export const getMediaDevices = Navigator.access((n) => n.mediaDevices)
export const getMediaSession = Navigator.access((n) => n.mediaSession)
export const checkOnline = Navigator.access((n) => n.onLine)
export const checkPdfViewerEnabled = Navigator.access((n) => n.pdfViewerEnabled)
export const getUserAgent = Navigator.access((n) => n.userAgent)

export const createCredential = (
  options?: CredentialCreationOptions,
): Effect.Effect<Navigator, never, Option<Credential>> =>
  pipe(
    Navigator.accessEffect((n) => Effect.promise(() => n.credentials.create(options))),
    Effect.map(fromNullable),
  )

export const getCredential = (
  options?: CredentialRequestOptions,
): Effect.Effect<Navigator, never, Option<Credential>> =>
  pipe(
    Navigator.accessEffect((n) => Effect.promise(() => n.credentials.get(options))),
    Effect.map(fromNullable),
  )

export const storeCredential = (credential: Credential) =>
  Navigator.accessEffect((n) => Effect.promise(() => n.credentials.store(credential)))

export const getCurrentPosition = (options?: PositionOptions) =>
  Navigator.accessEffect((n) =>
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
  Navigator.accessFx((n) =>
    Fx.fromEmitter((emitter) => {
      const id = n.geolocation.watchPosition(
        emitter.emit,
        (e) => emitter.failCause(Cause.fail(e)),
        options,
      )

      return Effect.addFinalizer(() => Effect.sync(() => n.geolocation.clearWatch(id)))
    }),
  )
