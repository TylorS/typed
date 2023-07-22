import { System } from 'typescript'

import { VirtualModuleManager } from './VirtualModuleManager.js'
import { createOverrides } from './utils.js'

export function makeVirtualSys(sys: System, manager: VirtualModuleManager): System {
  return createOverrides(sys, {
    readFile: (original) => (fileName) => original(fileName) || manager.readFile(fileName),
    fileExists: (original) => (fileName) => original(fileName) || manager.hasFileName(fileName),
  })
}
