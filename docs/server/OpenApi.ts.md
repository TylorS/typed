---
title: OpenApi.ts
nav_order: 22
parent: "@typed/server"
---

## OpenApi overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [annotations](#annotations)
  - [Annotatable (interface)](#annotatable-interface)
  - [Description (class)](#description-class)
  - [ExternalDocs (class)](#externaldocs-class)
  - [Identifier (class)](#identifier-class)
  - [License (class)](#license-class)
  - [Security (class)](#security-class)
  - [Title (class)](#title-class)
  - [Version (class)](#version-class)
  - [annotate](#annotate)
  - [annotations](#annotations-1)
- [constructors](#constructors)
  - [fromApi](#fromapi)
- [models](#models)
  - [OpenAPIApiKeySecurityScheme (interface)](#openapiapikeysecurityscheme-interface)
  - [OpenAPIComponents (interface)](#openapicomponents-interface)
  - [OpenAPIHTTPSecurityScheme (interface)](#openapihttpsecurityscheme-interface)
  - [OpenAPIJSONSchema (type alias)](#openapijsonschema-type-alias)
  - [OpenAPIMutualTLSSecurityScheme (interface)](#openapimutualtlssecurityscheme-interface)
  - [OpenAPIOAuth2SecurityScheme (interface)](#openapioauth2securityscheme-interface)
  - [OpenAPIOpenIdConnectSecurityScheme (interface)](#openapiopenidconnectsecurityscheme-interface)
  - [OpenAPISecurityRequirement (type alias)](#openapisecurityrequirement-type-alias)
  - [OpenAPISecurityScheme (type alias)](#openapisecurityscheme-type-alias)
  - [OpenAPISpec (interface)](#openapispec-interface)
  - [OpenAPISpecExternalDocs (interface)](#openapispecexternaldocs-interface)
  - [OpenAPISpecInfo (interface)](#openapispecinfo-interface)
  - [OpenAPISpecLicense (interface)](#openapispeclicense-interface)
  - [OpenAPISpecMethodName (type alias)](#openapispecmethodname-type-alias)
  - [OpenAPISpecOperation (interface)](#openapispecoperation-interface)
  - [OpenAPISpecParameter (interface)](#openapispecparameter-interface)
  - [OpenAPISpecPathItem (type alias)](#openapispecpathitem-type-alias)
  - [OpenAPISpecPaths (type alias)](#openapispecpaths-type-alias)
  - [OpenAPISpecRequestBody (interface)](#openapispecrequestbody-interface)
  - [OpenAPISpecResponses (type alias)](#openapispecresponses-type-alias)
  - [OpenAPISpecServer (interface)](#openapispecserver-interface)
  - [OpenAPISpecServerVariable (interface)](#openapispecservervariable-interface)
  - [OpenAPISpecTag (interface)](#openapispectag-interface)
  - [OpenApiSpecContent (type alias)](#openapispeccontent-type-alias)
  - [OpenApiSpecContentType (type alias)](#openapispeccontenttype-type-alias)
  - [OpenApiSpecMediaType (interface)](#openapispecmediatype-interface)
  - [OpenApiSpecResponse (interface)](#openapispecresponse-interface)
  - [OpenApiSpecResponseHeader (interface)](#openapispecresponseheader-interface)
  - [OpenApiSpecResponseHeaders (type alias)](#openapispecresponseheaders-type-alias)

---

# annotations

## Annotatable (interface)

**Signature**

```ts
export interface Annotatable {
  readonly annotations: Context.Context<never>
}
```

Added in v1.0.0

## Description (class)

**Signature**

```ts
export declare class Description
```

Added in v1.0.0

## ExternalDocs (class)

**Signature**

```ts
export declare class ExternalDocs
```

Added in v1.0.0

## Identifier (class)

**Signature**

```ts
export declare class Identifier
```

Added in v1.0.0

## License (class)

**Signature**

```ts
export declare class License
```

Added in v1.0.0

## Security (class)

**Signature**

```ts
export declare class Security
```

Added in v1.0.0

## Title (class)

**Signature**

```ts
export declare class Title
```

Added in v1.0.0

## Version (class)

**Signature**

```ts
export declare class Version
```

Added in v1.0.0

## annotate

**Signature**

```ts
export declare const annotate: {
  (annotations: {
    readonly identifier?: string | undefined
    readonly title?: string | undefined
    readonly description?: string | undefined
    readonly version?: string | undefined
    readonly license?: OpenAPISpecLicense | undefined
    readonly security?: HttpApiSecurity | undefined
    readonly externalDocs?: OpenAPISpecExternalDocs | undefined
  }): <A extends Annotatable>(self: A) => A
  <A extends Annotatable>(
    self: A,
    annotations: {
      readonly identifier?: string | undefined
      readonly title?: string | undefined
      readonly description?: string | undefined
      readonly version?: string | undefined
      readonly license?: OpenAPISpecLicense | undefined
      readonly security?: HttpApiSecurity | undefined
      readonly externalDocs?: OpenAPISpecExternalDocs | undefined
    }
  ): A
}
```

Added in v1.0.0

## annotations

**Signature**

```ts
export declare const annotations: (annotations: {
  readonly identifier?: string | undefined
  readonly title?: string | undefined
  readonly description?: string | undefined
  readonly version?: string | undefined
  readonly license?: OpenAPISpecLicense | undefined
  readonly security?: HttpApiSecurity | undefined
  readonly externalDocs?: OpenAPISpecExternalDocs | undefined
}) => Context.Context<never>
```

Added in v1.0.0

# constructors

## fromApi

**Signature**

```ts
export declare const fromApi: <A extends HttpApi.HttpApi.Any>(api: A) => OpenAPISpec
```

Added in v1.0.0

# models

## OpenAPIApiKeySecurityScheme (interface)

**Signature**

```ts
export interface OpenAPIApiKeySecurityScheme {
  readonly type: "apiKey"
  readonly description?: string
  readonly name: string
  readonly in: "query" | "header" | "cookie"
}
```

Added in v1.0.0

## OpenAPIComponents (interface)

**Signature**

```ts
export interface OpenAPIComponents {
  readonly schemas?: ReadonlyRecord<string, OpenAPIJSONSchema>
  readonly securitySchemes?: ReadonlyRecord<string, OpenAPISecurityScheme>
}
```

Added in v1.0.0

## OpenAPIHTTPSecurityScheme (interface)

**Signature**

```ts
export interface OpenAPIHTTPSecurityScheme {
  readonly type: "http"
  readonly description?: string
  readonly scheme: "bearer" | "basic" | string
  /* only for scheme: 'bearer' */
  readonly bearerFormat?: string
}
```

Added in v1.0.0

## OpenAPIJSONSchema (type alias)

**Signature**

```ts
export type OpenAPIJSONSchema = JSONSchema.JsonSchema7
```

Added in v1.0.0

## OpenAPIMutualTLSSecurityScheme (interface)

**Signature**

```ts
export interface OpenAPIMutualTLSSecurityScheme {
  readonly type: "mutualTLS"
  readonly description?: string
}
```

Added in v1.0.0

## OpenAPIOAuth2SecurityScheme (interface)

**Signature**

```ts
export interface OpenAPIOAuth2SecurityScheme {
  readonly type: "oauth2"
  readonly description?: string
  readonly flows: ReadonlyRecord<
    "implicit" | "password" | "clientCredentials" | "authorizationCode",
    ReadonlyRecord<string, unknown>
  >
}
```

Added in v1.0.0

## OpenAPIOpenIdConnectSecurityScheme (interface)

**Signature**

```ts
export interface OpenAPIOpenIdConnectSecurityScheme {
  readonly type: "openIdConnect"
  readonly description?: string
  readonly openIdConnectUrl: string
}
```

Added in v1.0.0

## OpenAPISecurityRequirement (type alias)

**Signature**

```ts
export type OpenAPISecurityRequirement = ReadonlyRecord<string, Array<string>>
```

Added in v1.0.0

## OpenAPISecurityScheme (type alias)

**Signature**

```ts
export type OpenAPISecurityScheme =
  | OpenAPIHTTPSecurityScheme
  | OpenAPIApiKeySecurityScheme
  | OpenAPIMutualTLSSecurityScheme
  | OpenAPIOAuth2SecurityScheme
  | OpenAPIOpenIdConnectSecurityScheme
```

Added in v1.0.0

## OpenAPISpec (interface)

**Signature**

```ts
export interface OpenAPISpec {
  readonly openapi: "3.0.3"
  readonly info: OpenAPISpecInfo
  readonly servers?: Array<OpenAPISpecServer>
  readonly paths: OpenAPISpecPaths
  readonly components?: OpenAPIComponents
  readonly security?: Array<OpenAPISecurityRequirement>
  readonly tags?: Array<OpenAPISpecTag>
  readonly externalDocs?: OpenAPISpecExternalDocs
}
```

Added in v1.0.0

## OpenAPISpecExternalDocs (interface)

**Signature**

```ts
export interface OpenAPISpecExternalDocs {
  readonly url: string
  readonly description?: string
}
```

Added in v1.0.0

## OpenAPISpecInfo (interface)

**Signature**

```ts
export interface OpenAPISpecInfo {
  readonly title: string
  readonly version: string
  readonly description?: string
  readonly license?: OpenAPISpecLicense
}
```

Added in v1.0.0

## OpenAPISpecLicense (interface)

**Signature**

```ts
export interface OpenAPISpecLicense {
  readonly name: string
  readonly url?: string
}
```

Added in v1.0.0

## OpenAPISpecMethodName (type alias)

**Signature**

```ts
export type OpenAPISpecMethodName = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace"
```

Added in v1.0.0

## OpenAPISpecOperation (interface)

**Signature**

```ts
export interface OpenAPISpecOperation {
  readonly requestBody?: OpenAPISpecRequestBody
  readonly responses?: OpenAPISpecResponses
  readonly operationId?: string
  readonly description?: string
  readonly parameters?: Array<OpenAPISpecParameter>
  readonly summary?: string
  readonly deprecated?: boolean
  readonly tags?: Array<string>
  readonly security?: Array<OpenAPISecurityRequirement>
  readonly externalDocs?: OpenAPISpecExternalDocs
}
```

Added in v1.0.0

## OpenAPISpecParameter (interface)

**Signature**

```ts
export interface OpenAPISpecParameter {
  readonly name: string
  readonly in: "query" | "header" | "path" | "cookie"
  readonly schema: OpenAPIJSONSchema
  readonly description?: string
  readonly required?: boolean
  readonly deprecated?: boolean
  readonly allowEmptyValue?: boolean
}
```

Added in v1.0.0

## OpenAPISpecPathItem (type alias)

**Signature**

```ts
export type OpenAPISpecPathItem = {
  readonly [K in OpenAPISpecMethodName]?: OpenAPISpecOperation
} & {
  readonly summary?: string
  readonly description?: string
  readonly parameters?: Array<OpenAPISpecParameter>
}
```

Added in v1.0.0

## OpenAPISpecPaths (type alias)

**Signature**

```ts
export type OpenAPISpecPaths = ReadonlyRecord<string, OpenAPISpecPathItem>
```

Added in v1.0.0

## OpenAPISpecRequestBody (interface)

**Signature**

```ts
export interface OpenAPISpecRequestBody {
  readonly content: OpenApiSpecContent
  readonly description?: string
  readonly required?: boolean
}
```

Added in v1.0.0

## OpenAPISpecResponses (type alias)

**Signature**

```ts
export type OpenAPISpecResponses = Record<number, OpenApiSpecResponse>
```

Added in v1.0.0

## OpenAPISpecServer (interface)

**Signature**

```ts
export interface OpenAPISpecServer {
  readonly url: string
  readonly description?: string
  readonly variables?: Record<string, OpenAPISpecServerVariable>
}
```

Added in v1.0.0

## OpenAPISpecServerVariable (interface)

**Signature**

```ts
export interface OpenAPISpecServerVariable {
  readonly default: string
  readonly enum?: [string, ...Array<string>]
  readonly description?: string
}
```

Added in v1.0.0

## OpenAPISpecTag (interface)

**Signature**

```ts
export interface OpenAPISpecTag {
  readonly name: string
  readonly description?: string
  readonly externalDocs?: OpenAPISpecExternalDocs
}
```

Added in v1.0.0

## OpenApiSpecContent (type alias)

**Signature**

```ts
export type OpenApiSpecContent = {
  readonly [K in OpenApiSpecContentType]?: OpenApiSpecMediaType
}
```

Added in v1.0.0

## OpenApiSpecContentType (type alias)

**Signature**

```ts
export type OpenApiSpecContentType = "application/json" | "application/xml" | "multipart/form-data" | "text/plain"
```

Added in v1.0.0

## OpenApiSpecMediaType (interface)

**Signature**

```ts
export interface OpenApiSpecMediaType {
  readonly schema?: OpenAPIJSONSchema
  readonly example?: object
  readonly description?: string
}
```

Added in v1.0.0

## OpenApiSpecResponse (interface)

**Signature**

```ts
export interface OpenApiSpecResponse {
  readonly content?: OpenApiSpecContent
  readonly headers?: OpenApiSpecResponseHeaders
  readonly description: string
}
```

Added in v1.0.0

## OpenApiSpecResponseHeader (interface)

**Signature**

```ts
export interface OpenApiSpecResponseHeader {
  readonly description?: string
  readonly schema: OpenAPIJSONSchema
}
```

Added in v1.0.0

## OpenApiSpecResponseHeaders (type alias)

**Signature**

```ts
export type OpenApiSpecResponseHeaders = ReadonlyRecord<string, OpenApiSpecResponseHeader>
```

Added in v1.0.0
