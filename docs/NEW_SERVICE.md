# 새 서비스 기본 구축 가이드

Rey.K(김대호)의 새 서비스를 시작할 때 따르는 기본 순서예요. 지금까지 만든 네 서비스(노포맵, BTS, 이름 궁합, 유니꿀로)에서 공통으로 쓴 방식을 모았어요.

**Claude에게:** 새 서비스를 만들 때 이 문서를 처음부터 끝까지 읽고 순서대로 진행하세요. 검색·AI 답변·광고 기준은 [SEO_GEO_ADSENSE.md](SEO_GEO_ADSENSE.md)에 따로 있어요. 같이 따르세요. 사용자에게 "다른 서비스는 어떻게 했어요?"라고 묻지 않아도 되도록 쓴 문서예요. 여기 없는 결정이 필요하면 사용자에게 물어보고, 정해진 내용은 이 문서에 다시 반영하는 PR을 제안하세요.

---

## 0. 한눈에 보기

| 항목 | 기본값 |
| --- | --- |
| 저장소 | `daehooooo-boop/<이름>-farm` (public) |
| 스택 | Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind CSS v4 |
| 배포 | Vercel Hobby, GitHub 연결로 자동 배포, 함수 리전 `icn1`(서울) |
| 주소 | `https://<이름>.reyfarm.app` (기본 주소 `<이름>-farm.vercel.app`도 유지) |
| 방문 분석 | Vercel Web Analytics (`@vercel/analytics/next`의 `<Analytics />`) |
| 검색·AI·광고 | [SEO_GEO_ADSENSE.md](SEO_GEO_ADSENSE.md) (메타·OG·sitemap·JSON-LD·llms.txt·/about·/privacy) |
| 폰트 | Pretendard (`pretendard` 패키지) |
| 아이콘 | `src/app/icon.svg` + `src/app/apple-icon.png`(180×180) |
| 테스트 | 순수 로직이 있으면 `vitest` |
| 비밀값 | `.env.local`, Vercel 환경 변수에만. `.env.example`엔 이름과 발급처만 |
| 작업 방식 | 브랜치 → PR(base `main`) → 사용자가 머지 → Vercel 자동 배포 |
| 허브 | 출시하면 reyfarm.app(이 저장소)에 카드 추가 |

현재 서비스 목록(참고용 실제 사례):

| 서비스 | 저장소 | 주소 | 특징 |
| --- | --- | --- | --- |
| 노포맵 | `daehooooo-boop/nopomap` | nopomap.reyfarm.app | 카카오맵, 정적 JSON 데이터. Next 15 (가장 오래된 구성) |
| BTS · 버스 타는 사람들 | `daehooooo-boop/BTS` | bts.reyfarm.app | 공공 API 서버 프록시, `docs/` 문서 체계가 가장 잘 갖춰짐 |
| 이름 궁합 | `daehooooo-boop/nss-farm` | nss.reyfarm.app | 한/영 두 언어, SEO(robots·sitemap·OG 이미지), vitest |
| 유니꿀로 | `daehooooo-boop/uniggul-farm` | uniggul.reyfarm.app | Neon Postgres, 디스코드·텔레그램 봇, Vercel Cron + GitHub Actions |

새 서비스는 **이름 궁합·유니꿀로 구성을 기준**으로 삼으세요(가장 최근이고 `src/` 구조가 같아요).

---

## 1. 이름 정하기

먼저 사용자와 세 가지를 정해요.

1. **서비스 이름** (한국어, 영어). 예: 유니꿀로 / Uniggul
2. **짧은 영문 id**: 소문자, 하이픈 없이 짧게. 서브도메인과 허브 카드 id로 씀. 예: `nopomap`, `bts`, `nss`, `uniggul`
3. **저장소 이름**: `<id>-farm`. 예: `nss-farm`, `uniggul-farm`. Vercel 기본 주소도 `<id>-farm.vercel.app`이 돼요.

> 노포맵(`nopomap`)과 BTS(`BTS`)는 이 규칙 전에 만들어져 이름이 달라요. 새 서비스는 `-farm` 규칙을 따르세요.

---

## 2. 저장소 만들기

- 저장소는 **사용자가 GitHub에서 직접 만들어요**(Claude 세션은 새 저장소를 만들 수 없음). Public, README 없이 빈 저장소로 만들어 달라고 요청하세요.
- 만들어지면 사용자에게 Claude 프로젝트 설정 > Repositories에 그 저장소를 추가해 달라고 하세요.
- 첫 커밋은 Next.js 뼈대 PR로 올려요(main에 직접 push하지 않기).

### 뼈대 만들기

