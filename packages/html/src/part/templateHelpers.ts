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
