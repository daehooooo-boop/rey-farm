# 검색·AI 답변·애드센스 기준 (SEO · GEO · AdSense)

reyfarm.app 허브와 모든 서비스(`<id>.reyfarm.app`)가 검색엔진(구글·네이버)과 AI 답변(ChatGPT, Perplexity, Claude, 구글 AI 개요)에 잘 잡히고, 나중에 구글 애드센스를 붙일 수 있게 하는 공통 기준이에요.

**Claude에게:** 새 서비스는 [NEW_SERVICE.md](NEW_SERVICE.md)와 함께 이 문서를 따르세요. 기존 서비스에 적용할 때는 맨 아래 "적용 현황" 표를 보고 빠진 항목만 PR로 채우고, 끝나면 표를 갱신하세요.

---

## 0. 순서와 원칙

1. **SEO 기본기 → 2. GEO(AI 답변) → 3. 허브↔서비스 연결 → 4. 검색 등록 → 5. 애드센스.** 애드센스 심사는 "콘텐츠가 충분하고 정책 페이지가 있는 사이트"를 보기 때문에 1~4가 먼저예요.
2. **크롤러는 자바스크립트를 잘 안 돌려요.** 구글은 돌리지만 늦고, 네이버·AI 크롤러(GPTBot, ClaudeBot, PerplexityBot 등)는 대부분 HTML만 읽어요. 서비스 이름, 한 줄 설명, 핵심 안내 문장은 **서버에서 렌더된 HTML에 글자로** 있어야 해요. 지도·결과 화면처럼 클라이언트에서만 그려지는 부분은 그 옆에 설명 문단을 둬요.
3. **한 사람, 한 브랜드로 묶기.** 모든 서비스가 "Rey.K(김대호)가 만든 reyfarm의 서비스"로 같은 이름·같은 링크를 써야 검색엔진과 AI가 하나의 출처로 인식해요.
4. **개인 정보가 URL에 실리는 화면은 색인·광고 대상에서 빼요**(이름 궁합 결과 화면 등).

---

## 1. SEO 기본기 (Next.js 서비스)

### 사이트 정보 (`src/lib/site.ts`)

NEW_SERVICE.md 3장의 `SITE`에 검색용 값을 더해요. 모든 메타데이터·JSON-LD·llms.txt가 여기서 값을 가져가요.

```ts
export const SITE = {
  name: "<서비스 이름>",
  nameEn: "<영문 이름>",
  tagline: "<한 줄 정의: 무엇을, 누구에게>",      // 30자 안팎
  description: "<두 문장 설명. 검색 결과에 그대로 보임>", // 80~120자
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://<id>.reyfarm.app",
  locale: "ko_KR",
  keywords: ["<사람들이 실제로 검색할 말>", "..."],
  creator: {
    name: "Rey.K",
    fullName: "김대호",
    url: "https://reyfarm.app",
  },
} as const;
```

