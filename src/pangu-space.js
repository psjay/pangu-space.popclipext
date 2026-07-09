const CJK =
  "\\u2e80-\\u2eff\\u2f00-\\u2fdf\\u3040-\\u309f\\u30a0-\\u30fa" +
  "\\u30fc-\\u30ff\\u3100-\\u312f\\u3200-\\u32ff\\u3400-\\u4dbf" +
  "\\u4e00-\\u9fff\\uf900-\\ufaff";
const ANS = "A-Za-z\\u0370-\\u03ff0-9";

function convertToFullwidth(symbols) {
  return symbols
    .replace(/~+/g, "～")
    .replace(/!+/g, "！")
    .replace(/;+/g, "；")
    .replace(/:+/g, "：")
    .replace(/,+/g, "，")
    .replace(/\.+/g, "。")
    .replace(/\?+/g, "？")
    .trim();
}

function normalizeQuotes(text) {
  return text.replace(/“/gu, "「").replace(/”/gu, "」");
}

function pangulize(input) {
  let text = input;
  const cjk = `[${CJK}]`;

  if (text.length <= 1 || !new RegExp(cjk, "u").test(text)) {
    return text;
  }

  const punctuationBetweenCjk = new RegExp(
    `(${cjk})([ ]*(?:[:]+|\\.)[ ]*)(${cjk})`,
    "u",
  );
  while (punctuationBetweenCjk.test(text)) {
    text = text.replace(
      punctuationBetweenCjk,
      (_, before, symbols, after) =>
        before + convertToFullwidth(symbols) + after,
    );
  }

  const punctuationAfterCjk = new RegExp(
    `(${cjk})[ ]*([~!;,?]+)[ ]*`,
    "u",
  );
  while (punctuationAfterCjk.test(text)) {
    text = text.replace(
      punctuationAfterCjk,
      (_, before, symbols) => before + convertToFullwidth(symbols),
    );
  }

  text = text.replace(
    new RegExp(`([.]{2,}|…)(${cjk})`, "gu"),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(`(${cjk}):([A-Z0-9()])`, "gu"),
    "$1：$2",
  );

  text = text.replace(
    new RegExp(`(${cjk})([\`"\\u05f4])`, "gu"),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(`([\`"\\u05f4])(${cjk})`, "gu"),
    "$1 $2",
  );
  text = text.replace(/([`"\u05f4]+)(\s*)(.+?)(\s*)([`"\u05f4]+)/gu, "$1$3$5");

  text = text.replace(
    new RegExp(`(${cjk})('[^s])`, "gu"),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(`(')(${cjk})`, "gu"),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(`([${CJK}A-Za-z0-9])( )('s)`, "gu"),
    "$1$3",
  );

  text = text.replace(
    new RegExp(`(${cjk})(#)(${cjk}+)(#)(${cjk})`, "gu"),
    "$1 $2$3$4 $5",
  );
  text = text.replace(
    new RegExp(`(${cjk})(#([^ ]))`, "gu"),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(`(([^ ])#)(${cjk})`, "gu"),
    "$1 $3",
  );

  text = text.replace(
    new RegExp(`(${cjk})([+*/=&|<>-])([A-Za-z0-9])`, "gu"),
    "$1 $2 $3",
  );
  text = text.replace(
    new RegExp(`([A-Za-z0-9])([+*/=&|<>-])(${cjk})`, "gu"),
    "$1 $2 $3",
  );

  text = text.replace(/([/]) ([A-Za-z\-_.\/]+)/gu, "$1$2");
  text = text.replace(/([/.])([A-Za-z\-_.\/]+) ([\/])/gu, "$1$2$3");

  text = text.replace(
    new RegExp(`(${cjk})([([{<>“])`, "gu"),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(`([)\\]}<>”])(${cjk})`, "gu"),
    "$1 $2",
  );
  text = text.replace(/([([{<“]+)(\s*)(.+?)(\s*)([)\]}>”]+)/gu, "$1$3$5");
  text = text.replace(
    new RegExp(
      `([A-Za-z0-9${CJK}])[ ]*(“)([A-Za-z0-9${CJK}\\-_ ]+)(”)`,
      "gu",
    ),
    "$1 $2$3$4",
  );
  text = text.replace(
    new RegExp(
      `(“)([A-Za-z0-9${CJK}\\-_ ]+)(”)[ ]*([A-Za-z0-9${CJK}])`,
      "gu",
    ),
    "$1$2$3 $4",
  );

  text = text.replace(/([A-Za-z0-9])([([{])/gu, "$1 $2");
  text = text.replace(/([)\]}])([A-Za-z0-9])/gu, "$1 $2");

  text = text.replace(
    new RegExp(
      `(${cjk})([${ANS}@\\$%\\^&*+\\\\=|/\\-\\u00a1-\\u00ff\\u2150-\\u218f\\u2700-\\u27bf])`,
      "gu",
    ),
    "$1 $2",
  );
  text = text.replace(
    new RegExp(
      `([${ANS}~!\\$%\\^&*+\\\\=|;:,.?/\\-\\u00a1-\\u00ff\\u2150-\\u218f\\u2700-\\u27bf])(${cjk})`,
      "gu",
    ),
    "$1 $2",
  );

  text = text.replace(/(%)([A-Za-z])/gu, "$1 $2");
  text = text.replace(/[ ]*[\u00b7\u2022\u2027][ ]*/gu, "・");
  text = text.trim();

  return normalizeQuotes(text);
}

const SKIPPED_HTML_ELEMENTS = new Set([
  "code",
  "pre",
  "script",
  "style",
  "textarea",
]);
const BLOCK_HTML_ELEMENTS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);
const HTML_ENTITY = /(&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);)/giu;
const HTML_ENTITY_ONLY = /^&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);$/iu;

