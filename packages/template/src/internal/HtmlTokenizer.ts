/*
 * Vendored from html5parser v3.0.0 (https://github.com/acrazing/html5parser).
 * Copyright (c) 2020 acrazing (joking.young@gmail.com).
 * SPDX-License-Identifier: MIT
 *
 * This file incorporates the upstream tokenizer unchanged except that its small
 * tag-mode configuration is co-located here. See ../../THIRD_PARTY_NOTICES.md.
 */
/*
 * @author acrazing joking.young@gmail.com
 * @since 2017-08-19 00:54:29
 */

const rcDataTags = new Set(["title", "textarea"]);
const rawTextTags = new Set(["style", "xmp", "iframe", "noembed", "noframes"]);
const scriptDataTags = new Set(["script"]);
const scriptingRawTextTags = new Set(["noscript"]);
const plainTextTags = new Set(["plaintext"]);
const enum State {
  Literal,
  BeforeOpenTag,
  OpeningTag,
  AfterOpenTag,
  InValueNq,
  InValueSq,
  InValueDq,
  ClosingOpenTag,
  OpeningSpecial,
  OpeningDoctype,
  OpeningNormalComment,
  InNormalComment,
  InShortComment,
  ClosingNormalComment,
  ClosingTag,
}

const enum TextMode {
  Data,
  RcData,
  RawText,
  ScriptData,
  PlainText,
}

/**
 * Token kinds emitted by tokenize.
 */
export const enum TokenKind {
  /**
   * Raw text outside tag syntax.
   */
  Literal,
  /**
   * Opening tag name without the leading <.
   */
  OpenTag,
  /**
   * Opening tag end marker without the trailing >; value is / or empty.
   */
  OpenTagEnd,
  /**
   * Closing tag name without the leading </ or trailing >.
   */
  CloseTag,
  /**
   * Whitespace between attributes.
   */
  Whitespace,
  /**
   * Attribute value assignment marker.
   */
  AttrValueEq,
  /**
   * Unquoted attribute value.
   */
  AttrValueNq,
  /**
   * Single-quoted attribute value.
   */
  AttrValueSq,
  /**
   * Double-quoted attribute value.
   */
  AttrValueDq,
}

/**
 * Token emitted by the HTML tokenizer.
 */
export interface IToken {
  /**
   * Zero-based start offset in the source string.
   */
  start: number;
  /**
   * Zero-based end offset in the source string.
   */
  end: number;
  /**
   * Raw token value after token-specific trimming.
   */
  value: string;
  /**
   * Token category.
   */
  type: TokenKind;
}

/**
 * Options that control tokenization.
 */
export interface TokenizeOptions {
  /**
   * Treat noscript content as RAWTEXT when true, matching HTML parsers with scripting enabled.
   */
  scriptingEnabled?: boolean;
}

interface ICodePoints {
  lower: number[];
  upper: number[];
  length: number;
}

let state: State;
let buffer: string;
let bufSize: number;
let sectionStart: number;
let index: number;
let tokens: IToken[];
let char: number;
let offset: number;
let textMode: TextMode;
let textEndTag: ICodePoints | undefined;
let pendingTextMode: TextMode;
let pendingTextTag: string;
let tokenizeOptions: Required<TokenizeOptions>;

function makeCodePoints(input: string): ICodePoints {
  return {
    lower: input
      .toLowerCase()
      .split('')
      .map((c) => c.charCodeAt(0)),
    upper: input
      .toUpperCase()
      .split('')
      .map((c) => c.charCodeAt(0)),
    length: input.length,
  };
}

const doctype = makeCodePoints('!doctype');

const enum Chars {
  _S = 32, // ' '
  _N = 10, // \n
  _T = 9, // \t
  _R = 13, // \r
  _F = 12, // \f
  Lt = 60, // <
  Ep = 33, // !
  Cl = 45, // -
  Sl = 47, // /
  Gt = 62, // >
  Qm = 63, // ?
  La = 97, // a
  Lz = 122, // z
  Ua = 65, // A
  Uz = 90, // Z
  Eq = 61, // =
  Sq = 39, // '
  Dq = 34, // "
  Ld = 100, // d
  Ud = 68, //D
}

function isWhiteSpace() {
  return (
    char === Chars._S ||
    char === Chars._N ||
    char === Chars._T ||
    char === Chars._T ||
    char === Chars._R ||
    char === Chars._F
  );
}

