import * as Cause from '@effect/core/io/Cause'
import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Maybe, fromNullable } from '@tsplus/stdlib/data/Maybe'
import * as T from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'

export namespace Navigator {
  export const Tag: T.Tag<Navigator> = T.Tag<Navigator>()
  export const provide = (navigator: globalThis.Navigator) => Effect.provideService(Tag, navigator)
}

export const getNavigator: Effect.Effect<Navigator, never, globalThis.Navigator> = Effect.service(
  Navigator.Tag,
)

export const canShare = (shareData?: ShareData) =>
  Effect.serviceWith(Navigator.Tag, (n) => n.canShare(shareData))

export const share = (shareData: ShareData) =>
  Effect.serviceWithEffect(Navigator.Tag, (n) => Effect.promise(() => n.share(shareData)))

export const readClipboardText = Effect.serviceWithEffect(Navigator.Tag, (n) =>
  Effect.promise(() => n.clipboard.readText()),
)

export const writeClipboardText = (text: string) =>
  Effect.serviceWithEffect(Navigator.Tag, (n) => Effect.promise(() => n.clipboard.writeText(text)))

export const readClipboard = Effect.serviceWithEffect(Navigator.Tag, (n) =>
  Effect.promise(() => n.clipboard.read()),
)

export const makeClipoboardItem = (
  items: Record<string, string | Blob | PromiseLike<string | Blob>>,
  options?: ClipboardItemOptions | undefined,
) => Effect.serviceWith(GlobalThis.Tag, (g) => new g.ClipboardItem(items, options))

export const writeClipboard = (items: ClipboardItems) =>
  Effect.serviceWithEffect(Navigator.Tag, (n) => Effect.promise(() => n.clipboard.write(items)))

export const checkCookieEnabled = Effect.serviceWith(Navigator.Tag, (n) => n.cookieEnabled)
export const getHardwareConcurrency = Effect.serviceWith(
  Navigator.Tag,
  (n) => n.hardwareConcurrency,
)
export const getMaxTouchPoints = Effect.serviceWith(Navigator.Tag, (n) => n.maxTouchPoints)
export const getMediaDevices = Effect.serviceWith(Navigator.Tag, (n) => n.mediaDevices)
export const getMediaSession = Effect.serviceWith(Navigator.Tag, (n) => n.mediaSession)
export const checkOnline = Effect.serviceWith(Navigator.Tag, (n) => n.onLine)
export const checkPdfViewerEnabled = Effect.serviceWith(Navigator.Tag, (n) => n.pdfViewerEnabled)
export const getUserAgent = Effect.serviceWith(Navigator.Tag, (n) => n.userAgent)

export const createCredential = (
  options?: CredentialCreationOptions,
): Effect.Effect<Navigator, never, Maybe<Credential>> =>
  pipe(
    Effect.serviceWithEffect(Navigator.Tag, (n) =>
      Effect.promise(() => n.credentials.create(options)),
    ),
    Effect.map(fromNullable),
  )

export const getCredential = (
  options?: CredentialRequestOptions,
): Effect.Effect<Navigator, never, Maybe<Credential>> =>
  pipe(
    Effect.serviceWithEffect(Navigator.Tag, (n) =>
      Effect.promise(() => n.credentials.get(options)),
    ),
    Effect.map(fromNullable),
  )

export const storeCredential = (credential: Credential) =>
  Effect.serviceWithEffect(Navigator.Tag, (n) =>
    Effect.promise(() => n.credentials.store(credential)),
  )

export const getCurrentPosition = (options?: PositionOptions) =>
  Effect.serviceWithEffect(Navigator.Tag, (n) =>
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
  Fx.fromFxEffect(
    Effect.serviceWith(Navigator.Tag, (n) =>
      Fx.withEmitter<never, GeolocationPositionError, GeolocationPosition>((emitter) => {
        const id = n.geolocation.watchPosition(
          emitter.unsafeEmit,
          (e) => emitter.unsafeFailCause(Cause.fail(e)),
          options,
        )

        return Effect.sync(() => n.geolocation.clearWatch(id))
      }),
    ),
  )
