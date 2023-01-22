import type { Window, GlobalThis } from '@typed/dom'
import * as happyDom from 'happy-dom'

export interface ServerWindowOptions {
  readonly url: string

  readonly innerWidth?: number
  readonly innerHeight?: number
  readonly settings?: {
    readonly disableJavaScriptEvaluation: boolean
    readonly disableJavaScriptFileLoading: boolean
    readonly disableCSSFileLoading: boolean
    readonly enableFileSystemHttpRequests: boolean
  }
}

export function makeServerWindow(
  options?: ServerWindowOptions,
): Window & GlobalThis & Pick<InstanceType<typeof happyDom.Window>, 'happyDOM'> {
  const win: Window & GlobalThis & Pick<InstanceType<typeof happyDom.Window>, 'happyDOM'> =
    new happyDom.Window({
      ...options,
    }) as any

  return win
}

export const html5Doctype = '<!DOCTYPE html>'
