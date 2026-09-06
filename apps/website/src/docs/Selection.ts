/** Optional editorial cross-links; never a structural reference allowlist. */
export const editorialSymbolRelations = [
  { id: "@typed/fx/Fx#Fx", glossary: "fx" },
  { id: "@typed/fx/Fx#keyed", glossary: "keyed-identity" },
  { id: "@typed/fx/RefSubject#make", glossary: "refsubject" },
  { id: "@typed/fx/RefSubject#map", glossary: "refsubject" },
  { id: "@typed/fx/RefSubject#update", glossary: "refsubject" },
  { id: "@typed/template/EventHandler#make", glossary: "cooperative-ownership" },
  { id: "@typed/template/Render#render", glossary: "cooperative-ownership" },
  { id: "@typed/template/RenderEvent#DomRenderEvent", glossary: "dom-render-event" },
  { id: "@typed/template/RenderEvent#HtmlRenderEvent", glossary: "html-render-event" },
  { id: "@typed/template/RenderEvent#RenderEvent", glossary: "render-event" },
  { id: "@typed/template/RenderTemplate#html", glossary: "render-template" },
  { id: "@typed/template/many#many", glossary: "dynamic-range" },
] as const;
