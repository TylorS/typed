import type { Command } from 'cac'
import type { LogLevel } from 'vite'

// Shared options for vite-based commands
export const addViteCliOptions = (cli: Command) =>
  cli
    .option('-c, --config <file>', `[string] use specified vite config file`)
    .option('--base <path>', `[string] public base path (default: /)`)
    .option('-l, --logLevel <level>', `[string] info | warn | error | silent`)
    .option('--clearScreen', `[boolean] allow/disable clear screen when logging`)
    .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
    .option('-f, --filter <filter>', `[string] filter debug logs`)
    .option('-m, --mode <mode>', `[string] set env mode`)

export interface ViteCliOptions {
  '--'?: string[]
  base?: string
  c?: boolean | string
  clearScreen?: boolean
  config?: string
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  force?: boolean
  l?: LogLevel
  logLevel?: LogLevel
  m?: string
  mode?: string
}
