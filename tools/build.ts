import remapping from '@ampproject/remapping'
import { BuildOptions, Service, startService } from 'esbuild'
import * as E from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'
import * as O from 'fp-ts/dist/Option'
import * as RA from 'fp-ts/dist/ReadonlyArray'
import * as TE from 'fp-ts/dist/TaskEither'
import fs from 'fs'
import MagicString from 'magic-string'
import { EOL } from 'os'
import { extname, join } from 'path'

// TODO: implement a watch mode
// const watchMode = process.argv.includes('--watch')

const ROOT_DIR = join(__dirname, '..')
const SOURCE_DIR = join(ROOT_DIR, 'src')

const EXTERNALS = ['fp-ts/*', '@typed/fp/*', '@most/adapter', '@most/*']
const textDecoder = new TextDecoder('utf-8')
const typedFpImport = /from\s"@typed\/fp\/([a-z0-9-_]+)"/gi
const fpTsImport = /from\s"fp-ts\/([a-z0-9-_]+)"/gi

const replaceTypedFpImports = (s: MagicString, offset = 0): void => {
  const match = s.original.slice(offset).match(typedFpImport)

  if (!match) {
    return
  }

  const part = match[0]
  const start = s.original.indexOf(part, offset)
  const end = start + part.length
  const replacement = part.replace(typedFpImport, 'from "../$1/$1.mjs"')

  s.overwrite(start, end, replacement)

  replaceTypedFpImports(s, offset + part.length)
}

const replaceFpTsImports = (s: MagicString, offset = 0): void => {
  const match = s.original.slice(offset).match(fpTsImport)

  if (!match) {
    return
  }

  const part = match[0]
  const start = s.original.indexOf(part, offset)
  const end = start + part.length
  const replacement = part.replace(fpTsImport, 'from "fp-ts/$1/$1.es6.js"')

  s.overwrite(start, end, replacement)

  replaceFpTsImports(s, offset + part.length)
}

const readdir = (path: string) =>
  pipe(
    TE.taskify(
      (
        path: fs.PathLike,
        cb: (err: NodeJS.ErrnoException | null, files: readonly string[]) => void,
      ) => fs.readdir(path, cb),
    )(path),
    TE.mapLeft((e) => new Error(e.message)),
  )

const writeFile = TE.taskify(fs.writeFile)
const readFile = TE.taskify(fs.readFile)

const zipPar = RA.sequence(TE.ApplicativePar)

const program = pipe(
  SOURCE_DIR,
  readdir,
  TE.bindTo('moduleNames'),
  TE.bind('service', () => TE.fromTask(() => startService({}))),
  TE.bind('modules', ({ moduleNames, service }) => createModules(moduleNames, service)),
  TE.chain(({ service, modules }) =>
    zipPar<any, any>([TE.fromIO(service.stop), writeModules(modules)]),
  ),
)

program()
  .then(
    E.match(
      (error) => {
        console.error(error)
        process.exitCode = 1
      },
      () => {
        console.log('Done!')
        process.exitCode = 0
      },
    ),
  )
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

type Modules = Record<string, Module>
type Module = { packageJson: string; esm: Bundle }
type Bundle = { source: string; map: string }

function createModules(
  moduleNames: readonly string[],
  service: Service,
): TE.TaskEither<Error, Modules> {
  return pipe(
    moduleNames.map((name) => createModule(name, service)),
    zipPar,
    TE.map((bundles) => bundles.reduce((a, b) => ({ ...a, ...b }), {} as Modules)),
  )
}

function createModule(name: string, service: Service): TE.TaskEither<Error, Modules> {
  const moduleDir = join(ROOT_DIR, name)

  return pipe(
    TE.Do,
    TE.map(() => {
      console.log(`Creating ${name}...`)

      return {}
    }),
    TE.bind('esm', () =>
      createBundle(name, service, {
        mainFields: ['module', 'jsnext:main', 'main'],
        outfile: join(moduleDir, `${name}.mjs`),
        outExtension: { '.js': '.mjs' },
        external: EXTERNALS,
        format: 'esm',
      }),
    ),
    TE.bind('packageJson', () => createPackageJson(name)),
    TE.map((mod) => {
      console.log(`Created module ${name}!`)

      return { [name]: mod }
    }),
  )
}

function createBundle(
  name: string,
  service: Service,
  options: BuildOptions,
): TE.TaskEither<Error, Bundle> {
  return async () => {
    try {
      const entry = join(SOURCE_DIR, name, 'index.ts')
      const result = await service.build({
        entryPoints: [entry],
        sourcemap: true,
        write: false,
        platform: 'node',
        bundle: true,
        ...options,
      })
      const source = result.outputFiles?.find((x) => ['.js', '.mjs'].includes(extname(x.path)))
        ?.contents
      const map = result.outputFiles?.find((x) => extname(x.path) === '.map')?.contents

      if (!source || !map) {
        return E.left(new Error(`Unable to properly build ${name}`))
      }

      return E.right({
        source: textDecoder.decode(source),
        map: textDecoder.decode(map),
      })
    } catch (error) {
      return E.left(error)
    }
  }
}

function createPackageJson(name: string) {
  const base = {
    main: `index.js`,
    module: `${name}.mjs`,
    types: `index.d.ts`,
    typings: `index.d.ts`,
    sideEffects: false,
  }

  return pipe(
    name,
    readPackageJson,
    TE.map(
      O.match(
        () => JSON.stringify(base, null, 2) + EOL,
        (current) => JSON.stringify({ ...JSON.parse(current), ...base }, null, 2) + EOL,
      ),
    ),
  )
}

function readPackageJson(name: string) {
  const fileName = join(ROOT_DIR, name, 'package.json')

  if (fs.existsSync(fileName)) {
    return pipe(
      fileName,
      readFile,
      TE.bimap(
        (e) => new Error(e.message),
        (b) => O.some(b.toString()),
      ),
    )
  }

  return TE.of<O.Option<string>, Error>(O.none)
}

function writeModules(modules: Modules) {
  console.log('Writing Modules!')

  return zipPar(Object.entries(modules).map(writeModule))
}

function writeModule([moduleName, { packageJson, esm }]: [string, Module]) {
  const esmSource = new MagicString(esm.source, {
    filename: `${moduleName}.mjs`,
    indentExclusionRanges: [],
  })

  replaceTypedFpImports(esmSource)
  replaceFpTsImports(esmSource)

  const esmMap = esmSource
    .generateMap({ hires: true, file: `${moduleName}.mjs`, includeContent: true })
    .toString()
  const remappedEsmMap = remapping([esmMap, esm.map], () => null).toString()

  const files = [
    [`${moduleName}/package.json`, packageJson + EOL],
    [`${moduleName}/${moduleName}.mjs`, esmSource.toString()],
    [`${moduleName}/${moduleName}.mjs.map`, formatJsonString(remappedEsmMap)],
  ] as const

  return zipPar(files.map(([name, contents]) => writeFile(name, contents)))
}

function formatJsonString(s: string) {
  return JSON.stringify(JSON.parse(s), null, 2)
}
