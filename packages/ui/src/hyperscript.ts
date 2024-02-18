/**
 * Hyperscript for @typed/template.
 * @since 1.0.0
 */

import type { Fx } from "@typed/fx/Fx"
import { fromFxEffect } from "@typed/fx/Fx"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderEvent } from "@typed/template/RenderEvent"
import { RenderTemplate } from "@typed/template/RenderTemplate"
import type { Scope } from "effect"
import type { TypedPropertiesMap } from "./Props.js"

/**
 * @since 1.0.0
 */
export function h<
  const TagName extends keyof TypedPropertiesMap,
  const Props extends TypedPropertiesMap[TagName],
  const Children extends ReadonlyArray<Renderable<any, any>>
>(
  tagName: TagName,
  properties: Props,
  ...children: Children
): Fx<RenderEvent, Placeholder.Error<
  Props[keyof Props] | Children[number]
>, | Scope.Scope
| RenderTemplate
| Placeholder.Context<
  Props[keyof Props] | Children[number]
>> {
  return fromFxEffect(
    RenderTemplate.with((render) => render(getTemplateStringsArrayFor(tagName), [properties, children]))
  )
}

const templateStringsArray = new Map<string, TemplateStringsArray>()

function getTemplateStringsArrayFor(tagName: string): TemplateStringsArray {
  let template = templateStringsArray.get(tagName)

  if (template === undefined) {
    template = makeTemplateStringsArrayFor(tagName)
    templateStringsArray.set(tagName, template)
  }

  return template
}

function makeTemplateStringsArrayFor(tagName: string): TemplateStringsArray {
  const template = [`<${tagName} ...`, `>`, `</${tagName}>`]

  return Object.assign(template, { raw: template })
}

/**
 * @since 1.0.0
 */
export type HyperscriptForTagName<TagName extends keyof TypedPropertiesMap> = <
  const Props extends TypedPropertiesMap[TagName],
  const Children extends ReadonlyArray<Renderable<any, any>>
>(
  properties: Props,
  ...children: Children
) => Fx<RenderEvent, Placeholder.Error<Props[keyof Props] | Children[number]>, Scope.Scope | RenderTemplate | Placeholder.Context<Props[keyof Props] | Children[number]>>

/**
 * @since 1.0.0
 */
export function createHyperscript<const TagName extends keyof TypedPropertiesMap>(
  tagName: TagName
): HyperscriptForTagName<TagName> {
  return <
    const Props extends TypedPropertiesMap[TagName],
    const Children extends ReadonlyArray<Renderable<any, any>>
  >(
    properties: Props,
    ...children: Children
  ): Fx<RenderEvent, Placeholder.Error<
    Props[keyof Props] | Children[number]
  >, | Scope.Scope
  | RenderTemplate
  | Placeholder.Context<
    Props[keyof Props] | Children[number]
  >> => {
    return h(tagName, properties, ...children)
  };
}

/**
 * @since 1.0.0
 */
export const a: HyperscriptForTagName<"a"> = createHyperscript("a")

/**
 * @since 1.0.0
 */
export const abbr: HyperscriptForTagName<"abbr"> = createHyperscript("abbr")

/**
 * @since 1.0.0
 */
export const address: HyperscriptForTagName<"address"> = createHyperscript("address")

/**
 * @since 1.0.0
 */
export const area: HyperscriptForTagName<"area"> = createHyperscript("area")

/**
 * @since 1.0.0
 */
export const article: HyperscriptForTagName<"article"> = createHyperscript("article")

/**
 * @since 1.0.0
 */
export const aside: HyperscriptForTagName<"aside"> = createHyperscript("aside")

/**
 * @since 1.0.0
 */
export const audio: HyperscriptForTagName<"audio"> = createHyperscript("audio")

/**
 * @since 1.0.0
 */
export const b: HyperscriptForTagName<"b"> = createHyperscript("b")

/**
 * @since 1.0.0
 */
export const base: HyperscriptForTagName<"base"> = createHyperscript("base")

/**
 * @since 1.0.0
 */
export const bdi: HyperscriptForTagName<"bdi"> = createHyperscript("bdi")