### 루트 메타데이터 (`src/app/layout.tsx`)

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),            // OG·canonical 상대 주소의 기준. 꼭 넣기
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  authors: [{ name: SITE.creator.name, url: SITE.creator.url }],
  creator: SITE.creator.name,
  alternates: { canonical: "/" },             // 페이지마다 자기 경로로 덮어쓰기
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: "/",
    locale: SITE.locale,
  },
  twitter: { card: "summary_large_image" },
  verification: {
    other: { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_VERIFICATION ?? "" },
  },
};
```

- 페이지마다 `export const metadata`(또는 `generateMetadata`)로 `title`, `description`, `alternates.canonical`을 그 페이지에 맞게 써요.
- 한/영 두 언어면 `alternates.languages: { "ko-KR": "/", "en-US": "/en" }`(이름 궁합 방식).
- 검색에 안 나와야 하는 화면(결과, 관리, 개인 정보 화면)은 `robots: { index: false, follow: true }`.

### OG 이미지 (`src/app/opengraph-image.tsx`)

- 1200×630, 서비스 이름 + 한 줄 정의 + 아이콘. `next/og`의 `ImageResponse`로 만들어요(이름 궁합 `src/app/opengraph-image.tsx` 참고).
- 카카오톡·슬랙·X 공유 미리보기가 이걸 써요. 한국어 글꼴은 Pretendard를 불러와야 깨지지 않아요.

### `src/app/robots.ts`

```ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] }, // 결과·개인 정보 경로도 여기에
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
```

AI 크롤러(GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended)는 **막지 않는 게 기본값**이에요. AI 답변에 출처로 나오는 것이 목표라서요. 특정 서비스에서 막고 싶으면 사용자에게 먼저 물어요.

### `src/app/sitemap.ts`

공개 페이지를 모두 넣어요. 데이터로 만들어지는 상세 페이지(노포맵 가게, 코스트코 상품 등)가 있으면 그것도 넣으면 검색 유입이 크게 늘어요.

```ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
```

### 구조화 데이터 (JSON-LD)

루트 레이아웃(또는 홈) `<body>` 안에 한 번 넣어요. 서비스는 `WebApplication`, 만든 사람은 `Person`으로 허브를 가리켜요.

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE.url}/#app`,
      name: SITE.name,
      alternateName: SITE.nameEn,
      url: SITE.url,
      description: SITE.description,
      applicationCategory: "<UtilitiesApplication | TravelApplication | LifestyleApplication 등>",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      creator: { "@id": "https://reyfarm.app/#person" },
      isPartOf: { "@id": "https://reyfarm.app/#website" },
    },
    {
      "@type": "Person",
      "@id": "https://reyfarm.app/#person",
      name: "김대호",
      alternateName: "Rey.K",
      url: "https://reyfarm.app",
    },
  ],
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
/>
```

- FAQ 영역(2장)이 있으면 같은 내용을 `FAQPage`로도 넣어요. **화면에 보이는 질문·답과 글자까지 같아야** 해요.
- 상세 페이지가 있으면 맞는 타입을 써요(가게: `Restaurant`/`LocalBusiness`, 상품: `Product`).
- 확인: [리치 결과 테스트](https://search.google.com/test/rich-results), [Schema 검사](https://validator.schema.org/).

### 콘텐츠 기본

- 페이지마다 `<h1>` 하나(서비스 이름 또는 그 페이지 주제), 제목은 `h2`부터 순서대로.
- 이미지에 `alt`, 아이콘 버튼에 `aria-label`.
- 첫 화면 문장에 사람들이 실제로 검색하는 말을 자연스럽게 넣어요(예: "서울 노포 맛집 지도", "코스트코 이번 주 할인").
- 속도: 이미 Next.js + Vercel이라 기본은 충분해요. 큰 이미지는 `next/image`, 광고·지도처럼 늦게 떠도 되는 스크립트는 `next/script`의 `lazyOnload`.

---

## 2. GEO: AI 답변에 출처로 잡히기

AI 검색은 "질문에 바로 답이 되는 문장"과 "누가 만든 무엇인지 분명한 페이지"를 인용해요.

### 페이지 안의 글

- **첫 문단에 한 줄 정의**: "○○는 △△를 □□해 주는 무료 웹 서비스예요." 주어·대상·가치가 한 문장에 다 있게.
- **FAQ 영역**: 홈 아래나 `/about`에 질문 4~6개. 실제로 사람들이 물을 말투로.
  - 예: "코스트코 이번 주 할인은 언제 바뀌나요?", "노포맵의 노포 기준은 뭔가요?", "BTS는 어느 지역 버스를 지원하나요?"
  - 답은 2~3문장, 첫 문장에 결론. 숫자·기준·갱신 주기를 구체적으로.
- **출처와 갱신일**: 데이터를 쓰는 서비스는 "데이터: ○○ 공공 API, 매일 07시 갱신"처럼 출처와 날짜를 글자로 표시해요. AI가 신뢰도 판단에 써요.
- **만든 사람**: 푸터에 "Rey.K가 만든 작은 서비스 · reyfarm.app" 링크(3장).

### `public/llms.txt`

AI가 사이트를 빠르게 파악하도록 하는 요약 파일이에요(llmstxt.org 형식). 짧게 유지해요.

```md
# <서비스 이름>

> <한 줄 정의. 누구에게 무엇을 해 주는지.>

