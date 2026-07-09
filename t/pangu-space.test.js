const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const scriptPath =
  process.env.PANGU_SPACE_SCRIPT ||
  path.join(root, "src", "pangu-space.js");
const configPath =
  process.env.PANGU_SPACE_CONFIG ||
  path.join(root, "src", "Config.plist");
const { pangulize, pangulizeHtml, run } = require(scriptPath);

test("extension configuration", () => {
  const plist = fs.readFileSync(configPath, "utf8");
  assert.match(
    plist,
    /<key>JavaScript File<\/key>\s*<string>pangu-space\.js<\/string>/,
  );
  assert.match(
    plist,
    /<key>Title<\/key>\s*<string>pangulize<\/string>/,
  );
  assert.match(
    plist,
    /<key>Requirements<\/key>\s*<array>\s*<string>copy<\/string>\s*<string>paste<\/string>\s*<\/array>/,
  );
  assert.match(plist, /<key>Capture HTML<\/key>\s*<true\/>/);
});

const cases = [
  ["leaves text without CJK untouched", "Hello, world! 123", "Hello, world! 123"],
  [
    "inserts spaces around Latin words and numbers",
    "當你凝視著bug，bug也凝視著你123次",
    "當你凝視著 bug，bug 也凝視著你 123 次",
  ],
  [
    "inserts spaces around ASCII punctuation symbols",
    "中文@user和价格$100以及A/B测试",
    "中文 @user 和价格 $100 以及 A/B 测试",
  ],
  [
    "converts repeated punctuation after CJK to fullwidth",
    "你好!!!真的吗???可以,当然;好~结束",
    "你好！真的吗？可以，当然；好～结束",
  ],
  ["converts ASCII punctuation between CJK to fullwidth", "甲:乙.丙", "甲：乙。丙"],
  ["keeps colon before uppercase answers fullwidth", "问题:A", "问题：A"],
  [
    "adds spacing after dots and ellipsis before CJK",
    "Wait...中文以及…中文",
    "Wait... 中文以及… 中文",
  ],
  [
    "normalizes straight quotes around CJK text",
    '他说"中文OK"结束',
    '他说 "中文 OK" 结束',
  ],
  [
    "converts curly double quotes to corner quotes after spacing",
    "中文“quote测试”结尾",
    "中文 「quote 测试」 结尾",
  ],
  [
    "handles single quotes without breaking possessives",
    "中文's owner和'中文'",
    "中文's owner 和 ' 中文'",
  ],
  [
    "adds spaces around hashtags",
    "前#标签#后和中文#tag结尾",
    "前 #标签# 后和中文 #tag 结尾",
  ],
  [
    "adds spaces around operators",
    "中文+A和B+中文以及中文=1",
    "中文 + A 和 B + 中文以及中文 = 1",
  ],
  [
    "matches pangu slash spacing behavior",
    "打开/Users/name/项目和A/中文",
    "打开 /Users/name/ 项目和 A / 中文",
  ],
  [
    "keeps an absolute path intact after CJK",
    "跳转到/User/home 目录下",
    "跳转到 /User/home 目录下",
  ],
  [
    "adds spaces around brackets",
    "中文(test)和A(中文)以及中文[OK]",
    "中文 (test) 和 A (中文) 以及中文 [OK]",
  ],
  [
    "normalizes middle dot variants",
    "中文 · English • 日本語 ‧ 한글",
    "中文・English・日本語・한글",
  ],
  [
    "spaces Greek letters and percent units",
    "角度α中文增长100%YoY",
    "角度 α 中文增长 100% YoY",
  ],
  ["preserves literal plus signs", "中文 A+B 测试", "中文 A+B 测试"],
  [
    "matches pangu Japanese and Hangul range behavior",
    "日本語abcと한글ABC",
    "日本語 abc と한글ABC",
  ],
  [
    "preserves English typography when no CJK is present",
    "“Hello, world”",
    "“Hello, world”",
  ],
  ["handles empty input", "", ""],
  ["handles a single CJK character", "中", "中"],
  [
    "is idempotent for already formatted text",
    "中文 English 123 测试",
    "中文 English 123 测试",
  ],
  [
    "preserves the original supported CJK range boundary",
    "𠀀test",
    "𠀀test",
  ],
];

for (const [name, input, expected] of cases) {
  test(name, () => assert.equal(pangulize(input), expected));
}

