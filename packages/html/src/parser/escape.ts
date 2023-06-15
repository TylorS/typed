import { State } from './State.js'

const HTML_ESCAPES = {
  '"': '&quot;',
  "'": '&#x27;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
}
const RE_HTML = /["'&<>]/g
const RE_SCRIPT_STYLE_TAG = /<\/(script|style)/gi

export function escape(text: string, context: State = 'text') {
  switch (context) {
    case 'script':
    case 'style':
      return text.replace(RE_SCRIPT_STYLE_TAG, '<\\/$1').replace(/<!--/g, '\\x3C!--')
    case 'attribute':
    case 'text':
    default:
      return text.replace(RE_HTML, (match) => HTML_ESCAPES[match as keyof typeof HTML_ESCAPES])
  }
}
