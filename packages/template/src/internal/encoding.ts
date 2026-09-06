import { isOption, match } from "effect/Option";
import { hasProperty, isNullish } from "effect/Predicate";
import { isHtmlRenderEvent } from "../RenderEvent.js";

export function escape(s: unknown): string {
  switch (typeof s) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return escapeHtml(String(s));
    case "object": {
      if (isNullish(s)) {
        return "";
      } else if (Array.isArray(s)) {
        return s.map(escape).join("");
      } else if (s instanceof Date) {
        return escapeHtml(s.toISOString());
      } else if (s instanceof RegExp) {
        return escapeHtml(s.toString());
      } else {
        return escapeHtml(JSON.stringify(s));
      }
    }
    default:
      return escapeHtml(JSON.stringify(s));
  }
}

export function unescape(s: string) {
  const unescaped = unescapeHtml(s);
  const couldBeJson = unescaped[0] === "[" || unescaped === "{";
  if (couldBeJson) {
    try {
      return JSON.parse(unescaped);
    } catch {
      return unescaped;
    }
  } else {
    return unescaped;
  }
}

const unescapeHtmlRules = [
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&#x3A;/g, ":"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&amp;/g, "&"],
] as const;

const matchHtmlRegExp = /["'&<>]/;

export function escapeHtml(str: string): string {
  if (str.length === 0) {
    return str;
  }

  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let escape;
  let html = "";
  let index = 0;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = "&quot;";
        break;
      case 38: // &
        escape = "&amp;";
        break;
      case 39: // '
        escape = "&#39;";
        break;
      case 60: // <
        escape = "&lt;";
        break;
      case 62: // >
        escape = "&gt;";
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}

export function unescapeHtml(html: string) {
  for (const [from, to] of unescapeHtmlRules) {
    html = html.replace(from, to);
  }

  return html;
}

export function renderToString(value: unknown, delimiter: string = ""): string {
  if (Array.isArray(value)) {
    return value.map((v) => renderToString(v, delimiter)).join(delimiter);
  }
  if (isNullish(value)) {
    return "";
  }
  if (isOption(value)) {
    return match(value, {
      onNone: () => "",
      onSome: (v: unknown) => renderToString(v, delimiter),
    });
  }
  if (isHtmlRenderEvent(value)) {
    return value.html;
  }

  if (typeof value === "string") {
    return value;
  }

  if (hasProperty(value, "toString") && typeof value.toString === "function") {
    const s = value.toString();
    if (s !== "[object Object]") {
      return s;
    }
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function renderToEscapedString(value: unknown, delimiter: string): string {
  return escape(renderToString(value, delimiter));
}