test("preserves HTML structure and attributes", () => {
  const input =
    '<p class="中文title">你好<strong>world</strong>，访问' +
    '<a href="https://example.com/中文?q=A">官网site</a></p>';
  const expected =
    '<p class="中文title">你好 <strong>world</strong>，访问' +
    '<a href="https://example.com/中文?q=A">官网 site</a></p>';
  assert.equal(pangulizeHtml(input), expected);
});

test("handles spacing across inline element boundaries", () => {
  assert.equal(
    pangulizeHtml("<span>中文</span><em>English</em><b>测试</b>"),
    "<span>中文 </span><em>English </em><b>测试</b>",
  );
});

test("does not add spacing across block boundaries", () => {
  assert.equal(
    pangulizeHtml("<p>中文</p><p>English测试</p>"),
    "<p>中文</p><p>English 测试</p>",
  );
});

test("leaves code and other raw content untouched", () => {
  const input =
    "<p>正文text</p><pre>中文code</pre><code>中文code</code>" +
    "<script>const 中文='text';</script><style>.中文{font:x}</style>";
  const expected =
    "<p>正文 text</p><pre>中文code</pre><code>中文code</code>" +
    "<script>const 中文='text';</script><style>.中文{font:x}</style>";
  assert.equal(pangulizeHtml(input), expected);
});

test("preserves comments, quoted greater-than signs, and entities", () => {
  const input =
    '<p title="1 > 0">中文text&nbsp;保持</p><!-- 中文comment -->';
  const expected =
    '<p title="1 > 0">中文 text&nbsp;保持</p><!-- 中文comment -->';
  assert.equal(pangulizeHtml(input), expected);
});

test("preserves whitespace around formatted text nodes", () => {
  assert.equal(
    pangulizeHtml("<p>  中文text \n <strong> 测试OK  </strong></p>"),
    "<p>  中文 text \n <strong> 测试 OK  </strong></p>",
  );
});

test("preserves English quotes in rich text without CJK", () => {
  assert.equal(
    pangulizeHtml("<p>“Hello, <strong>world</strong>”</p>"),
    "<p>“Hello, <strong>world</strong>”</p>",
  );
});

test("handles case-insensitive and nested skipped elements", () => {
  const input =
    "<CODE>中文code<pre>嵌套text</pre>结束end</CODE><span>正文text</span>";
  const expected =
    "<CODE>中文code<pre>嵌套text</pre>结束end</CODE><span>正文 text</span>";
  assert.equal(pangulizeHtml(input), expected);
});

test("resumes processing after skipped and self-closing elements", () => {
  assert.equal(
    pangulizeHtml("<code>中文code</code><code/><span>正文text</span>"),
    "<code>中文code</code><code/><span>正文 text</span>",
  );
});

test("does not bridge text across line-break elements", () => {
  assert.equal(
    pangulizeHtml("<span>中文</span><br><span>English测试</span>"),
    "<span>中文</span><br><span>English 测试</span>",
  );
});

test("preserves declarations and processing instructions", () => {
  const input =
    '<!DOCTYPE html><?xml version="1.0"?><p data-label="中文text">中文text</p>';
  const expected =
    '<!DOCTYPE html><?xml version="1.0"?><p data-label="中文text">中文 text</p>';
  assert.equal(pangulizeHtml(input), expected);
});

test("HTML conversion is idempotent", () => {
  const once = pangulizeHtml(
    "<p>中文<strong>English</strong>测试&nbsp;text</p>",
  );
  assert.equal(pangulizeHtml(once), once);
});

test("pastes HTML and plain-text representations together", () => {
  let pasted;
  run({
    input: {
      text: "中文text",
      html: "<strong>中文text</strong>",
    },
    pasteContent(content) {
      pasted = content;
    },
    pasteText() {
      assert.fail("plain-text fallback should not be used");
    },
  });
  assert.deepEqual(pasted, {
    "public.html": "<strong>中文 text</strong>",
    "public.utf8-plain-text": "中文 text",
  });
});

test("falls back to plain text when HTML is unavailable", () => {
  let pasted;
  run({
    input: { text: "中文text", html: "" },
    pasteContent() {
      assert.fail("rich-text paste should not be used");
    },
    pasteText(text) {
      pasted = text;
    },
  });
  assert.equal(pasted, "中文 text");
});

test("processes a one-megabyte selection within a reasonable time", () => {
  const input = `<p>${"中文text。".repeat(125_000)}</p>`;
  const startedAt = performance.now();
  const output = pangulizeHtml(input);
  const elapsed = performance.now() - startedAt;
  assert.ok(output.length > input.length);
  assert.ok(elapsed < 2_000, `conversion took ${elapsed.toFixed(1)} ms`);
});
