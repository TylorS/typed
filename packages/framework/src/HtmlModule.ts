import type { IncomingMessage } from 'http'

import type { ServerWindowOptions } from './makeServerWindow.js'

export interface HtmlModule {
  /**
   * The path to the directory where assets will be found
   */
  readonly assetDirectory: string | null

  /**
   * The html to utilize for rendering
   */
  readonly html: string

  /**
   * Html attributes that should be re-added to the document element
   */
  readonly htmlAttributes: Record<string, string>

  /**
   * The docType of the html
   */
  readonly docType: string

  /**
   * Construct a server-side implementation of Window & GlobalThis
   */
  readonly makeWindow: (
    req: IncomingMessage,
    options?: ServerWindowOptions,
  ) => Window &
    typeof globalThis &
    Pick<InstanceType<typeof import('happy-dom').Window>, 'happyDOM'>
}
