import type { CAC } from 'cac'

import { runViteNode, type RunViteNodeOptions } from '../runViteNode.js'

/**
 * Run a file with vite-node
 */
export const run = (cli: CAC, cwd: string) =>
  cli
    .command('run [...files]', 'Build your project')
    .option('-r, --root <path>', 'Use specified root directory')
    .option('-c, --config <path>', 'Use specified config file')
    .option('-w, --watch', 'Restart on file changes, similar to "nodemon"')
    .option('-s, --static', 'Set static build flag for @typed/vite-plugin')
    .option('--options <options>', 'Use specified Vite server options')
    .action((files: string[], options: RunViteNodeOptions) =>
      runViteNode(files, options, { cwd, outputHelp: () => cli.outputHelp() }),
    )
