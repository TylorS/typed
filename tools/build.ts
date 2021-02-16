import remapping from '@ampproject/remapping'
import { BuildOptions, Service, startService } from 'esbuild'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import * as TE from 'fp-ts/TaskEither'
import fs from 'fs'
import MagicString from 'magic-string'
import { EOL } from 'os'
import { extname, join } from 'path'
import rimraf from 'rimraf'

// TODO: implement a watch mode
// const watchMode = process.argv.includes('--watch')

const ROOT_DIR = join(__dirname, '..')
const SOURCE_DIR = join(ROOT_DIR, 'src')

const EXTERNALS = ['fp-ts/*', '@typed/fp/*', '@most/adapter', '@most/*']
const textDecoder = new TextDecoder('utf-8')

const es5Import = /(require\("@typed\/fp\/)/g

const replaceES5LocalImports = (s: MagicString): void => {
  const match = s.original.match(es5Import)

  if (!match) {
    return
  }

  let offset = match.index ?? 0

  for (const part of match) {
    const start = s.original.indexOf(part, offset)
    const end = (offset = start + part.length)

    s.overwrite(start, end, 'require("../')
  }
}

const es6Import = /(from "@typed\/fp\/)/g

const replaceES6LocalImports = (s: MagicString): void => {
  const match = s.original.match(es6Import)

  if (!match) {
    return
  }

  let offset = match.index ?? 0

  for (const part of match) {
    const start = s.original.indexOf(part, offset)
    const end = start + part.length

    s.overwrite(start, end, 'from "../')

    offset += part.length
  }
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

const rmdir = TE.taskify(rimraf)
const mkdir = TE.taskify(fs.mkdir)
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
type Module = { packageJson: string; cjs: Bundle; esm: Bundle }
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
  const cjs = createBundle(name, service, {
    mainFields: ['main'],
    outfile: `${name}.js`,
    format: 'cjs',
  })
  const esm = createBundle(name, service, {
    mainFields: ['module', 'jsnext:main', 'main'],
    outfile: `${name}.mjs`,
    format: 'esm',
  })

  const bundles = zipPar([cjs, esm])

  return pipe(
    TE.Do,
    TE.map(() => {
      console.log(`Creating ${name}...`)

      return {}
    }),
    TE.bind('bundles', () => bundles),
    TE.bind('packageJson', () => createPackageJson(name)),
    TE.map(({ packageJson, bundles }) => {
      console.log(`Created module ${name}!`)

      return { [name]: { packageJson, cjs: bundles[0], esm: bundles[1] } }
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
      const moduleDir = join(SOURCE_DIR, name)
      const entry = join(SOURCE_DIR, name, 'index.ts')
      const result = await service.build({
        entryPoints: [entry],
        sourcemap: true,
        bundle: true,
        write: false,
        platform: 'node',
        external: EXTERNALS.filter((x) => !x.startsWith(moduleDir)),
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
    main: `${name}.js`,
    module: `${name}.mjs`,
    types: `${name}.d.ts`,
    typings: `${name}.d.ts`,
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

function writeModule([moduleName, { packageJson, cjs, esm }]: [string, Module]) {
  const dir = join(ROOT_DIR, moduleName)

  const cjsSource = new MagicString(cjs.source, {
    filename: `${moduleName}.js`,
    indentExclusionRanges: [],
  })

  replaceES5LocalImports(cjsSource)

  const cjsMap = cjsSource.generateMap({ hires: true, includeContent: true }).toString()
  const remappedCjsMap =
    cjsSource.toString() === cjsSource.original
      ? cjs.map
      : remapping([cjsMap, cjs.map], () => null).toString()

  const esmSource = new MagicString(esm.source, {
    filename: `${moduleName}.mjs`,
    indentExclusionRanges: [],
  })

  replaceES6LocalImports(esmSource)

  const esmMap = esmSource.generateMap({ hires: true, includeContent: true }).toString()
  const remappedEsmMap =
    esmSource.toString() === esmSource.original
      ? esm.map
      : remapping([esmMap, esm.map], () => null).toString()

  const files = [
    [`${moduleName}/package.json`, packageJson],
    [`${moduleName}/${moduleName}.js`, cjsSource.toString()],
    [`${moduleName}/${moduleName}.js.map`, remappedCjsMap],
    [`${moduleName}/${moduleName}.mjs`, esmSource.toString()],
    [`${moduleName}/${moduleName}.mjs.map`, remappedEsmMap],
  ] as const

  return pipe(
    dir,
    rmdir,
    TE.chain(() => mkdir(dir)),
    TE.mapLeft((e) => new Error(e.message)),
    TE.chain(() => zipPar(files.map(([name, contents]) => writeFile(name, contents)))),
  )
}
