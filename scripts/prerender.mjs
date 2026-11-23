// 허브 검색용 정적 파일 만들기
//
// index.html은 자바스크립트가 내용을 그려요. 네이버·AI 크롤러는 대부분 JS를 실행하지 않아서
// 빈 페이지로 보이기 때문에, 이 스크립트가 브라우저로 한 번 그려서 그 결과를 HTML에 미리 넣어요.
//
// index.html의 COMMON·TEXT를 고친 뒤 실행하세요:  node scripts/prerender.mjs
// 필요: playwright (Claude 클라우드 세션에는 설치돼 있어요. 로컬은 npx playwright install chromium)
//
// 만들어지는 것
//   index.html      영어(기본) 본문과 <head> 검색 태그
//   ko/index.html   한국어 본문과 <head> 검색 태그 (index.html에서 자동 생성, 직접 고치지 않기)
//   sitemap.xml, llms.txt, og.png

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

// 이 저장소엔 package.json이 없어서, 없으면 전역 설치된 playwright를 써요
const { chromium } = await import("playwright").catch(() =>
  createRequire(import.meta.url)(join(execSync("npm root -g").toString().trim(), "playwright")),
);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "index.html");
const LANGS = { en: { path: "/", locale: "en_US" }, ko: { path: "/ko/", locale: "ko_KR" } };
const CATEGORY = { nopo: "TravelApplication", bts: "TravelApplication", name: "EntertainmentApplication", uniggul: "ShoppingApplication", costco: "ShoppingApplication" };

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const replaceBetween = (html, start, end, inner) => {
  const i = html.indexOf(start), j = html.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error(`표시를 못 찾았어요: ${start}`);
  return html.slice(0, i + start.length) + inner + html.slice(j);
};

const browser = await chromium.launch();
const rendered = {};
let data;
for (const lang of Object.keys(LANGS)) {
  const ctx = await browser.newContext(); // 저장된 언어·테마 없이 깨끗하게
  const page = await ctx.newPage();
  await page.route("**/_vercel/**", (r) => r.abort());
  await page.goto(pathToFileURL(SRC).href + "#" + lang);
  await page.waitForFunction(() => document.getElementById("services").children.length > 0);
  rendered[lang] = await page.evaluate(() => {
    const main = document.querySelector("main.wrap").cloneNode(true);
    const clock = main.querySelector("#clock");
    clock.textContent = ""; clock.removeAttribute("datetime");
    return main.innerHTML;
  });
  data ??= await page.evaluate(() => ({ COMMON, TEXT: { ko: { ...TEXT.ko, updated: null }, en: { ...TEXT.en, updated: null } } }));
  await ctx.close();
}

const { COMMON, TEXT } = data;
const SITE = COMMON.site;
const live = COMMON.services.filter((s) => s.url);
const plain = (s) => s.replace(/\{\w+:([^}]+)\}/g, "$1");

function jsonLd(lang) {
  const t = TEXT[lang];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: `${SITE}/`,
        name: "reyfarm",
        alternateName: "Rey.K",
        inLanguage: ["en", "ko"],
        publisher: { "@id": `${SITE}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${SITE}/#person`,
        name: lang === "ko" ? "김대호" : "Daeho Kim",
        alternateName: ["Rey.K", lang === "ko" ? "Daeho Kim" : "김대호"],
        url: `${SITE}/`,
        email: `mailto:${COMMON.email}`,
        jobTitle: lang === "ko" ? "UI/UX 디자이너, 1인 서비스 개발자" : "UI/UX designer and solo service maker",
        homeLocation: { "@type": "Place", name: "Seoul, South Korea" },
        knowsLanguage: ["ko", "en"],
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE}${LANGS[lang].path}#page`,
        url: `${SITE}${LANGS[lang].path}`,
        name: t.metaTitle,
        description: t.metaDesc,
        inLanguage: lang,
        isPartOf: { "@id": `${SITE}/#website` },
        mainEntity: { "@id": `${SITE}/#person` },
        dateModified: COMMON.updated,
        hasPart: {
          "@type": "ItemList",
          name: lang === "ko" ? "Rey.K가 만든 서비스" : "Services by Rey.K",
          itemListElement: live.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "WebApplication",
              name: t.services[s.id].name,
              url: s.url,
              description: t.services[s.id].desc,
              applicationCategory: CATEGORY[s.id] ?? "UtilitiesApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
              creator: { "@id": `${SITE}/#person` },
            },
          })),
        },
      },
    ],
  };
}

