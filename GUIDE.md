# Site Maintenance Guide

## Travel Page Workflow

Travel 페이지는 `src/content/travel/` 안의 Markdown 파일만 수정해서 관리합니다. 기존 루트 HTML 파일과 `src/pages/*.html.ts` wrapper는 legacy URL 보존용이므로 삭제하지 않습니다.

## Placeholder 상태

아직 실제 콘텐츠가 없는 여행은 다음 형태를 유지합니다.

```md
---
id: 2022-london
type: travel
title: Christmas in London
date: 2022-12
location: "London, United Kingdom"
thumbnail: /IMG_0868.jpeg
status: placeholder
legacyUrls:
  - /london.html
---

<section class="travel-placeholder">
  <h1>Soon...</h1>
</section>
```

`status: placeholder`이거나 본문에 `travel-placeholder` 클래스가 있으면 홈 카드에 `Soon` 배지가 자동으로 표시됩니다.

## 실제 콘텐츠로 변경

Placeholder를 실제 여행 글로 바꿀 때는 같은 Markdown 파일에서 `status`와 본문만 바꾸면 됩니다.

```md
---
id: 2022-london
type: travel
title: Christmas in London
date: 2022-12
location: "London, United Kingdom"
thumbnail: /IMG_0868.jpeg
music:
musicTitle:
status: published
legacyUrls:
  - /london.html
---

<figure>
  <img src="/travel/22london/img-1.jpg" alt="Christmas in London" loading="lazy" />
  <figcaption>
    런던 첫날
  </figcaption>
</figure>
```

본문에 `<figure>`가 있으면 기존 Osaka/Tokyo/Fukuoka와 같은 실제 콘텐츠 레이아웃으로 자동 표시됩니다.

## 주의사항

- 이미지와 음악 파일은 이동, 삭제, 이름 변경하지 않습니다.
- 기존 HTML wrapper와 `src/pages/*.html.ts` 파일은 삭제하지 않습니다.
- 이미지 경로의 대소문자와 확장자를 그대로 유지합니다.
- `.DS_Store`는 커밋하지 않습니다.
- Osaka MP3 Unicode normalization artifact는 커밋하지 않습니다.

## 검증

수정 후 아래 명령을 실행합니다.

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

브라우저에서는 변경한 상세 URL, 기존 legacy URL, 홈 카드 링크를 확인합니다.
