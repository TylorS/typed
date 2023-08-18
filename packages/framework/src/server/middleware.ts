// TODO: Static file serving middleware
// TODO: Must accept a directory and options
// TODO: options should include: cache control, compression types, include/exclude, etc.
// TODO: Must use accept-encoding header to determine whether to serve compressed or uncompressed
// TODO: The Vary Header is required for caching proxies to work properly

// TODO: Must take a request and map it to possible files to serve, determine if they exist, and serve them
// TODO: Determine content type based on file extension
// Compute and cache requests for files to their file paths

import { extname, join, resolve } from 'node:path'

import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as PlatformError from '@effect/platform/Error'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Http from '@effect/platform-node/HttpServer'
import * as pluginutils from '@rollup/pluginutils'
import * as Context from '@typed/context'

export interface StaticFileOptions {
  readonly directory: string
  readonly enable?: boolean
  readonly include?: readonly string[]
  readonly exclude?: readonly string[]
  readonly extensions?: readonly string[]
  readonly compressions?: {
    readonly [AcceptEncoding: string]: string // FileExtension
  }
}

export const GetStaticFile = Context.Fn<
  (
    request: Http.request.ServerRequest,
  ) => Effect.Effect<never, never, Option.Option<Http.response.ServerResponse>>
>()(class GetStaticFile extends Context.id('@typed/framework/server/GetStaticFile') {})
export type GetStaticFile = Context.Tag.Identifier<typeof GetStaticFile>

export const staticFileMiddleware = (
  options: StaticFileOptions,
): (<R, E>(
  app: Http.app.Default<R, E>,
) => Http.app.Default<R | FileSystem.FileSystem, E | PlatformError.PlatformError>) =>
  Http.middleware.make((app) => {
    if (options.enable === false) return app

    return Http.request.ServerRequest.pipe(
      Effect.flatMap(GetStaticFile.apply),
      Effect.flatMap(
        Option.match({
          onNone: () => app,
          onSome: Effect.succeed,
        }),
      ),
      Effect.provideSomeLayer(staticFileLayer(options)),
    )
  })

function staticFileLayer(
  options: StaticFileOptions,
): Layer.Layer<FileSystem.FileSystem, PlatformError.PlatformError, GetStaticFile> {
  return GetStaticFile.layerScoped(
    Effect.gen(function* (_) {
      const ctx = yield* _(Effect.context<FileSystem.FileSystem>())
      const files = yield* _(readDirectory(options))
      const [urlToFilePath, filePathToCompressions] = buildRequestMaps(
        options.directory,
        files,
        options.extensions,
      )

      return (request: Http.request.ServerRequest) => {
        if (!(request.method === 'GET' || request.method === 'HEAD')) {
          return Effect.succeed(Option.none())
        }

        const filePath = urlToFilePath.get(request.url)

        if (!filePath) return Effect.succeed(Option.none())

        const compressions = filePathToCompressions.get(filePath)

        if (compressions) {
          const encodings = parseRequestAcceptEncoding(request)

          for (const { name } of encodings) {
            if (name in compressions) {
              const { path, contentType } = compressions[name]

              return fileStreamResponse(path, name, contentType).pipe(
                Effect.map(Option.some),
                Effect.provideSomeContext(ctx),
              )
            }
          }
        }

        return fileStreamResponse(filePath).pipe(
          Effect.map(Option.some),
          Effect.provideSomeContext(ctx),
        )
      }
    }),
  )
}

function fileStreamResponse(
  path: string,
  encoding?: string,
  contentType?: string,
): Effect.Effect<FileSystem.FileSystem, never, Http.response.ServerResponse> {
  return FileSystem.FileSystem.pipe(
    Effect.map((fs) =>
      Http.response.stream(fs.stream(path), {
        headers: Http.headers.empty.pipe(
          encoding ? Http.headers.set('content-encoding', encoding) : (x) => x,
        ),
        contentType: contentType ?? fileExtensionToContentType(extname(path)),
      }),
    ),
  )
}

function readDirectory({
  directory,
  include,
  exclude,
}: StaticFileOptions): Effect.Effect<FileSystem.FileSystem, PlatformError.PlatformError, string[]> {
  const filter = pluginutils.createFilter(include, exclude, {
    resolve: directory,
  })

  return Effect.gen(function* (_) {
    const fs = yield* _(FileSystem.FileSystem)
    const paths = yield* _(readDirectoryRecursively(fs, directory))

    return paths.filter((path) => filter(join(directory, path)))
  })
}