function seoHead(lang) {
  const t = TEXT[lang], url = `${SITE}${LANGS[lang].path}`;
  const other = lang === "ko" ? "en" : "ko";
  const lines = [
    `<title>${esc(t.metaTitle)}</title>`,
    `<meta name="description" content="${esc(t.metaDesc)}">`,
    `<meta name="author" content="Rey.K (${esc(lang === "ko" ? "김대호" : "Daeho Kim")})">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="en" href="${SITE}/">`,
    `<link rel="alternate" hreflang="ko" href="${SITE}/ko/">`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}/">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="reyfarm">`,
    `<meta property="og:title" content="${esc(t.metaTitle)}">`,
    `<meta property="og:description" content="${esc(t.metaDesc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(t.title)}">`,
    `<meta property="og:locale" content="${LANGS[lang].locale}">`,
    `<meta property="og:locale:alternate" content="${LANGS[other].locale}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(t.metaTitle)}">`,
    `<meta name="twitter:description" content="${esc(t.metaDesc)}">`,
    `<meta name="twitter:image" content="${SITE}/og.png">`,
  ];
  if (COMMON.naverVerification) lines.push(`<meta name="naver-site-verification" content="${esc(COMMON.naverVerification)}">`);
  lines.push(`<script type="application/ld+json">${JSON.stringify(jsonLd(lang)).replace(/</g, "\\u003c")}</script>`);
  return "\n" + lines.join("\n") + "\n";
}

const SEO_START = "직접 고치지 마세요 -->", SEO_END = "<!-- seo:end -->";
const MAIN_START = '<main class="wrap">', MAIN_END = "</main>";
const build = (src, lang) => {
  let html = replaceBetween(src, SEO_START, SEO_END, seoHead(lang));
  html = replaceBetween(html, MAIN_START, MAIN_END, rendered[lang]);
  return html.replace(/<html lang="\w+">/, `<html lang="${lang}">`);
};

const src = readFileSync(SRC, "utf8");
writeFileSync(SRC, build(src, "en"));
mkdirSync(join(ROOT, "ko"), { recursive: true });
writeFileSync(
  join(ROOT, "ko/index.html"),
  build(src, "ko").replace("<head>", "<head>\n<!-- 자동 생성 파일: 루트 index.html을 고치고 node scripts/prerender.mjs를 실행하세요 -->"),
);

// sitemap.xml
const urls = [
  { loc: `${SITE}/`, alt: true, pri: "1.0" },
  { loc: `${SITE}/ko/`, alt: true, pri: "1.0" },
  { loc: `${SITE}/privacy/`, pri: "0.3" },
];
const altLinks = `\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/"/>\n    <xhtml:link rel="alternate" hreflang="ko" href="${SITE}/ko/"/>`;
writeFileSync(
  join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${COMMON.updated}</lastmod>\n    <priority>${u.pri}</priority>${u.alt ? altLinks : ""}\n  </url>`).join("\n")}
</urlset>
`,
);

// llms.txt (AI가 사이트를 빠르게 파악하는 요약)
const ko = TEXT.ko, en = TEXT.en;
writeFileSync(
  join(ROOT, "llms.txt"),
  `# reyfarm — Rey.K (김대호 Daeho Kim)

> ${ko.metaDesc}
> ${en.metaDesc}

${ko.intro.map(plain).join("\n\n")}

${ko.about.join(" ")}

## 서비스 (Services)
${live.map((s) => `- [${ko.services[s.id].name} (${en.services[s.id].name})](${s.url}): ${ko.services[s.id].desc} / ${en.services[s.id].desc}`).join("\n")}

모든 서비스는 무료 웹 서비스이고 Rey.K가 혼자 기획·디자인·개발했어요.

## 페이지
- [소개 (한국어)](${SITE}/ko/)
- [About (English)](${SITE}/)
- [개인정보처리방침 · 고지](${SITE}/privacy/)

## 연락
- 이메일: ${COMMON.email}
- 위치: 대한민국 서울

## 고지
${ko.notice}
`,
);

// og.png (1200×630 공유 미리보기)
const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// 새싹 아이콘: Google Noto Emoji (오픈 라이선스). Apple 이모지 이미지는 저작권 때문에 쓰지 않아요
const farm = readFileSync(join(ROOT, "assets/seedling.svg")).toString("base64");
await ogPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#fff;color:rgba(0,0,0,.9);font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans CJK KR","Noto Sans KR",sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 96px;gap:28px;word-break:keep-all}
  .logo{width:96px;height:96px;border-radius:22px;box-shadow:0 0 0 1px rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center}
  .logo img{width:60px;height:60px}
  h1{font-size:64px;font-weight:600;letter-spacing:-.02em}
  p{font-size:32px;color:rgba(0,0,0,.55);line-height:1.45}
  .url{font-size:26px;color:rgba(0,0,0,.4)}
</style></head><body>
  <div class="logo"><img src="data:image/svg+xml;base64,${farm}" alt=""></div>
  <h1>Rey.K · 김대호</h1>
  <p>일상에 작은 즐거움을 더하는 서비스를 만들어요.<br>${live.map((s) => ko.services[s.id].name).join(" · ")}</p>
  <div class="url">reyfarm.app</div>
</body></html>`);
await ogPage.screenshot({ path: join(ROOT, "og.png") });

await browser.close();
console.log("완료: index.html, ko/index.html, sitemap.xml, llms.txt, og.png");