/**
 * @since 1.0.0
 */
export const bdo: HyperscriptForTagName<"bdo"> = createHyperscript("bdo")

/**
 * @since 1.0.0
 */
export const blockquote: HyperscriptForTagName<"blockquote"> = createHyperscript("blockquote")

/**
 * @since 1.0.0
 */
export const body: HyperscriptForTagName<"body"> = createHyperscript("body")

/**
 * @since 1.0.0
 */
export const br: HyperscriptForTagName<"br"> = createHyperscript("br")

/**
 * @since 1.0.0
 */
export const button: HyperscriptForTagName<"button"> = createHyperscript("button")

/**
 * @since 1.0.0
 */
export const canvas: HyperscriptForTagName<"canvas"> = createHyperscript("canvas")

/**
 * @since 1.0.0
 */
export const caption: HyperscriptForTagName<"caption"> = createHyperscript("caption")

/**
 * @since 1.0.0
 */
export const cite: HyperscriptForTagName<"cite"> = createHyperscript("cite")

/**
 * @since 1.0.0
 */
export const code: HyperscriptForTagName<"code"> = createHyperscript("code")

/**
 * @since 1.0.0
 */
export const col: HyperscriptForTagName<"col"> = createHyperscript("col")

/**
 * @since 1.0.0
 */
export const colgroup: HyperscriptForTagName<"colgroup"> = createHyperscript("colgroup")

/**
 * @since 1.0.0
 */
export const data: HyperscriptForTagName<"data"> = createHyperscript("data")

/**
 * @since 1.0.0
 */
export const datalist: HyperscriptForTagName<"datalist"> = createHyperscript("datalist")

/**
 * @since 1.0.0
 */
export const dd: HyperscriptForTagName<"dd"> = createHyperscript("dd")

/**
 * @since 1.0.0
 */
export const del: HyperscriptForTagName<"del"> = createHyperscript("del")

/**
 * @since 1.0.0
 */
export const details: HyperscriptForTagName<"details"> = createHyperscript("details")

/**
 * @since 1.0.0
 */
export const dfn: HyperscriptForTagName<"dfn"> = createHyperscript("dfn")

/**
 * @since 1.0.0
 */
export const dialog: HyperscriptForTagName<"dialog"> = createHyperscript("dialog")

/**
 * @since 1.0.0
 */
export const div: HyperscriptForTagName<"div"> = createHyperscript("div")

/**
 * @since 1.0.0
 */
export const dl: HyperscriptForTagName<"dl"> = createHyperscript("dl")

/**
 * @since 1.0.0
 */
export const dt: HyperscriptForTagName<"dt"> = createHyperscript("dt")

/**
 * @since 1.0.0
 */
export const em: HyperscriptForTagName<"em"> = createHyperscript("em")

/**
 * @since 1.0.0
 */
export const embed: HyperscriptForTagName<"embed"> = createHyperscript("embed")

/**
 * @since 1.0.0
 */
export const fieldset: HyperscriptForTagName<"fieldset"> = createHyperscript("fieldset")

/**
 * @since 1.0.0
 */
export const figcaption: HyperscriptForTagName<"figcaption"> = createHyperscript("figcaption")

/**
 * @since 1.0.0
 */
export const figure: HyperscriptForTagName<"figure"> = createHyperscript("figure")

/**
 * @since 1.0.0
 */
export const footer: HyperscriptForTagName<"footer"> = createHyperscript("footer")

/**
 * @since 1.0.0
 */
export const form: HyperscriptForTagName<"form"> = createHyperscript("form")

/**
 * @since 1.0.0
 */
export const h1: HyperscriptForTagName<"h1"> = createHyperscript("h1")

/**
 * @since 1.0.0
 */
export const h2: HyperscriptForTagName<"h2"> = createHyperscript("h2")

/**
 * @since 1.0.0
 */
export const h3: HyperscriptForTagName<"h3"> = createHyperscript("h3")

/**
 * @since 1.0.0
 */
export const h4: HyperscriptForTagName<"h4"> = createHyperscript("h4")

/**
 * @since 1.0.0
 */
