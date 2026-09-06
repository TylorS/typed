import { packageCatalog, referenceCounts } from "../generated/catalog.js";
import { guides } from "../generated/guides.js";
import { glossaryEntries } from "../generated/glossary.js";
import { packages, symbols } from "../generated/reference.js";
import type { DocumentationModel } from "./Model.js";

export { glossaryEntries, guides, packageCatalog, packages, referenceCounts, symbols };

export const documentationModel: DocumentationModel = {
  schemaVersion: 1,
  repositoryRevision: "working-tree",
  packages,
  guides,
  glossary: glossaryEntries,
  symbols,
};
