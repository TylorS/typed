import type { TemplateResult } from './TemplateResult.js'

export function isTemplateResult(value: unknown): value is TemplateResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_tag' in value &&
    value._tag === 'TemplateResult'
  )
}
