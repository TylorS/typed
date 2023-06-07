export function addQuotations(previous: string, value: string) {
  if (previous.endsWith(`"`) || previous.endsWith(`'`)) {
    return previous + value
  }

  return previous + `"${value}"`
}

export function removeAttribute(name: string, template: string) {
  return replaceAttribute(name, '', template)
}

export function replaceAttribute(name: string, value: string, template: string) {
  return template.replace(new RegExp(`${name}=(["'])?`, 'g'), value)
}

export function trimEmptyQuotes(template: string) {
  return template.replace(/^"\s?"/g, '')
}

const DATA_TYPED_ATTR = ' data-typed="true"'

export function addDataTypedAttributes(template: string) {
  return template.replace(/<([a-z]+)([^>]*)/, `<$1${DATA_TYPED_ATTR}$2`)
}
