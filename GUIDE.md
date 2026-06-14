# Site Maintenance Guide

이 사이트는 일반 운영자가 `src/content/` 안의 Markdown 파일을 수정하는 방식으로 관리합니다. 기존 root HTML 파일과 `src/pages/*.html.ts` wrapper는 legacy URL 보존용이므로 삭제하지 않습니다.

## 새 여행 추가

1. `src/content/travel/`에 새 Markdown 파일을 만듭니다.
2. `id`는 URL에 사용됩니다. 예: `2026-bali` -> `/travel/2026-bali/`
3. `status: published`로 공개하거나, 아직 준비 중이면 `status: placeholder`로 둡니다.
4. 홈에 노출하려면 `src/pages/index.astro`의 travel 순서 목록에 해당 `id`를 추가합니다.

```md
---
id: 2026-bali
type: travel
title: Bali
date: 2026-02
location: "Bali, Indonesia"
thumbnail: /what.png
music:
musicTitle:
status: published
legacyUrls: []
---

<figure>
  <img src="/travel/26bali/img-1.jpg" alt="Bali" loading="lazy" />
  <figcaption>
    발리 첫날
  </figcaption>
</figure>
```

## Placeholder를 실제 콘텐츠로 변경

현재 placeholder 파일은 다음 형태입니다.

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

실제 콘텐츠가 준비되면 같은 파일에서 `status: published`로 바꾸고, placeholder section을 `<figure>` 목록으로 교체합니다. 본문에 `<figure>`가 있으면 기존 실제 여행 콘텐츠 스타일이 자동 적용됩니다.

## Figure와 Caption

```md
<figure>
  <img src="/travel/22london/img-1.jpg" alt="Christmas in London" loading="lazy" />
  <figcaption>
    런던 첫날
  </figcaption>
</figure>

<figure>
  <img src="/travel/22london/img-2.jpg" alt="Christmas in London" loading="lazy" />
  <figcaption>
    <strong>📍 Hyde Park</strong>
    겨울 산책
  </figcaption>
</figure>
```

이미지 경로의 대소문자와 확장자는 실제 파일명과 정확히 맞춰야 합니다.

## 음악 추가/변경

Travel front matter에 `music`과 `musicTitle`을 추가합니다.

```md
music: /travel/22london/theme.mp3
musicTitle: London Theme
```

외부 URL도 사용할 수 있지만, 브라우저 정책이나 외부 서비스 제한으로 console noise가 생길 수 있습니다. 기존 음악 파일은 이동하거나 이름을 바꾸지 않습니다.

## 새 Photography 추가

1. `src/content/photography/`에 Markdown 파일을 만듭니다.
2. `id`는 `/photography/{id}/` URL에 사용됩니다.
3. `status: published`인 항목만 홈 목록에 표시됩니다.

```md
---
id: 2026-bali
type: photography
title: BALI
date: 2026
location: "Bali, Indonesia"
thumbnail: /what.png
camera: Canon EOS M50
status: published
legacyUrls: []
---

<figure>
  <img src="/photo/bali-1.JPG" alt="BALI" loading="lazy" />
</figure>
```

## 홈 카드 표시 방식

- Travel 홈 카드는 `src/pages/index.astro`의 travel 순서 목록과 legacy 카드 목록으로 구성됩니다.
- `status: placeholder`이거나 본문에 `travel-placeholder`가 있으면 `Soon` 배지가 자동 표시됩니다.
- Photography 홈 카드는 `src/content/photography/*.md`의 published 항목에서 생성됩니다.

## Legacy URL 관리

- 기존 URL은 root HTML 파일과 `src/pages/*.html.ts` wrapper로 유지합니다.
- wrapper 파일은 삭제하지 않습니다.
- `legacyUrls`에는 기존 URL을 기록해 유지보수자가 원래 주소를 확인할 수 있게 합니다.

## 배포 전 체크리스트

- `ASTRO_TELEMETRY_DISABLED=1 npm run build` 통과
- Chrome MCP desktop `1280x900` 확인
- Chrome MCP mobile `390x844` 확인
- broken image 0
- console error 없음
- horizontal overflow 없음
- legacy wrapper가 새 route로 이동
- `.DS_Store` 커밋 금지
- Osaka MP3 Unicode normalization artifact 커밋 금지
- 이미지/음악 파일 이동, 삭제, 이름 변경 금지