export const h5: HyperscriptForTagName<"h5"> = createHyperscript("h5")

/**
 * @since 1.0.0
 */
export const h6: HyperscriptForTagName<"h6"> = createHyperscript("h6")

/**
 * @since 1.0.0
 */
export const head: HyperscriptForTagName<"head"> = createHyperscript("head")

/**
 * @since 1.0.0
 */
export const header: HyperscriptForTagName<"header"> = createHyperscript("header")

/**
 * @since 1.0.0
 */
export const hgroup: HyperscriptForTagName<"hgroup"> = createHyperscript("hgroup")

/**
 * @since 1.0.0
 */
export const hr: HyperscriptForTagName<"hr"> = createHyperscript("hr")

/**
 * @since 1.0.0
 */
export const html: HyperscriptForTagName<"html"> = createHyperscript("html")

/**
 * @since 1.0.0
 */
export const i: HyperscriptForTagName<"i"> = createHyperscript("i")

/**
 * @since 1.0.0
 */
export const iframe: HyperscriptForTagName<"iframe"> = createHyperscript("iframe")

/**
 * @since 1.0.0
 */
export const img: HyperscriptForTagName<"img"> = createHyperscript("img")

/**
 * @since 1.0.0
 */
export const input: HyperscriptForTagName<"input"> = createHyperscript("input")

/**
 * @since 1.0.0
 */
export const ins: HyperscriptForTagName<"ins"> = createHyperscript("ins")

/**
 * @since 1.0.0
 */
export const kbd: HyperscriptForTagName<"kbd"> = createHyperscript("kbd")

/**
 * @since 1.0.0
 */
export const label: HyperscriptForTagName<"label"> = createHyperscript("label")

/**
 * @since 1.0.0
 */
export const legend: HyperscriptForTagName<"legend"> = createHyperscript("legend")

/**
 * @since 1.0.0
 */
export const li: HyperscriptForTagName<"li"> = createHyperscript("li")

/**
 * @since 1.0.0
 */
export const link: HyperscriptForTagName<"link"> = createHyperscript("link")

/**
 * @since 1.0.0
 */
export const main: HyperscriptForTagName<"main"> = createHyperscript("main")

/**
 * @since 1.0.0
 */
export const map: HyperscriptForTagName<"map"> = createHyperscript("map")

/**
 * @since 1.0.0
 */
export const mark: HyperscriptForTagName<"mark"> = createHyperscript("mark")

/**
 * @since 1.0.0
 */
export const meta: HyperscriptForTagName<"meta"> = createHyperscript("meta")

/**
 * @since 1.0.0
 */
export const meter: HyperscriptForTagName<"meter"> = createHyperscript("meter")

/**
 * @since 1.0.0
 */
export const nav: HyperscriptForTagName<"nav"> = createHyperscript("nav")

/**
 * @since 1.0.0
 */
export const noscript: HyperscriptForTagName<"noscript"> = createHyperscript("noscript")

/**
 * @since 1.0.0
 */
export const object: HyperscriptForTagName<"object"> = createHyperscript("object")

/**
 * @since 1.0.0
 */
export const ol: HyperscriptForTagName<"ol"> = createHyperscript("ol")

/**
 * @since 1.0.0
 */
export const optgroup: HyperscriptForTagName<"optgroup"> = createHyperscript("optgroup")

/**
 * @since 1.0.0
 */
export const option: HyperscriptForTagName<"option"> = createHyperscript("option")

/**
 * @since 1.0.0
 */
export const output: HyperscriptForTagName<"output"> = createHyperscript("output")

/**
 * @since 1.0.0
 */
export const p: HyperscriptForTagName<"p"> = createHyperscript("p")

/**
 * @since 1.0.0
 */
export const param: HyperscriptForTagName<"param"> = createHyperscript("param")

/**
 * @since 1.0.0
 */
export const picture: HyperscriptForTagName<"picture"> = createHyperscript("picture")

/**
 * @since 1.0.0
 */
export const pre: HyperscriptForTagName<"pre"> = createHyperscript("pre")

/**
 * @since 1.0.0
 */
