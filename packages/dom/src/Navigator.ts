/**
 * Low-level Effect wrappers for Location and its usage via Context.
 * @since 8.19.0
 */

import * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { fromNullable, type Option } from "effect/Option"

import { GlobalThis } from "./GlobalThis.js"

/**
 * A Context for the Navigator API
 * @since 8.19.0
 * @category models
 */
export interface Navigator extends globalThis.Navigator {}

/**
 * A Context for the Navigator API
 * @since 8.19.0
 * @category context
 */
export const Navigator: Context.Tagged<Navigator> = Context.Tagged<Navigator>("@typed/dom/Navigator")

/**
 * Check to see if the current navigator can share
 * @since 8.19.0
 * @category actions
 */
export const canShare: (shareData?: ShareData) => Effect.Effect<boolean, never, Navigator> = (
  shareData?: ShareData
) => Navigator.with((n) => n.canShare(shareData))

/**
 * Share data with the current navigator
 * @since 8.19.0
 * @category actions
 */
export const share: (shareData: ShareData) => Effect.Effect<void, never, Navigator> = (
  shareData: ShareData
) => Navigator.withEffect((n) => Effect.promise(() => n.share(shareData)))

/**
 * Read text from the clipboard
 * @since 8.19.0
 * @category getters
 */
export const readClipboardText: Effect.Effect<string, never, Navigator> = Navigator.withEffect(
  (n) => Effect.promise(() => n.clipboard.readText())
)

/**
 * Write text from the clipboard
 * @since 8.19.0
 * @category actions
 */
export const writeClipboardText: (text: string) => Effect.Effect<void, never, Navigator> = (
  text: string
) => Navigator.withEffect((n) => Effect.promise(() => n.clipboard.writeText(text)))

/**
 * Read from the clipboard
 * @since 8.19.0
 * @category getters
 */
export const readClipboard: Effect.Effect<ClipboardItems, never, Navigator> = Navigator.withEffect(
  (n) => Effect.promise(() => n.clipboard.read())
)

/**
 * Create a new ClipboardItem
 * @since 8.19.0
 * @category constructors
 */
export const makeClipoboardItem = (
  items: Record<string, string | Blob | PromiseLike<string | Blob>>,
  options?: ClipboardItemOptions | undefined
): Effect.Effect<ClipboardItem, never, GlobalThis> => GlobalThis.with((g) => new g.ClipboardItem(items, options))

/**
 * Write clipboard items
 * @since 8.19.0
 * @category actions
 */
export const writeClipboard = (items: ClipboardItems): Effect.Effect<void, never, Navigator> =>
  Navigator.withEffect((n) => Effect.promise(() => n.clipboard.write(items)))

/**
 * Check to see if the current navigator can utilize cookies
 * @since 8.19.0
 * @category getters
 */
export const checkCookieEnabled: Effect.Effect<boolean, never, Navigator> = Navigator.with(
  (n) => n.cookieEnabled
)

/**
 * Check to see if the current navigator concurrency
 * @since 8.19.0
 * @category getters
 */
export const getHardwareConcurrency: Effect.Effect<number, never, Navigator> = Navigator.with(
  (n) => n.hardwareConcurrency
)

/**
 * Check to see if the current navigator's max touch points
 * @since 8.19.0
 * @category getters
 */
export const getMaxTouchPoints: Effect.Effect<number, never, Navigator> = Navigator.with(
  (n) => n.maxTouchPoints
)

/**
 * Check to see if the current navigator has any media devices
 * @since 8.19.0
 * @category getters
 */
export const getMediaDevices: Effect.Effect<MediaDevices, never, Navigator> = Navigator.with(
  (n) => n.mediaDevices
)

/**
 * Check to see if the current navigator has any media sessions
 * @since 8.19.0
 * @category getters
 */
export const getMediaSession: Effect.Effect<MediaSession, never, Navigator> = Navigator.with(
  (n) => n.mediaSession
)

/**
 * Check to see if the current navigator is online
 * @since 8.19.0
 * @category getters
 */
export const checkOnline: Effect.Effect<boolean, never, Navigator> = Navigator.with((n) => n.onLine)

/**
 * Check to see if the current navigator has a PDF viewer
 * @since 8.19.0
 * @category getters
 */
export const checkPdfViewerEnabled: Effect.Effect<boolean, never, Navigator> = Navigator.with(
  (n) => n.pdfViewerEnabled
)

/**
 * Get the current navigator's user agent
 * @since 8.19.0
 * @category getters
 */
export const getUserAgent: Effect.Effect<string, never, Navigator> = Navigator.with(
  (n) => n.userAgent
)

/**
 * Create a new Credential
 * @since 8.19.0
 * @category constructors
 */
export const createCredential = (
  options?: CredentialCreationOptions
): Effect.Effect<Option<Credential>, never, Navigator> =>
  pipe(
    Navigator.withEffect((n) => Effect.promise(() => n.credentials.create(options))),
    Effect.map(fromNullable)
  )

/**
 * Get a Credential
 * @since 8.19.0
 * @category getters
 */
export const getCredential = (
  options?: CredentialRequestOptions
): Effect.Effect<Option<Credential>, never, Navigator> =>
  pipe(
    Navigator.withEffect((n) => Effect.promise(() => n.credentials.get(options))),
    Effect.map(fromNullable)
  )

/**
 * Store a Credential
 * @since 8.19.0
 * @category actions
 */
export const storeCredential = (
  credential: Credential
): Effect.Effect<Credential, never, Navigator> =>
  Navigator.withEffect((n) => Effect.promise(() => n.credentials.store(credential)))

/**
 * Get the current navigator's geolocation
 * @since 8.19.0
 * @category getters
 */
export const getCurrentPosition = (
  options?: PositionOptions
): Effect.Effect<GeolocationPosition, GeolocationPositionError, Navigator> =>
  Navigator.withEffect((n) =>
    Effect.tryPromise({
      try: () =>
        new Promise<GeolocationPosition>((resolve, reject) =>
          n.geolocation.getCurrentPosition(resolve, reject, options)
        ),
      catch: (e) => e as GeolocationPositionError
    })
  )
