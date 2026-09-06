import { createHappyDomLayer } from "./helpers/dom-layer.js";
import { sparseClassTests } from "./helpers/sparse-classes.js";

sparseClassTests(() => createHappyDomLayer()[0].document);
