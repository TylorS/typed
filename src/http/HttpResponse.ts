import { HttpHeaders } from './HttpHeaders'

export interface HttpResponse {
  readonly responseText: string
  readonly status: number
  readonly statusText: string
  readonly headers: HttpHeaders
}
