# rey-farm

Rey.K(김대호)가 만든 서비스를 모아 보여 주는 한 페이지 사이트예요.

- `index.html`: 페이지 전체. 내용은 파일 안의 `COMMON`(링크·아이콘)과 `TEXT.ko` / `TEXT.en`(문구)에서 고쳐요.
- `assets/`: 서비스 아이콘(SVG, 256×256). `seedling.svg`는 새싹 로고 원본(Google Noto Emoji).
- `privacy/index.html`: 개인정보처리방침 · 상표·저작권 고지.
- `robots.txt`: 검색엔진·AI 크롤러 허용.

**`index.html`을 고친 뒤에는 꼭 `node scripts/prerender.mjs`를 실행해요.** 검색엔진과 AI 크롤러가 읽을 수 있도록 본문을 HTML에 미리 그려 넣고, 아래 파일을 다시 만들어요(직접 고치지 않기).

- `ko/index.html`: 한국어 페이지(`/ko/`)
- `index.html`의 `<head>` 검색 태그(seo:start ~ seo:end)와 본문
- `sitemap.xml`, `llms.txt`, `og.png`(공유 미리보기)

그 밖엔 빌드 과정 없이 Vercel에 그대로 올리면 돼요.

새 서비스를 만들 때는 [docs/NEW_SERVICE.md](docs/NEW_SERVICE.md)를 따라요. 저장소 이름, 스택, Vercel·서브도메인 연결, 방문 분석, 이 허브에 카드 추가하는 순서가 정리돼 있어요.

검색(구글·네이버), AI 답변, 구글 애드센스 기준은 [docs/SEO_GEO_ADSENSE.md](docs/SEO_GEO_ADSENSE.md)에 있어요.
