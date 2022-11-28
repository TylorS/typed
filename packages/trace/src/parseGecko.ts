import { RuntimeStackFrame } from './StackFrame.js'

const geckoRe =
  /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i
const geckoEvalRe = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i

export function parseGecko(line: string): RuntimeStackFrame | null {
  const parts = geckoRe.exec(line)

  if (!parts) {
    return null
  }

  const isEval = parts[3] && parts[3].indexOf(' > eval') > -1

  const submatch = geckoEvalRe.exec(parts[3])
  if (isEval && submatch != null) {
    // throw out eval line/column and use top-most line number
    parts[3] = submatch[1]
    parts[4] = submatch[2]
    parts[5] = '-1' // no column when eval
  }

  return RuntimeStackFrame(
    parts[3] || '',
    parts[1] || '',
    parts[4] ? +parts[4] : -1,
    parts[5] ? +parts[5] : 0,
  )
}