export const progress: HyperscriptForTagName<"progress"> = createHyperscript("progress")

/**
 * @since 1.0.0
 */
export const q: HyperscriptForTagName<"q"> = createHyperscript("q")

/**
 * @since 1.0.0
 */
export const rp: HyperscriptForTagName<"rp"> = createHyperscript("rp")

/**
 * @since 1.0.0
 */
export const rt: HyperscriptForTagName<"rt"> = createHyperscript("rt")

/**
 * @since 1.0.0
 */
export const ruby: HyperscriptForTagName<"ruby"> = createHyperscript("ruby")

/**
 * @since 1.0.0
 */
export const s: HyperscriptForTagName<"s"> = createHyperscript("s")

/**
 * @since 1.0.0
 */
export const samp: HyperscriptForTagName<"samp"> = createHyperscript("samp")

/**
 * @since 1.0.0
 */
export const script: HyperscriptForTagName<"script"> = createHyperscript("script")

/**
 * @since 1.0.0
 */
export const section: HyperscriptForTagName<"section"> = createHyperscript("section")

/**
 * @since 1.0.0
 */
export const select: HyperscriptForTagName<"select"> = createHyperscript("select")

/**
 * @since 1.0.0
 */
export const small: HyperscriptForTagName<"small"> = createHyperscript("small")

/**
 * @since 1.0.0
 */
export const source: HyperscriptForTagName<"source"> = createHyperscript("source")

/**
 * @since 1.0.0
 */
export const span: HyperscriptForTagName<"span"> = createHyperscript("span")

/**
 * @since 1.0.0
 */
export const strong: HyperscriptForTagName<"strong"> = createHyperscript("strong")

/**
 * @since 1.0.0
 */
export const style: HyperscriptForTagName<"style"> = createHyperscript("style")

/**
 * @since 1.0.0
 */
export const sub: HyperscriptForTagName<"sub"> = createHyperscript("sub")

/**
 * @since 1.0.0
 */
export const summary: HyperscriptForTagName<"summary"> = createHyperscript("summary")

/**
 * @since 1.0.0
 */
export const sup: HyperscriptForTagName<"sup"> = createHyperscript("sup")

/**
 * @since 1.0.0
 */
export const table: HyperscriptForTagName<"table"> = createHyperscript("table")

/**
 * @since 1.0.0
 */
export const tbody: HyperscriptForTagName<"tbody"> = createHyperscript("tbody")

/**
 * @since 1.0.0
 */
export const td: HyperscriptForTagName<"td"> = createHyperscript("td")

/**
 * @since 1.0.0
 */
export const template: HyperscriptForTagName<"template"> = createHyperscript("template")

/**
 * @since 1.0.0
 */
export const textarea: HyperscriptForTagName<"textarea"> = createHyperscript("textarea")

/**
 * @since 1.0.0
 */
export const tfoot: HyperscriptForTagName<"tfoot"> = createHyperscript("tfoot")

/**
 * @since 1.0.0
 */
export const th: HyperscriptForTagName<"th"> = createHyperscript("th")

/**
 * @since 1.0.0
 */
export const thead: HyperscriptForTagName<"thead"> = createHyperscript("thead")

/**
 * @since 1.0.0
 */
export const time: HyperscriptForTagName<"time"> = createHyperscript("time")

/**
 * @since 1.0.0
 */
export const title: HyperscriptForTagName<"title"> = createHyperscript("title")

/**
 * @since 1.0.0
 */
export const tr: HyperscriptForTagName<"tr"> = createHyperscript("tr")

/**
 * @since 1.0.0
 */
export const track: HyperscriptForTagName<"track"> = createHyperscript("track")

/**
 * @since 1.0.0
 */
export const u: HyperscriptForTagName<"u"> = createHyperscript("u")

/**
 * @since 1.0.0
 */
export const ul: HyperscriptForTagName<"ul"> = createHyperscript("ul")

/**
 * @since 1.0.0
 */
export const video: HyperscriptForTagName<"video"> = createHyperscript("video")

/**
 * @since 1.0.0
 */
export const wbr: HyperscriptForTagName<"wbr"> = createHyperscript("wbr")
