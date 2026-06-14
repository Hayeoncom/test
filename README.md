# Hayeon.jpg

Astro 기반 정적 여행/사진 사이트입니다. 기존 정적 HTML 중심 구조를 유지보수하기 쉬운 Markdown content collection 구조로 옮겼고, 기존 GitHub Pages URL은 wrapper로 보존합니다.

## Structure

- Travel content: `src/content/travel/*.md`
- Photography content: `src/content/photography/*.md`
- Travel route: `/travel/{id}/`
- Photography route: `/photography/{id}/`
- Legacy wrappers: root HTML URLs and `src/pages/*.html.ts`

## Content Status

- `status: published`: 실제 공개 콘텐츠입니다. Travel 본문에 `<figure>`가 있으면 기존 Osaka/Tokyo/Fukuoka 스타일로 표시됩니다.
- `status: placeholder`: 아직 상세 콘텐츠가 없는 공개 예정 콘텐츠입니다. 본문에 `<section class="travel-placeholder">`가 있으면 상세 페이지와 홈 카드가 `Soon` 상태로 표시됩니다.
- `status: draft`: 빌드된 목록과 상세 route에서 제외됩니다.

Placeholder를 실제 콘텐츠로 바꿀 때는 해당 Markdown 파일만 수정합니다. `status`를 `published`로 바꾸고, 본문을 `<figure>` 목록으로 교체하면 자동으로 실제 여행 페이지 레이아웃이 적용됩니다.

## Local Commands

```sh
npm install
ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --host 127.0.0.1
ASTRO_TELEMETRY_DISABLED=1 npm run build
ASTRO_TELEMETRY_DISABLED=1 npm run preview -- --host 127.0.0.1
```

## Verification Standard

Chrome MCP로 desktop `1280x900`과 mobile `390x844`를 확인합니다.

- console error 없음
- broken image 0
- horizontal overflow false
- mobile `innerWidth` 390
- legacy wrapper가 의도한 새 route로 이동
- placeholder 홈 카드에 `Soon` 배지 표시

## Do Not Change

- 기존 이미지 파일 이동/삭제/이름 변경 금지
- 기존 음악 파일 이동/삭제/이름 변경 금지
- 기존 wrapper와 legacy URL 삭제 금지
- `.DS_Store` 커밋 금지
- Osaka MP3 Unicode normalization artifact 커밋 금지

운영 방법은 `GUIDE.md`, 검증 이력은 `TEST-RESULT.md`를 참고하세요.
