import { Schema } from "effect";
import { canonicalSiteOrigin } from "../Site.js";
import { DocumentationModelSchema } from "./Model.js";

const document = Schema.toJsonSchemaDocument(DocumentationModelSchema);

export const documentationSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${canonicalSiteOrigin}/schemas/documentation-v1.json`,
  title: "Typed documentation model",
  ...document.schema,
  $defs: document.definitions,
};