```bash
npx create-next-app@latest <id>-farm --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd <id>-farm
npm i @vercel/analytics pretendard
npm i -D vitest          # 순수 로직(계산, 파싱 등)이 있을 때
```

`package.json` scripts는 이렇게 맞춰요.

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
}
```

`next.config.ts` (최근 서비스들과 같은 설정):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
```

`vercel.json` (서버 함수가 한국 API를 부르므로 서울 리전):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["icn1"]
}
```

예약 작업이 필요하면 `crons`를 여기에 추가해요. Vercel Hobby의 Cron은 **하루 1번까지**라서, 더 자주 돌려야 하면 유니꿀로처럼 GitHub Actions(`.github/workflows/*.yml`)에서 `CRON_SECRET`을 붙여 API를 부르세요.

### 꼭 들어갈 파일

| 파일 | 내용 |
| --- | --- |
| `README.md` | 한 줄 소개, 실행 방법, 구조 표(경로 · 내용), 배포 순서. 사람용 |
| `CLAUDE.md` | 첫 줄 `@AGENTS.md` + 서비스 원칙·코드 규칙·작업 방식. 에이전트용 (아래 틀 참고) |
| `AGENTS.md` | `next dev`가 자동으로 만드는 Next.js 안내. 생기면 그대로 커밋 |
| `.env.example` | 필요한 환경 변수 이름 + 어디서 발급받는지 주석. 값은 비움 |
| `.gitignore` | create-next-app 기본값 + `!.env.example` 한 줄 추가 (`.env*`가 예시 파일까지 막지 않게) |
| `docs/` | 기획서 등 기준 문서 (아래 6장) |

---

## 3. 공통 코드

### 레이아웃 (`src/app/layout.tsx`)

```tsx
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "<서비스 이름> · <한 줄 설명>",
  description: "<두 문장 이내 설명>",
  openGraph: {
    title: "<서비스 이름>",
    description: "<짧은 설명>",
    locale: "ko_KR",
    type: "website",
  },
};

// 검색용 전체 메타데이터(metadataBase, canonical, 네이버 확인 태그 등)는 SEO_GEO_ADSENSE.md 1장 기준으로 채워요.

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 방문 분석

- 모든 서비스는 **Vercel Web Analytics**로 통일해요. 쿠키가 없고 Hobby 무료예요.
- 위처럼 루트 레이아웃의 `<body>` 끝에 `<Analytics />`만 넣으면 돼요.
- URL에 개인 정보가 실릴 수 있는 서비스는 이름 궁합처럼 쿼리·해시를 지우고 보내요.

```tsx
"use client";
import { Analytics } from "@vercel/analytics/next";

export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        return { ...event, url: `${url.origin}${url.pathname}` };
      }}
    />
  );
}
```

- 코드만으로는 집계가 시작되지 않아요. 배포 후 **사용자가 Vercel 대시보드 → 프로젝트 → Analytics 탭 → Enable**을 눌러야 해요. 출시 체크리스트에 꼭 넣으세요.

### 아이콘

- `src/app/icon.svg`: 파비콘 겸 허브 카드 아이콘 원본
- `src/app/apple-icon.png`: 180×180 PNG (iOS 홈 화면)
- 홈 화면 추가가 중요한 서비스면 BTS처럼 `src/app/manifest.ts` + `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`

### 색과 테마

- 색은 `src/app/globals.css`의 CSS 변수와 Tailwind v4 `@theme` 토큰으로만 써요. 컴포넌트에 색 값을 직접 쓰지 않아요.
- 라이트/다크가 필요하면 `prefers-color-scheme` 또는 `data-theme` + `localStorage`(키 이름은 `<id>-theme`) 방식.

### 사이트 정보 한곳에 모으기

이름, 설명, 주소는 `src/lib/site.ts` 하나에 모아요(이름 궁합 방식). 주소는 환경 변수로 바꿀 수 있게 해 두면 서브도메인으로 옮길 때 편해요.

```ts
export const SITE = {
  name: "<서비스 이름>",
  description: "<설명>",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://<id>.reyfarm.app",
  creator: { name: "Rey.K", url: "https://reyfarm.app" },
} as const;
```

푸터 등에 만든 사람 크레딧을 넣는다면 링크는 `https://reyfarm.app`으로 해요.

---

## 4. 비밀값과 외부 키

- 키·토큰은 **커밋, 문서, 메모, PR 본문에 절대 쓰지 않아요.** `.env.local`(로컬)과 Vercel 환경 변수에만.
- 브라우저에 노출되면 안 되는 키는 서버(Route Handler, `src/lib/*` 서버 전용 모듈)에서만 써요. 이름에 `NEXT_PUBLIC_`을 붙이지 않아요.
- 도메인 제한이 있는 공개 키(카카오맵 JavaScript 키 등)만 `NEXT_PUBLIC_`으로 써요. 이런 키는 **허용 도메인에 `http://localhost:3000`, `https://<id>-farm.vercel.app`, `https://<id>.reyfarm.app` 셋 다** 등록해야 해요.
- 자주 쓰는 키 발급처: 카카오맵(developers.kakao.com), 공공데이터(data.go.kr, Decoding 키), DB(Vercel → Storage → Neon 연결 시 `DATABASE_URL` 자동 등록).
- 외부 API를 쓰는 서비스는 붙이기 전에 실제 호출로 확인하고, 알게 된 함정을 `docs/`에 적어요(BTS `docs/data-api.md` 참고).
- Claude 클라우드 세션에서 외부 API를 실제로 불러야 하면 프로젝트 설정 > Cloud environment에서 허용 도메인과 환경 변수를 따로 설정해야 해요(BTS `docs/setup.md` 3장).

---

## 5. Vercel 배포와 도메인

순서대로 사용자에게 안내해요(Vercel 설정은 사용자가 직접 해요).

1. Vercel → **Add New → Project → GitHub에서 `<id>-farm` Import**. 프로젝트 이름은 `<id>-farm`.
2. **Settings → Environment Variables**에 `.env.example`의 값들 입력 (Production, Preview 모두).
3. 배포 확인: `https://<id>-farm.vercel.app`
4. **Settings → Domains → Add**에 `<id>.reyfarm.app` 입력. `reyfarm.app`은 Vercel에서 산 도메인이라 DNS가 자동으로 잡혀요.
5. **Analytics 탭 → Enable**.
6. 도메인 제한 키(카카오 등)에 새 주소 추가.
7. 코드의 `SITE.url`, OG 주소 등이 `https://<id>.reyfarm.app`을 가리키는지 확인.

이후로는 main에 머지될 때마다 자동 배포되고, PR마다 미리보기 주소가 생겨요.

> Vercel Hobby는 비상업 조건이에요. 광고, 후원, 유료 기능이 붙으면 Pro로 옮겨야 해요. 애드센스 준비는 [SEO_GEO_ADSENSE.md](SEO_GEO_ADSENSE.md) 6장.

8. 네이버 서치어드바이저에 `https://<id>.reyfarm.app` 등록, 확인값을 `NEXT_PUBLIC_NAVER_VERIFICATION`에 넣기. 사이트맵을 Search Console(도메인 속성 `reyfarm.app`, 한 번만 만들면 됨)과 네이버에 제출 ([SEO_GEO_ADSENSE.md](SEO_GEO_ADSENSE.md) 5장).

---

## 6. 문서 (`docs/`)

서비스마다 기준 문서를 먼저 두고, 코드와 함께 갱신해요. 크기에 맞게 고르세요.

| 문서 | 언제 | 참고 |
| --- | --- | --- |
| `docs/기획서.md` 또는 `PRD.md` | 항상 | 한 줄 정의 → 결정 표(D#) → 구조 → 리스크 → 포지셔닝 → 디자인 원칙 → 열린 질문 → 일정 (BTS) |
| `docs/decisions.md` | 결정이 쌓이면 | 날짜 · 결정 · 이유 표, 진행 이력 (BTS) |
| `docs/design.md` / `DESIGN_GUIDE.md` | 화면 원칙이 정해지면 | (BTS, 이름 궁합) |
| `docs/setup.md` | 키·외부 서비스가 있으면 | 키 발급처, Vercel 설정, 공개 전 체크 (BTS) |

### `CLAUDE.md` 틀

```md
@AGENTS.md

# <서비스 이름> — 개발 규칙

<한 줄 정의>

## 먼저 읽을 것
1. docs/기획서.md — 기준 문서
2. docs/decisions.md — 무엇을 왜 정했는지

## 원칙
- 덜어내기 우선. 기능을 더하기 전에 뺄 수 있는 것을 먼저 검토
- <이 서비스의 성능·경험 기준, 예: 접속 후 3초 안에 핵심 정보>
- 사용자는 20년+ UI/UX·BX 디자인 리더. 디자인 기초 설명은 빼고 실무 수준으로, 간결하게

## 코드 규칙
- Next.js 16. API가 학습 데이터와 다를 수 있으니 node_modules/next/dist/docs/ 확인
- 색은 globals.css 토큰만
- 주석·UI 문구는 한국어. 주석은 "왜"만 짧게
- 비밀값은 커밋·문서·메모에 쓰지 않는다

## 명령어
npm run dev / npm run lint / npm test / npm run build
작업을 마치기 전에 lint, test, build가 모두 통과해야 한다.

## 작업 방식
- 브랜치 → PR(base main) → 사용자가 머지 → Vercel 자동 배포. main에 직접 push 금지
- 다른 기능 브랜치를 base로 잡지 않는다(머지돼도 main에 안 들어감)
- 디테일은 배포된 실제 화면을 폰으로 보며 조정
```

---

## 7. 허브(reyfarm.app)에 카드 추가

출시하면(또는 "만드는 중"으로 먼저 보여 주고 싶으면) 이 저장소에 카드를 추가해요.

1. 아이콘: 서비스의 `src/app/icon.svg`를 256×256 SVG로 맞춰 `assets/<id>-icon.svg`에 넣기
2. `index.html`의 `COMMON.services` 배열에 한 줄 추가 (`ing` 카드보다 앞에)
   ```js
   { id: "<id>", url: "https://<id>.reyfarm.app", icon: "assets/<id>-icon.svg" },
   ```
3. 같은 파일의 `TEXT.ko.services`와 `TEXT.en.services`에 이름과 설명 추가 (설명은 두 문장, "~해 줘요" 말투)
   ```js
   <id>: { name: "<한국어 이름>", desc: "<설명>" },
   ```
4. 소개 문단(`TEXT.ko.intro`, `TEXT.en.intro`)에 서비스를 언급하고 싶으면 `{<id>:이름}` 형식으로 링크
5. `COMMON.updated`를 오늘 날짜로 바꾸기
6. 이 문서 0장의 "현재 서비스 목록" 표에도 한 줄 추가. 허브의 `llms.txt`·JSON-LD 서비스 목록이 생긴 뒤라면 거기에도 한 줄 추가([SEO_GEO_ADSENSE.md](SEO_GEO_ADSENSE.md) 4장)
7. 브랜치 → PR → 사용자 머지

> 기존 카드 id 중 `nopo`, `name`은 서브도메인(`nopomap`, `nss`)과 달라요. 새 서비스는 카드 id를 서브도메인 id와 똑같이 맞춰요.

주의할 점:

- 이 저장소의 `index.html`은 빌드 없이 그대로 배포돼요. `<head>`의 파비콘 링크와 `/_vercel/insights/script.js` 스크립트를 지우지 마세요.
- Claude 프로젝트에서 작업할 땐 원본이 `/mnt/project-files/hub-site/index.html`(미리보기 Artifact 원본)이고, 배포본은 `/mnt/project-files/hub-site/deploy/`예요. 원본을 고쳤으면 deploy를 다시 만들고 이 저장소에 반영해요. 세 곳이 어긋나지 않게 해요.
- 카드는 2열이고, 홀수 개면 마지막 카드가 전체 폭이 돼요.

---

## 8. 출시 체크리스트

새 서비스 PR을 마무리할 때 이 목록을 PR 본문이나 사용자에게 보내는 메시지에 붙여요.

**Claude가 하는 일**

- [ ] `npm run lint`, `npm test`, `npm run build` 통과
- [ ] `<Analytics />` 들어감 (개인 정보가 URL에 실리면 쿼리·해시 제거)
- [ ] `icon.svg`, `apple-icon.png`, 제목·설명·OG 메타데이터
- [ ] [SEO_GEO_ADSENSE.md](SEO_GEO_ADSENSE.md) 7장 체크리스트 (robots·sitemap·JSON-LD·llms.txt·/about·/privacy·허브 링크)
- [ ] `.env.example`, `README.md`, `CLAUDE.md` 작성
- [ ] `vercel.json` 리전 `icn1`
- [ ] 허브 카드 PR (7장)

**사용자가 하는 일**

- [ ] GitHub 저장소 만들기, Claude 프로젝트에 저장소 추가
- [ ] Vercel Import, 환경 변수 입력
- [ ] 도메인 `<id>.reyfarm.app` 추가
- [ ] 네이버 서치어드바이저 등록, Search Console·네이버에 사이트맵 제출
- [ ] Analytics Enable
- [ ] 외부 키 허용 도메인에 새 주소 추가
- [ ] PR 머지 후 폰으로 실제 화면 확인

---

## 9. 이 문서 고치기

새 서비스를 만들면서 이 문서와 다르게 한 게 있으면, 그 이유와 함께 이 문서를 고치는 PR을 같이 올려요. 이 문서가 늘 "지금 기본값"이어야 다음 서비스에서 다시 설명하지 않아도 돼요.