function init(input: string, options: Required<TokenizeOptions>) {
  state = State.Literal;
  buffer = input;
  bufSize = input.length;
  sectionStart = 0;
  index = 0;
  tokens = [];
  offset = 0;
  textMode = TextMode.Data;
  textEndTag = void 0;
  pendingTextMode = TextMode.Data;
  pendingTextTag = '';
  tokenizeOptions = options;
}

function getTextMode(tagName: string): TextMode {
  if (rcDataTags.has(tagName)) {
    return TextMode.RcData;
  }
  if (rawTextTags.has(tagName)) {
    return TextMode.RawText;
  }
  if (scriptDataTags.has(tagName)) {
    return TextMode.ScriptData;
  }
  if (plainTextTags.has(tagName)) {
    return TextMode.PlainText;
  }
  if (tokenizeOptions.scriptingEnabled && scriptingRawTextTags.has(tagName)) {
    return TextMode.RawText;
  }
  return TextMode.Data;
}

function setPendingTextMode(tagName: string) {
  pendingTextTag = tagName;
  pendingTextMode = getTextMode(tagName);
}

function activatePendingTextMode(openTagEnd: string) {
  if (openTagEnd !== '/' && pendingTextMode !== TextMode.Data) {
    textMode = pendingTextMode;
    textEndTag = makeCodePoints(pendingTextTag);
    if (pendingTextTag === 'textarea' && buffer.charCodeAt(sectionStart) === Chars._N) {
      sectionStart++;
      index++;
    }
  }
  pendingTextMode = TextMode.Data;
  pendingTextTag = '';
}

function resetTextMode() {
  textMode = TextMode.Data;
  textEndTag = void 0;
}

function resetTextClosingTag() {
  sectionStart -= 2;
  state = State.Literal;
}

/**
 * Convert an HTML string into a flat token stream.
 */
export function tokenize(input: string, options: TokenizeOptions = {}): IToken[] {
  init(input, {
    scriptingEnabled: options.scriptingEnabled !== false,
  });
  while (index < bufSize) {
    char = buffer.charCodeAt(index);
    switch (state) {
      case State.Literal:
        parseLiteral();
        break;
      case State.BeforeOpenTag:
        parseBeforeOpenTag();
        break;
      case State.OpeningTag:
        parseOpeningTag();
        break;
      case State.AfterOpenTag:
        parseAfterOpenTag();
        break;
      case State.InValueNq:
        parseInValueNq();
        break;
      case State.InValueSq:
        parseInValueSq();
        break;
      case State.InValueDq:
        parseInValueDq();
        break;
      case State.ClosingOpenTag:
        parseClosingOpenTag();
        break;
      case State.OpeningSpecial:
        parseOpeningSpecial();
        break;
      case State.OpeningDoctype:
        parseOpeningDoctype();
        break;
      case State.OpeningNormalComment:
        parseOpeningNormalComment();
        break;
      case State.InNormalComment:
        parseNormalComment();
        break;
      case State.InShortComment:
        parseShortComment();
        break;
      case State.ClosingNormalComment:
        parseClosingNormalComment();
        break;
      case State.ClosingTag:
        parseClosingTag();
        break;
      default:
        unexpected();
    }
    index++;
  }
  switch (state) {
    case State.Literal:
    case State.BeforeOpenTag:
    case State.InValueNq:
    case State.InValueSq:
    case State.InValueDq:
    case State.ClosingOpenTag:
    case State.InNormalComment:
    case State.InShortComment:
    case State.ClosingNormalComment:
      emitToken(TokenKind.Literal);
      break;
    case State.OpeningTag:
      emitToken(TokenKind.OpenTag);
      break;
    case State.AfterOpenTag:
      break;
    case State.OpeningSpecial:
      emitToken(TokenKind.OpenTag, State.InShortComment);
      break;
    case State.OpeningDoctype:
      if (index - sectionStart === doctype.length) {
        emitToken(TokenKind.OpenTag);
      } else {
        emitToken(TokenKind.OpenTag, void 0, sectionStart + 1);
        emitToken(TokenKind.Literal);
      }
      break;
    case State.OpeningNormalComment:
      if (index - sectionStart === 2) {
        emitToken(TokenKind.OpenTag);
      } else {
        emitToken(TokenKind.OpenTag, void 0, sectionStart + 1);
        emitToken(TokenKind.Literal);
      }
      break;
    case State.ClosingTag:
      emitToken(TokenKind.CloseTag);
      break;
    default:
      break;
  }
  const _tokens = tokens;
  init('', tokenizeOptions);
  return _tokens;
}

