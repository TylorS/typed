export const PART_REGEX = /(\{\{(\d+)\}\})/g;
export const STRICT_PART_REGEX = /^(\{\{(\d+)\}\})/;
export const PART_STRING = (i: number) => `{{${i}}}`;

export const TEMPLATE_START_COMMENT = (hash: string) => `<!--t_${hash}-->`;
export const TEMPLATE_END_COMMENT = (hash: string) => `<!--/t_${hash}-->`;

export const TEXT_START = "<!--txt-->";

export const TYPED_NODE_START = (i: number) => `<!--n_${i}-->`;
export const TYPED_NODE_END = (i: number) => `<!--/n_${i}-->`;

export const TYPED_COMMENT_PART = (i: number) => `<!--c_${i}-->`;

const typedTemplateStartCommentRegex = /<!--[t|n|txt]_(.*?)-->/g;
const typedTemplateEndCommentRegex = /<!--\/[t|n|txt]_(.*?)-->/g;

export const isTemplateStartComment = (comment: { nodeValue: string }) =>
  typedTemplateStartCommentRegex.test(comment.nodeValue);

export const isTemplateEndComment = (comment: { nodeValue: string }) =>
  typedTemplateEndCommentRegex.test(comment.nodeValue);

export const stripTypedTemplateComments = (html: string) =>
  html.replace(typedTemplateStartCommentRegex, "").replace(typedTemplateEndCommentRegex, "");