function findTagEnd(html, start) {
  if (html.startsWith("<!--", start)) {
    const commentEnd = html.indexOf("-->", start + 4);
    return commentEnd < 0 ? html.length : commentEnd + 3;
  }

  let quote = "";
  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) {
        quote = "";
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  return html.length;
}

function tagInfo(tag) {
  if (/^<!--|^<!|^<\?/u.test(tag)) {
    return null;
  }
  const match = tag.match(/^<\s*(\/?)\s*([A-Za-z][\w:-]*)/u);
  if (!match) {
    return null;
  }
  return {
    closing: match[1] === "/",
    name: match[2].toLowerCase(),
    selfClosing: /\/\s*>$/u.test(tag),
  };
}

function tokenizeHtml(html) {
  const tokens = [];
  const skippedStack = [];
  let position = 0;

  while (position < html.length) {
    if (html[position] !== "<") {
      const nextTag = html.indexOf("<", position);
      const end = nextTag < 0 ? html.length : nextTag;
      tokens.push({
        type: "text",
        value: html.slice(position, end),
        skipped: skippedStack.length > 0,
      });
      position = end;
      continue;
    }

    const end = findTagEnd(html, position);
    const value = html.slice(position, end);
    const info = tagInfo(value);
    tokens.push({
      type: "tag",
      value,
      block: Boolean(info && BLOCK_HTML_ELEMENTS.has(info.name)),
    });

    if (info && SKIPPED_HTML_ELEMENTS.has(info.name)) {
      if (info.closing) {
        const stackIndex = skippedStack.lastIndexOf(info.name);
        if (stackIndex >= 0) {
          skippedStack.splice(stackIndex, 1);
        }
      } else if (!info.selfClosing) {
        skippedStack.push(info.name);
      }
    }
    position = end;
  }

  return tokens;
}

function pangulizeHtmlText(text) {
  return text
    .split(HTML_ENTITY)
    .map((fragment) => {
      if (!fragment || HTML_ENTITY_ONLY.test(fragment)) {
        return fragment;
      }
      const leading = fragment.match(/^\s*/u)[0];
      const trailing = fragment.match(/\s*$/u)[0];
      const content = fragment.slice(
        leading.length,
        fragment.length - trailing.length,
      );
      return leading + pangulize(content) + trailing;
    })
    .join("");
}

function visibleBoundary(text, fromEnd) {
  const withoutEntities = text.replace(HTML_ENTITY, " ");
  const match = fromEnd
    ? withoutEntities.match(/(\S)\s*$/u)
    : withoutEntities.match(/^\s*(\S)/u);
  return match ? match[1] : "";
}

function needsBoundarySpace(left, right) {
  return Boolean(
    left &&
      right &&
      !/\s/u.test(left) &&
      !/\s/u.test(right) &&
      pangulize(left + right) === `${pangulize(left)} ${pangulize(right)}`,
  );
}

function pangulizeHtml(html) {
  const tokens = tokenizeHtml(html);
  let previousTextToken = null;
  let boundaryBlocked = false;

  for (const token of tokens) {
    if (token.type === "tag") {
      if (token.block) {
        boundaryBlocked = true;
        previousTextToken = null;
      }
      continue;
    }

    if (token.skipped) {
      previousTextToken = null;
      boundaryBlocked = true;
      continue;
    }

    token.value = pangulizeHtmlText(token.value);
    if (!token.value.trim()) {
      continue;
    }

    if (previousTextToken && !boundaryBlocked) {
      const left = visibleBoundary(previousTextToken.value, true);
      const right = visibleBoundary(token.value, false);
      if (
        needsBoundarySpace(left, right) &&
        !/\s$/u.test(previousTextToken.value) &&
        !/^\s/u.test(token.value)
      ) {
        previousTextToken.value += " ";
      }
    }

    previousTextToken = token;
    boundaryBlocked = false;
  }

  return tokens.map((token) => token.value).join("");
}

function run(popclipApi) {
  const text = pangulize(popclipApi.input.text);
  if (popclipApi.input.html) {
    popclipApi.pasteContent({
      "public.html": pangulizeHtml(popclipApi.input.html),
      "public.utf8-plain-text": text,
    });
  } else {
    popclipApi.pasteText(text);
  }
}

if (typeof module !== "undefined") {
  module.exports = { pangulize, pangulizeHtml, run };
}

if (typeof popclip !== "undefined") {
  run(popclip);
}