function emitToken(kind: TokenKind, newState = state, end = index) {
  let value = buffer.substring(sectionStart, end);
  if (kind === TokenKind.OpenTag || kind === TokenKind.CloseTag) {
    value = value.toLowerCase();
  }
  if (kind === TokenKind.OpenTag) {
    setPendingTextMode(value);
  }
  if (kind === TokenKind.CloseTag) {
    resetTextMode();
  }
  if (!((kind === TokenKind.Literal || kind === TokenKind.Whitespace) && end === sectionStart)) {
    // empty literal should be ignored
    tokens.push({ type: kind, start: sectionStart, end, value });
  }
  if (kind === TokenKind.OpenTagEnd || kind === TokenKind.CloseTag) {
    sectionStart = end + 1;
    state = State.Literal;
    if (kind === TokenKind.OpenTagEnd) {
      activatePendingTextMode(value);
    }
  } else {
    sectionStart = end;
    state = newState;
  }
}

function parseLiteral() {
  if (textMode === TextMode.PlainText) {
    return;
  }
  if (char === Chars.Lt) {
    // <
    emitToken(TokenKind.Literal, State.BeforeOpenTag);
  }
}

function parseBeforeOpenTag() {
  if (textMode !== TextMode.Data) {
    if (char === Chars.Sl) {
      state = State.ClosingTag;
      sectionStart = index + 1;
    } else {
      state = State.Literal;
    }
    return;
  }
  if ((char >= Chars.La && char <= Chars.Lz) || (char >= Chars.Ua && char <= Chars.Uz)) {
    // <d
    state = State.OpeningTag;
    sectionStart = index;
  } else if (char === Chars.Sl) {
    // </
    state = State.ClosingTag;
    sectionStart = index + 1;
  } else if (char === Chars.Lt) {
    // <<
    emitToken(TokenKind.Literal);
  } else if (char === Chars.Ep) {
    // <!
    state = State.OpeningSpecial;
    sectionStart = index;
  } else if (char === Chars.Qm) {
    // <?
    // treat as short comment
    sectionStart = index;
    emitToken(TokenKind.OpenTag, State.InShortComment);
  } else {
    // <>
    // any other chars covert to normal state
    state = State.Literal;
  }
}

function parseOpeningTag() {
  if (isWhiteSpace()) {
    // <div ...
    emitToken(TokenKind.OpenTag, State.AfterOpenTag);
  } else if (char === Chars.Gt) {
    // <div>
    emitToken(TokenKind.OpenTag);
    emitToken(TokenKind.OpenTagEnd);
  } else if (char === Chars.Sl) {
    // <div/
    emitToken(TokenKind.OpenTag, State.ClosingOpenTag);
  }
}

function parseAfterOpenTag() {
  if (char === Chars.Gt) {
    // <div >
    emitToken(TokenKind.Whitespace);
    emitToken(TokenKind.OpenTagEnd);
  } else if (char === Chars.Sl) {
    // <div /
    emitToken(TokenKind.Whitespace, State.ClosingOpenTag);
  } else if (char === Chars.Eq) {
    // <div ...=...
    emitToken(TokenKind.Whitespace);
    emitToken(TokenKind.AttrValueEq, void 0, index + 1);
  } else if (char === Chars.Sq) {
    // <div ...'...
    emitToken(TokenKind.Whitespace, State.InValueSq);
  } else if (char === Chars.Dq) {
    // <div ..."...
    emitToken(TokenKind.Whitespace, State.InValueDq);
  } else if (!isWhiteSpace()) {
    // <div ...name...
    emitToken(TokenKind.Whitespace, State.InValueNq);
  }
}

function parseInValueNq() {
  if (char === Chars.Gt) {
    // <div xxx>
    emitToken(TokenKind.AttrValueNq);
    emitToken(TokenKind.OpenTagEnd);
  } else if (char === Chars.Sl) {
    // <div xxx/
    emitToken(TokenKind.AttrValueNq, State.ClosingOpenTag);
  } else if (char === Chars.Eq) {
    // <div xxx=
    emitToken(TokenKind.AttrValueNq);
    emitToken(TokenKind.AttrValueEq, State.AfterOpenTag, index + 1);
  } else if (isWhiteSpace()) {
    // <div xxx ...
    emitToken(TokenKind.AttrValueNq, State.AfterOpenTag);
  }
}

