# Hayeon.jpg

Astro 기반 정적 여행/사진 사이트입니다. 기존 HTML URL은 wrapper로 유지하고, 새 콘텐츠는 `src/content` 안의 Markdown 파일로 관리합니다.

## Content Status

Travel 콘텐츠는 `src/content/travel/*.md`에서 관리합니다.

- `status: published`: 실제 여행 콘텐츠입니다. 본문에 `<figure>` 목록을 작성하면 기존 Osaka/Tokyo/Fukuoka 스타일로 표시됩니다.
- `status: placeholder`: 아직 상세 콘텐츠가 없는 여행입니다. 본문에 `<section class="travel-placeholder">`가 있으면 상세 페이지와 홈 카드가 `Soon` 상태로 표시됩니다.
- `status: draft`: 빌드된 목록과 상세 route에서 제외됩니다.

Placeholder를 실제 콘텐츠로 바꿀 때는 해당 Markdown 파일만 수정하면 됩니다. 기존 wrapper HTML, 이미지, 음악 파일은 삭제하거나 옮기지 마세요.

자세한 운영 방법은 `GUIDE.md`를 참고하세요.
