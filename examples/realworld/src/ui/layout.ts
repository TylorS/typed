import { Fx, html } from "@typed/core"
import type { RenderEvent } from "@typed/core"
import assetManifest from "virtual:asset-manifest"
import options from "virtual:typed-options"
import type { ManifestChunk } from "vite"

const { headAssets, script } = getHeadAndScript(options.clientEntry, assetManifest)

export function layout<E, R>({ content }: { content: Fx.Fx<RenderEvent | null, E, R> }) {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RealWorld</title>
        <base href="/" />
        ${headAssets}
      </head>
      <body>
        <div id="app">${content}</div>
        ${script}
      </body>
    </html>`
}

function getHeadAndScript(entry: string, manifest: Record<string, ManifestChunk>) {
  const useScript = entry in manifest
  const { css = [], file, imports = [] } = useScript ? manifest[entry] : { file: entry }
  const modulePreloads = [file, ...imports.map((i) => manifest[i]?.file ?? i)]
  const styles = [...css, ...imports.flatMap((i) => manifest[i]?.css ?? [])]

  return {
    headAssets: Fx.mergeOrdered([
      ...modulePreloads.map((src) =>
        html`<link rel="${useScript ? "preload" : "modulepreload"}" crossOrigin href=${src} />`
      ),
      ...styles.map((href) => html`<link rel="stylesheet" href=${href} />`)
    ]),
    script: html`<script type=${useScript ? undefined : "module"} src=${file}></script>`
  }
}
