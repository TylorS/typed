import type { CAC } from 'cac'

import { addViteCliOptions } from '../ViteCliOptions.js'
import { runMultibuild, type MultibuildOptions } from '../runMultibuild.js'

/**
 * Runs vavite multibuild to trigger @typed/vite-plugin to build all of our entries.
 */
export const build = (cli: CAC, cwd: string) =>
  addViteCliOptions(cli.command('build', 'Build your project as static files'))
    .option('--target <target>', `[string] transpile target (default: 'modules')`)
    .option('--outDir <dir>', `[string] output directory (default: dist)`)
    .option(
      '--assetsDir <dir>',
      `[string] directory under outDir to place assets in (default: _assets)`,
    )
    .option(
      '--assetsInlineLimit <number>',
      `[number] static asset base64 inline threshold in bytes (default: 4096)`,
    )
    .option('--ssr [entry]', `[string] build specified entry for server-side rendering`)
    .option('--sourcemap', `[boolean] output source maps for build (default: false)`)
    .option(
      '--minify [minifier]',
      `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
        `or specify minifier to use (default: esbuild)`,
    )
    .option('--manifest', `[boolean] emit build manifest json`)
    .option('--ssrManifest', `[boolean] emit ssr manifest json`)
    .option('--emptyOutDir', `[boolean] force empty outDir when it's outside of root`)
    .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
    .option('-s, --static [file]', `[string] run a static build with the specified entry file`)
    .option('--options <options>', 'Use specified Vite server options for static builds')
    .action((options: MultibuildOptions) =>
      runMultibuild(options, { cwd, outputHelp: () => cli.outputHelp() }),
    )