<2~3문장: 핵심 기능, 데이터 출처와 갱신 주기, 무료 여부.>

## 주요 페이지
- [홈](https://<id>.reyfarm.app/): <설명>
- [소개·FAQ](https://<id>.reyfarm.app/about): 자주 묻는 질문
- [개인정보처리방침](https://<id>.reyfarm.app/privacy)

## 만든 사람
- [Rey.K (김대호)](https://reyfarm.app): reyfarm의 다른 서비스 목록
```

### `/about` 페이지 (권장)

서비스 소개, 만든 이유, 데이터 출처, FAQ, 문의처를 한 페이지에. GEO 인용, 애드센스 심사(5장), 네이버 신뢰도 모두에 도움이 돼요. 기능만 있는 한 화면짜리 서비스일수록 꼭 두세요.

---

## 3. 허브 ↔ 서비스 연결

- **서비스 → 허브**: 모든 서비스 푸터에 같은 문구로 링크.
  ```tsx
  <a href="https://reyfarm.app" rel="author">Rey.K가 만든 작은 서비스 · reyfarm.app</a>
  ```
- **서비스 → 다른 서비스**: 필수는 아니지만, `/about` 아래 "reyfarm의 다른 서비스" 목록이 있으면 좋아요.
- **허브 → 서비스**: 이미 카드로 연결돼 있어요. 허브 JSON-LD에서 `Person`과 각 서비스를 묶어요(4장 허브 항목).
- 이름 표기를 통일해요: 사람은 "Rey.K (김대호)", 사이트는 "reyfarm", 주소는 `https://reyfarm.app`.

---

## 4. 허브(reyfarm.app) 전용 항목

허브는 빌드 없는 정적 `index.html`이라 Next.js 방식 대신 파일을 직접 둬요.

- **본문이 자바스크립트로만 그려지는 문제**: 지금 `<body>`의 소개·카드·About이 모두 빈 태그이고 스크립트가 채워요. 크롤러가 JS를 안 돌리면 빈 페이지로 보여요. 기본 언어(한국어) 내용을 HTML에 미리 써 두고, 스크립트는 언어 전환 때만 바꾸게 고쳐요.
- `<head>`: `<html lang="ko">`, `<link rel="canonical" href="https://reyfarm.app/">`, `og:title`·`og:description`·`og:image`(1200×630, `og.png`)·`og:url`, `twitter:card`.
- JSON-LD: `WebSite`(`@id: https://reyfarm.app/#website`) + `Person`(`@id: https://reyfarm.app/#person`, `name: 김대호`, `alternateName: Rey.K`, `url`, `email`) + `ItemList`로 서비스 목록(각 항목 `url`).
- 루트 파일: `robots.txt`, `sitemap.xml`, `llms.txt`(허브용: 사람 소개 + 서비스 목록과 한 줄 설명), 애드센스 승인 뒤 `ads.txt`(5장).
- 서비스 카드를 추가할 때(NEW_SERVICE.md 7장) `llms.txt`와 JSON-LD 목록에도 한 줄 추가.

---

## 5. 검색 등록 (사용자가 하는 일)

### Google Search Console: 도메인 하나로 전부

1. [Search Console](https://search.google.com/search-console) → 속성 추가 → **도메인** 유형 → `reyfarm.app`.
2. 나오는 TXT 값을 Vercel → Domains → `reyfarm.app` → DNS Records에 TXT(이름 `@`)로 추가. `reyfarm.app`은 Vercel에서 산 도메인이라 여기서 바로 돼요.
3. 이 한 번으로 **모든 서브도메인이 함께 확인**돼요. 서비스를 새로 만들어도 다시 할 필요 없어요.
4. Sitemaps 메뉴에 각 사이트맵 주소를 제출: `https://reyfarm.app/sitemap.xml`, `https://<id>.reyfarm.app/sitemap.xml`.

### 네이버 서치어드바이저: 사이트마다 등록

한국어 서비스라 네이버 유입이 커요. 네이버는 서브도메인을 각각 등록해야 해요.

1. [서치어드바이저](https://searchadvisor.naver.com) → 웹마스터 도구 → 사이트 등록 → `https://<id>.reyfarm.app`.
2. HTML 태그 방식 선택 → `content` 값을 Vercel 환경 변수 `NEXT_PUBLIC_NAVER_VERIFICATION`에 넣고 재배포(1장 메타데이터가 태그를 만들어요). 허브는 `index.html`에 태그 직접 추가.
3. 요청 → 사이트맵 제출, RSS가 있으면 RSS 제출.

### Bing Webmaster Tools

ChatGPT 검색과 Copilot이 Bing 색인을 써요. [Bing Webmaster](https://www.bing.com/webmasters)에서 **Google Search Console에서 가져오기**를 누르면 한 번에 끝나요.

---

## 6. 애드센스 준비

### 먼저 정할 것: Vercel 요금제

Vercel Hobby(무료)는 **비상업 용도만** 허용돼요. 광고를 붙이면 상업 용도라 **광고가 나가는 프로젝트는 Pro(사용자 1명 월 $20)로 옮겨야** 해요. Pro는 팀 단위라 한 번 올리면 모든 서비스가 함께 쓸 수 있어요. 광고를 실제로 켜기 전에 사용자가 결정해요.

### 사이트 등록 구조

- 애드센스에는 **`reyfarm.app` 하나만** 등록해요. 승인되면 하위 서브도메인 서비스에도 같은 계정 광고를 넣을 수 있어요.
- 심사는 등록한 사이트를 보기 때문에, 신청 전에 **허브가 빈 페이지로 보이지 않게(4장)** 하고 각 서비스의 `/about`·`/privacy`가 있어야 통과율이 높아요.
- 심사 중 "가치가 별로 없는 콘텐츠"로 거절되는 경우가 많아요. 기능만 있는 화면보다, 설명 글·FAQ·데이터 상세 페이지처럼 읽을거리가 있는 서비스부터 광고를 붙여요.

### 꼭 있어야 하는 페이지

| 페이지 | 내용 |
| --- | --- |
| `/privacy` 개인정보처리방침 | 수집 항목(없으면 "직접 수집하지 않음"), Vercel Web Analytics(쿠키 없음), **Google 애드센스가 쿠키로 맞춤 광고를 한다는 안내와 [광고 설정](https://adssettings.google.com) 링크**, 문의처, 시행일 |
| `/about` 소개 | 2장 참고. 운영자와 연락처가 보여야 해요 |
| 연락처 | 허브 이메일(`rey.k@kakao.com`) 링크면 충분 |

`/privacy`는 서비스마다 같은 틀을 쓰고 서비스 이름·수집 항목만 바꿔요. 각 서비스 푸터에 링크해요.

### 동의 메시지 (유럽·영국 방문자)

애드센스 → 개인 정보 보호 및 메시지 → **유럽 규정 메시지**를 켜요. 구글 인증 동의 창이라 따로 만들 필요가 없어요.

### `ads.txt`

- 승인 뒤 애드센스가 알려 주는 한 줄을 **허브 저장소 루트 `ads.txt`**에 넣어요. `https://reyfarm.app/ads.txt`가 기준이에요.
  ```
  google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
  ```
- 서브도메인 서비스는 루트 도메인의 ads.txt를 따라가서 따로 둘 필요는 없어요. 애드센스가 서브도메인 경고를 띄우면 그 서비스 `public/ads.txt`에도 같은 줄을 넣어요.

### 코드 (Next.js)

게시자 ID(`ca-pub-...`)는 비밀값이 아니지만 서비스마다 바꿔 끼우기 쉽게 환경 변수로 둬요.

```tsx
// src/components/AdSense.tsx — 루트 레이아웃에서 한 번
import Script from "next/script";

export function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) return null; // 값이 없으면 광고 코드 자체를 안 넣음 (기본 꺼짐)
  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
```

- **심사 신청할 때**는 이 스크립트만 있으면 돼요(자동 광고 끈 상태로).
- 승인 뒤 광고 자리는 수동 단위(`<ins class="adsbygoogle">`)로 정한 곳에만 넣어요. 자동 광고는 화면 디자인을 흔들어서 기본으로 쓰지 않아요.

### 광고 자리 원칙

- **핵심 화면 위에는 넣지 않아요.** 첫 화면에서 서비스가 바로 쓰이는 게 우선이에요(지도, 검색창, 결과 첫 줄).
- 넣는 곳: 목록 중간(예: 항목 6~8개마다 1개), 상세·설명 글 아래, 푸터 위.
- 버튼·링크 바로 옆 금지(실수 클릭은 정책 위반이에요). 광고 위아래 여백을 충분히.
- 광고 자리 높이를 CSS로 미리 잡아 화면이 밀리지 않게(CLS).
- 광고에 "광고" 라벨을 붙여 콘텐츠와 구분.
- **개인 정보가 URL에 실리는 화면(이름 궁합 결과 등)에는 광고 스크립트를 넣지 않아요.** 광고 스크립트는 페이지 주소를 구글로 보내요.
- 다크 모드에서도 광고 영역 배경이 튀지 않게 토큰 색을 써요.

---

## 7. 서비스별 체크리스트

PR 본문에 붙여 쓰세요.

**Claude가 하는 일**

- [ ] `site.ts`에 `tagline`, `description`, `keywords`, `creator`
- [ ] 루트 메타데이터: `metadataBase`, title 템플릿, canonical, OG, twitter, 네이버 확인 태그
- [ ] `opengraph-image.tsx` (한국어 글꼴 확인)
- [ ] `robots.ts`, `sitemap.ts` (상세 페이지 포함)
- [ ] JSON-LD: `WebApplication` + `Person`(허브 `@id`), FAQ 있으면 `FAQPage`
- [ ] 핵심 문장이 서버 렌더 HTML에 있음 (JS 끄고 확인)
- [ ] 첫 문단 한 줄 정의, FAQ 4~6개, 데이터 출처·갱신일
- [ ] `public/llms.txt`
- [ ] `/about`, `/privacy` 페이지, 푸터 링크(허브·소개·개인정보)
- [ ] 개인 정보 화면 `noindex` + 광고 제외
- [ ] (애드센스 단계) `AdSenseScript`, 광고 자리
- [ ] lint, test, build 통과, 리치 결과 테스트 통과

**사용자가 하는 일**

- [ ] Search Console 도메인 속성 `reyfarm.app` (한 번만), 사이트맵 제출
- [ ] 네이버 서치어드바이저 사이트 등록, 확인값을 Vercel 환경 변수에
- [ ] Bing Webmaster에서 Search Console 가져오기 (한 번만)
- [ ] (애드센스 단계) Vercel Pro 전환 결정, 애드센스 가입·`reyfarm.app` 등록, `NEXT_PUBLIC_ADSENSE_CLIENT` 입력, 유럽 규정 메시지 켜기

---

## 8. 적용 현황

적용할 때마다 갱신해요. ✓ 있음, △ 일부, – 없음.

| 사이트 | 저장소 | 메타·OG | robots·sitemap | JSON-LD | 서버 렌더 본문 | FAQ·about | llms.txt | privacy | 허브 링크 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 허브 reyfarm.app | rey-farm | ✓ (/, /ko/ hreflang) | ✓ | ✓ (Person·ProfilePage·서비스 목록) | ✓ (prerender.mjs) | △ (About, FAQ 없음) | ✓ | ✓ (/privacy/) | ✓ (허브 자체) |
| 노포맵 | nopomap | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | – | 확인 필요 | 확인 필요 |
| BTS | BTS | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | – | 확인 필요 | 확인 필요 |
| 이름 궁합 | nss-farm | ✓ | ✓ | 확인 필요 | 확인 필요 | 확인 필요 | – | 확인 필요 | 확인 필요 |
| 유니꿀로 | uniggul-farm | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | – | 확인 필요 | 확인 필요 |
| 이번 주 코스트코 | Costco | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | 확인 필요 | – | 확인 필요 | 확인 필요 |

권장 적용 순서: **허브**(심사 대상이자 모든 서비스의 중심) → 상세 페이지가 많은 **노포맵·코스트코**(검색 유입이 가장 클 곳) → BTS → 유니꿀로 → 이름 궁합(개인 정보 규칙 때문에 광고는 제한적).
