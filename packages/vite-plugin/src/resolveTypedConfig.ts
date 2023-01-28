import { none, some, type Option } from '@fp-ts/core/Option'
import type { ResolvedOptions } from '@typed/compiler'
import { resolveConfig } from 'vite'

import { PLUGIN_NAME } from './constants.js'
import type { TypedVitePlugin } from './vite-plugin.js'

export async function resolveTypedConfig(
  ...args: ArgsOf<typeof resolveConfig>
): Promise<Option<ResolvedOptions>> {
  const config = await resolveConfig(...args)
  const typedPlugin = config.plugins.find((p): p is TypedVitePlugin => p.name === PLUGIN_NAME)

  if (!typedPlugin) {
    return none()
  }

  return some(typedPlugin.resolvedOptions)
}

type ArgsOf<T> = T extends (...args: infer A) => any ? A : never
