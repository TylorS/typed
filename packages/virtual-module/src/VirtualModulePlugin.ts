import { Options } from './Options.js'
import { VirtualModule } from './VirtualModule.js'

export abstract class VirtualModulePlugin {
  abstract readonly name: string

  abstract readonly prefixes: readonly string[]

  abstract resolveId(id: string, importer: string): string | void | undefined

  abstract load(id: string, importer: string): VirtualModule | void | undefined

  constructor(readonly options: Options) {}

  protected trimPrefix(id: string) {
    for (const prefix of this.prefixes) {
      if (id.startsWith(prefix)) {
        return id.slice(prefix.length)
      }
    }
    return id
  }
}