function parseInValueSq() {
  if (char === Chars.Sq) {
    // <div 'xxx'
    emitToken(TokenKind.AttrValueSq, State.AfterOpenTag, index + 1);
  }
}

function parseInValueDq() {
  if (char === Chars.Dq) {
    // <div "xxx", problem same to Sq
    emitToken(TokenKind.AttrValueDq, State.AfterOpenTag, index + 1);
  }
}

function parseClosingOpenTag() {
  if (char === Chars.Gt) {
    // <div />
    emitToken(TokenKind.OpenTagEnd);
  } else {
    // <div /...>
    emitToken(TokenKind.AttrValueNq, State.AfterOpenTag);
    parseAfterOpenTag();
  }
}

function parseOpeningSpecial() {
  switch (char) {
    case Chars.Cl: // <!-
      state = State.OpeningNormalComment;
      break;
    case Chars.Ld: // <!d
    case Chars.Ud: // <!D
      state = State.OpeningDoctype;
      break;
    default:
      emitToken(TokenKind.OpenTag, State.InShortComment);
      break;
  }
}

function parseOpeningDoctype() {
  offset = index - sectionStart;
  if (offset === doctype.length) {
    // <!d, <!d , start: 0, index: 2
    if (isWhiteSpace()) {
      emitToken(TokenKind.OpenTag, State.AfterOpenTag);
    } else {
      unexpected();
    }
  } else if (char === Chars.Gt) {
    // <!DOCT>
    emitToken(TokenKind.OpenTag, void 0, sectionStart + 1);
    emitToken(TokenKind.Literal);
    emitToken(TokenKind.OpenTagEnd);
  } else if (doctype.lower[offset] !== char && doctype.upper[offset] !== char) {
    // <!DOCX...
    emitToken(TokenKind.OpenTag, State.InShortComment, sectionStart + 1);
  }
}

function parseOpeningNormalComment() {
  if (char === Chars.Cl) {
    // <!--
    emitToken(TokenKind.OpenTag, State.InNormalComment, index + 1);
  } else {
    emitToken(TokenKind.OpenTag, State.InShortComment, sectionStart + 1);
  }
}

function parseNormalComment() {
  if (char === Chars.Cl) {
    // <!-- ... -
    emitToken(TokenKind.Literal, State.ClosingNormalComment);
  }
}

function parseShortComment() {
  if (char === Chars.Gt) {
    // <! ... >
    emitToken(TokenKind.Literal);
    emitToken(TokenKind.OpenTagEnd);
  }
}

function parseClosingNormalComment() {
  offset = index - sectionStart;
  if (offset === 2) {
    if (char === Chars.Gt) {
      // <!-- xxx -->
      emitToken(TokenKind.OpenTagEnd);
    } else if (char === Chars.Cl) {
      // <!-- xxx ---
      emitToken(TokenKind.Literal, void 0, sectionStart + 1);
    } else {
      // <!-- xxx --x
      state = State.InNormalComment;
    }
  } else if (char !== Chars.Cl) {
    // <!-- xxx - ...
    state = State.InNormalComment;
  }
}

function parseClosingTag() {
  offset = index - sectionStart;
  if (textMode !== TextMode.Data) {
    const endTag = textEndTag;
    if (!endTag) {
      unexpected();
    }
    if (char === Chars.Lt) {
      resetTextClosingTag();
      emitToken(TokenKind.Literal, State.BeforeOpenTag);
    } else if (offset < endTag.length) {
      if (endTag.lower[offset] !== char && endTag.upper[offset] !== char) {
        resetTextClosingTag();
      }
    } else if (char === Chars.Gt) {
      emitToken(TokenKind.CloseTag);
    } else if (!isWhiteSpace()) {
      resetTextClosingTag();
    }
  } else if (char === Chars.Gt) {
    // </ xxx >
    emitToken(TokenKind.CloseTag);
  }
}

function unexpected(): never {
  throw new SyntaxError(
    `Unexpected token "${buffer.charAt(index)}" at ${index} when parse ${state}`,
  );
}

