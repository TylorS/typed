import { HttpHeaders } from './HttpHeaders'

/**
 * A JSON-friendly HttpResponse
 */
export interface HttpResponse {
  readonly responseText: string
  readonly status: number
  readonly statusText: string
  readonly headers: HttpHeaders
}
