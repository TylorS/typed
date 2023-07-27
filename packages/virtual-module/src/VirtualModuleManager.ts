import ts from 'typescript'

import { VirtualModuleCache } from './VirtualModuleCache.js'
import {
  ProductionParams,
  VirtualModule,
  VirtualModuleGenerateContentParams,
  VirtualModulePlugin,
} from './VirtualModulePlugin.js'

export class VirtualModuleManager {
  // FilePath related
  protected filePathToVirtualModule = new Map<string, VirtualModule>()
  // Key related
  protected keyToPlugin = new Map<string, VirtualModulePlugin<any>>()
  // Lookup keys + filePaths
  protected filePathToKey = new Map<string, string>()
  protected keyToFilePath = new Map<string, string>()

  constructor(
    readonly plugins: VirtualModulePlugin<any>[],
    readonly pluginParams: Record<string, Record<string, unknown>>,
    readonly languageService: () => ts.LanguageService,
    readonly log: (msg: string) => void,
    readonly cache: VirtualModuleCache = new VirtualModuleCache(),
  ) {}

  /**
   * Check to see if there is a plugin configured to resolve the given id.
   */
  readonly matches = (id: string, importer: string): boolean => !!this.getPluginById(id, importer)

  /**
   * Check to see if the given file name has been resolved to a virtual module id.
   */
  readonly hasFileName = (fileName: string): boolean => this.filePathToKey.has(fileName)

  /**
   * Should only be called AFTER `match` has been called. Converts a virtual module id
   * to a real file path.
   */
  readonly resolveFileName = (id: string, importer: string): string => {
    const key = this.key(id, importer)
    const cached = this.keyToFilePath.get(key)

    if (cached) {
      return cached
    }

    const plugin = this.getPluginById(id, importer)

    if (!plugin) {
      throw new Error(`Virtual module plugin not found for ${id}`)
    }

    const virtualModule = plugin.resolveVirtualModule(id, importer)
    const { fileName } = virtualModule

    this.log(`Resolved ${id} to ${fileName}`)

    this.filePathToVirtualModule.set(fileName, virtualModule)
    this.filePathToKey.set(fileName, key)
    this.keyToFilePath.set(key, fileName)

    // TODO: We should probably add/remove event listeners here based on VirtualModule kind.

    return virtualModule.fileName
  }

  readonly getVirtualModule = (fileName: string): VirtualModule => {
    const virtualModule = this.filePathToVirtualModule.get(fileName)

    if (!virtualModule) {
      throw new Error(`Virtual module not found for ${fileName}`)
    }

    return virtualModule
  }

  readonly getVirtualModuleById = (id: string, importer: string): VirtualModule => {
    return this.getVirtualModule(this.resolveFileName(id, importer))
  }

  readonly generateSnapshot = (fileName: string) => {
    const virtualModule = this.filePathToVirtualModule.get(fileName)
    const key = this.filePathToKey.get(fileName)

    if (!virtualModule || !key) {
      throw new Error(`Virtual module not found for ${fileName}`)
    }

    const plugin = this.keyToPlugin.get(key)

    if (!plugin || !plugin.generateTypeScriptContent) {
      throw new Error(`Virtual module plugin not found for ${fileName}`)
    }

    const metadataParams = {
      params: this.pluginParams[plugin.name] || {},
      languageService: this.languageService(),
    }
    const metadata = plugin.generateMetadata(virtualModule, metadataParams)
    const params: VirtualModuleGenerateContentParams<any> = {
      ...metadataParams,
      metadata,
    }
    const content = plugin.generateTypeScriptContent(virtualModule, params)

    return this.cache.setFile(fileName, ts.ScriptSnapshot.fromString(content))
  }

  readonly generateProductionSnapshot = async (fileName: string, prodParams: ProductionParams) => {
    const virtualModule = this.filePathToVirtualModule.get(fileName)
    const key = this.filePathToKey.get(fileName)

    if (!virtualModule || !key) {
      throw new Error(`Virtual module not found for ${fileName}`)
    }

    const plugin = this.keyToPlugin.get(key)

    if (!plugin) {
      throw new Error(`Virtual module plugin not found for ${fileName}`)
    }

    const metadataParams = {
      params: this.pluginParams[plugin.name] || {},
      languageService: this.languageService(),
    }
    const metadata = plugin.generateMetadata(virtualModule, metadataParams)
    const params: VirtualModuleGenerateContentParams<any> = {
      ...metadataParams,
      metadata,
    }
    const content = await (plugin.generateProductionContent || plugin.generateTypeScriptContent)(
      virtualModule,
      params,
      prodParams,
    )

    return this.cache.setFile(fileName, ts.ScriptSnapshot.fromString(content))
  }

  readonly readFile = (fileName: string): string => {
    const snapshot = this.generateSnapshot(fileName).getScriptSnapshot()

    return snapshot.getText(0, snapshot.getLength())
  }

  protected getPluginById(id: string, importer: string) {
    const key = this.key(id, importer)
    const cached = this.keyToPlugin.get(key)

    if (cached) {
      return cached
    }

    const plugin = this.plugins.find((plugin) => plugin.regex.test(id))

    if (!plugin) return null

    this.keyToPlugin.set(key, plugin)

    return plugin
  }

  protected key(id: string, importer: string) {
    return `${id}:::${importer}`
  }
}