function buildRequestMaps(
  directory: string,
  paths: readonly string[],
  extensions: readonly string[] = ['.html'],
  compressions: StaticFileOptions['compressions'] = {
    gzip: '.gz',
  },
): readonly [
  urlToFilePath: ReadonlyMap<string, string>,
  filePathToCompressions: ReadonlyMap<
    string,
    Record<string, { path: string; contentType: string }>
  >,
] {
  const urlToFilePath = new Map<string, string>()
  const filePathToCompressions = new Map<
    string,
    Record<string, { path: string; contentType: string }>
  >()
  const compressionExtensions = new Set(Object.values(compressions))
  const compressionExtensionToEncoding = Object.fromEntries(
    Object.entries(compressions).map(([k, v]) => [v, k]),
  )

  const hasHtmlExtension = extensions.includes('.html')

  function addFilePathForExtension(path: string, extension: string): void {
    const absolutePath = resolve(directory, path)

    if (path.endsWith(extension)) {
      urlToFilePath.set(join('/', path.slice(0, -extension.length)), absolutePath)
    }
  }

  function addCompressionForFilePath(path: string, compressionExtension: string): void {
    const absoluteCompressedPath = resolve(directory, path)
    const absolutePath = absoluteCompressedPath.slice(0, -compressionExtension.length)

    if (path.endsWith(compressionExtension)) {
      const encoding = compressionExtensionToEncoding[compressionExtension]
      const compressions = filePathToCompressions.get(absolutePath) ?? {}

      compressions[encoding] = {
        path: absoluteCompressedPath,
        contentType: fileExtensionToContentType(extname(absolutePath)),
      }
      filePathToCompressions.set(absolutePath, compressions)
    }
  }

  for (const path of paths) {
    const absolutePath = resolve(directory, path)

    // Direct mapping is always utilized
    urlToFilePath.set(join('/', path), absolutePath)

    for (const extension of extensions) {
      addFilePathForExtension(path, extension)
    }

    if (hasHtmlExtension) {
      const isIndexHtml = path === 'index.html' || path.endsWith('/index.html')

      if (isIndexHtml) {
        urlToFilePath.set(join('/', path.slice(0, -10)), absolutePath)
      }
    }

    for (const extension of compressionExtensions) {
      if (
        path.endsWith(extension) &&
        urlToFilePath.has(join('/', path.slice(0, -extension.length)))
      ) {
        addCompressionForFilePath(path, extension)
      }
    }
  }

  return [urlToFilePath, filePathToCompressions]
}

function readDirectoryRecursively(
  fs: FileSystem.FileSystem,
  directory: string,
): Effect.Effect<FileSystem.FileSystem, PlatformError.PlatformError, readonly string[]> {
  return Effect.gen(function* (_) {
    const paths = yield* _(fs.readDirectory(directory))
    const files: string[] = []
    const directories: string[] = []

    for (const path of paths) {
      const stat = yield* _(fs.stat(join(directory, path)))

      if (stat.type === 'Directory') {
        directories.push(path)
      } else if (stat.type === 'File') {
        files.push(path)
      } else if (stat.type === 'SymbolicLink') {
        // TODO: Resolve symbolic links
      }
    }

    const subdirectories = yield* _(
      Effect.forEach(
        directories,
        (subdir) =>
          readDirectoryRecursively(fs, join(directory, subdir)).pipe(
            Effect.map((paths) => paths.map((path) => join(subdir, path))),
          ),
        {
          concurrency: 'unbounded',
        },
      ),
    )

    return [...files, ...subdirectories.flat()]
  })
}

function parseRequestAcceptEncoding(request: Http.request.ServerRequest): Encoding[] {
  return Http.headers.get(request.headers, 'accept-encoding').pipe(
    Option.map((header) => parseAcceptEncoding(header)),
    Option.getOrElse(() => []),
  )
}

interface Encoding {
  name: string
  weight: number
}

function parseAcceptEncoding(header: string): Encoding[] {
  const encodings: Encoding[] = []

  if (header) {
    const encodingStrings = header.split(',')

    for (const encodingString of encodingStrings) {
      const parts = encodingString.trim().split(';')

      const name = parts[0].trim()
      const weight = parts[1] ? parseFloat(parts[1].trim().split('=')[1]) : 1

      encodings.push({ name, weight })
    }

    // Sort the encodings based on weight (higher weight comes first)
    encodings.sort((a, b) => b.weight - a.weight)
  }

  return encodings
}

function fileExtensionToContentType(extension: string) {
  switch (extension) {
    case '.html':
      return 'text/html'
    case '.css':
      return 'text/css'
    case '.js':
      return 'application/javascript'
    case '.json':
      return 'application/json'
    case '.png':
      return 'image/png'
    case '.jpg':
      return 'image/jpeg'
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    case '.ico':
      return 'image/x-icon'
    case '.webp':
      return 'image/webp'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    case '.ttf':
      return 'font/ttf'
    case '.otf':
      return 'font/otf'
    case '.txt':
      return 'text/plain'
    case '.md':
      return 'text/markdown'
    case '.pdf':
      return 'application/pdf'
    case '.zip':
      return 'application/zip'
    case '.gz':
      return 'application/gzip'
    case '.tar':
      return 'application/x-tar'
    case '.rar':
      return 'application/vnd.rar'
    case '.7z':
      return 'application/x-7z-compressed'
    case '.mp3':
      return 'audio/mpeg'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.weba':
      return 'audio/webm'
    case '.ogg':
      return 'audio/ogg'
    case '.ogv':
      return 'video/ogg'
    case '.oga':
      return 'audio/ogg'
    case '.ogx':
      return 'application/ogg'
    case '.ogm':
      return 'application/ogg'
    case '.srt':
      return 'application/x-subrip'
    case '.xml':
      return 'application/xml'
    case '.webmanifest':
      return 'application/manifest+json'
    default:
      return 'application/octet-stream'
  }
}
