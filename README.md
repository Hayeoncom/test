# Hayeon 운영 매뉴얼

## 1. 프로젝트 개요

이 저장소는 정적 여행 사진 사이트 `https://hayeon.kr/`의 운영 파일을 관리한다.

- 운영 브랜치: `main`
- 사용자 사이트 배포: GitHub Actions Pages
- CMS 관리자 화면: Netlify admin 전용 사이트
- CMS: Decap CMS
- 콘텐츠 데이터: `content/site.json`, `content/pages/*.json`, `content/generated-pages/*.json`
- 사용자 사이트 산출물: GitHub Actions build 중 생성되는 `.pages-dist`

현재 운영 기준은 `main`이다. 과거 테스트 브랜치였던 `refactor/ver1`은 현재 운영 절차의 기준으로 사용하지 않는다.

## 2. 운영 URL

| 구분 | URL | 정상 기준 |
| --- | --- | --- |
| 사용자 사이트 | `https://hayeon.kr/` | 200 |
| 사용자 사이트 index | `https://hayeon.kr/index.html` | 200 |
| CMS 관리자 | `https://hayeon-cms-auth.netlify.app/admin/` | 200 |
| 사용자 사이트 admin 안내 페이지 | `https://hayeon.kr/admin/` | 200, Netlify 관리자 URL 안내 또는 이동 |
| 사용자 사이트 admin config | `https://hayeon.kr/admin/config.yml` | 404 |
| Netlify admin config | `https://hayeon-cms-auth.netlify.app/admin/config.yml` | 200 |

`hayeon.kr` 또는 `www.hayeon.kr`을 Netlify custom domain으로 연결하지 않는다. 사용자 사이트는 GitHub Pages가 담당하고, Netlify는 CMS 관리자 화면만 제공한다.

## 3. 전체 운영 구조

```text
CMS 저장 또는 main 변경
↓
GitHub PR 생성 또는 main merge
↓
GitHub Actions Pages workflow 실행
↓
content JSON 검증
↓
generated pages HTML 생성
↓
표시용 이미지 최적화 / 캐시 재사용
↓
.pages-dist artifact 생성
↓
GitHub Pages 배포
↓
hayeon.kr 반영
```

역할 구분:

- `hayeon.kr`: 사용자용 정적 사이트
- `hayeon-cms-auth.netlify.app/admin/`: Decap CMS 관리자 화면
- `hayeon.kr/admin/`: 실제 CMS 화면이 아닌 안내 또는 이동 페이지
- `hayeon.kr/admin/config.yml`: 사용자 사이트에서 노출되면 안 되므로 404가 정상
- `hayeon-cms-auth.netlify.app/admin/config.yml`: CMS 관리자 설정 파일이며 200이 정상

## 4. CMS 관리자 접속

1. `https://hayeon-cms-auth.netlify.app/admin/`에 접속한다.
2. `Login with GitHub`을 선택한다.
3. 권한이 있는 GitHub 계정으로 로그인한다.
4. Decap CMS 화면에서 `사이트 기본 설정`, `페이지 관리`, `신규 여행 페이지` collection을 사용한다.

주의사항:

- CMS 접속 URL은 `https://hayeon-cms-auth.netlify.app/admin/`이다.
- `https://hayeon.kr/admin/`은 CMS 사용 URL이 아니다.
- OAuth secret, token, client secret, password, 2FA 값은 저장소 파일이나 문서에 기록하지 않는다.
- CMS 저장 권한은 `Hayeoncom/test` 저장소 권한에 의존한다.

## 5. CMS 로그인 / 수정 / 저장 / 배포 흐름

```text
CMS 로그인
↓
페이지 선택
↓
내용 수정
↓
Save
↓
Publish 또는 PR 생성
↓
main merge
↓
GitHub Actions Pages 배포
↓
hayeon.kr 반영
```

운영 기준 배포 시간:

- content-only 변경 기준 대략 2~3분
- GitHub Actions 상태, GitHub Pages 상태, GitHub cache 상태에 따라 지연될 수 있음
- 이미지 캐시가 비어 있거나 이미지 최적화 정책이 바뀐 경우 더 오래 걸릴 수 있음

저장 후 확인 순서:

1. CMS 저장 또는 publish/merge가 실제로 발생했는지 확인한다.
2. GitHub PR 또는 commit의 base branch가 `main`인지 확인한다.
3. 변경 파일이 의도한 `content/*.json` 또는 `assets/images/uploads/*`인지 확인한다.
4. GitHub Actions `Deploy Pages` workflow가 성공했는지 확인한다.
5. 운영 JSON URL에서 변경 값이 보이는지 확인한다.
6. 운영 HTML에서 렌더링과 링크 동작을 확인한다.

## 6. 기존 페이지 관리

기존 페이지 예시:

- `tokyo.html`
- `fukuoka.html`
- `osaka.html`
- `tokyo2.html`
- `tokyo3.html`
- `fukuoka2.html`
- `fukuoka3.html`
- `osaka2.html`

기존 페이지는 CMS의 `페이지 관리` collection에서 수정한다. 기존 19개 HTML 파일명과 URL 구조는 바꾸지 않는다.

### 6-1. 텍스트 수정

1. CMS에서 `페이지 관리` collection을 연다.
2. 수정할 페이지를 선택한다.
3. 제목, 설명, 섹션 제목, caption, location, date, camera 등 필요한 필드만 수정한다.
4. Save 후 publish 또는 PR merge를 진행한다.
5. GitHub Actions Pages 배포 후 운영 페이지에서 반영 여부를 확인한다.

### 6-2. 이미지 추가

상세/갤러리 이미지 추가 시 `image`와 `originalUrl`을 분리해서 입력한다.

```text
image:
assets/images/uploads/example.jpeg

originalUrl:
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/uploads/example.jpeg
```

의미:

- `image`: 사이트에 표시되는 최적화 이미지 경로
- `originalUrl`: 이미지를 클릭했을 때 새 창으로 열 원본 이미지 URL

운영 기준:

- 표시용 이미지는 `assets/images/...` 경로를 사용한다.
- CMS 업로드 경로는 `assets/images/uploads`다.
- 상세/갤러리 이미지는 `originalUrl`을 GitHub raw main URL로 입력한다.
- 홈 카드 이미지는 페이지 이동 링크를 유지하며 raw originalUrl 링크를 적용하지 않는다.

### 6-3. 이미지 삭제

CMS에서 이미지 항목을 삭제하면 화면에서는 사라진다. 하지만 실제 이미지 파일이 Git 저장소에서 자동 삭제되는 것은 아니다.

주의사항:

- 이미지 항목 삭제는 JSON 데이터에서 참조를 제거하는 작업이다.
- `assets/images/**` 또는 `assets/images/uploads/**`의 실제 파일 삭제는 별도 작업으로 수행한다.
- 미사용 이미지 파일 정리는 별도 PR 또는 관리자 검토 후 진행한다.
- 원본 이미지 파일을 임의로 삭제하거나 덮어쓰지 않는다.

### 6-4. originalUrl 입력

상세/갤러리 이미지의 `originalUrl` 표준 형식:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<이미지경로>
```

예시:

```text
image:
assets/images/tokyo/img1.jpeg

originalUrl:
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img1.jpeg
```

`originalUrl`이 있으면 이미지 클릭 시 원본 이미지가 새 창으로 열린다. 페이지 번호 링크는 새 창이 아니라 현재 창에서 이동해야 한다.

## 7. 신규 페이지 생성

054 이후 신규 여행 페이지는 CMS의 `신규 여행 페이지` collection에서 생성한다.

```text
CMS generated_pages collection
↓
content/generated-pages/<slug>.json
↓
GitHub Actions Pages build
↓
.pages-dist/<slug>.html
↓
https://hayeon.kr/<slug>.html
```

예시:

```text
slug: nagoya
생성 URL: https://hayeon.kr/nagoya.html
```

기존 페이지에 사진만 추가하는 경우에는 `페이지 관리` collection을 사용한다. 새 URL을 만들 때만 `신규 여행 페이지` collection을 사용한다.

### 7-1. generated_pages 구조

- CMS 저장 위치: `content/generated-pages/<slug>.json`
- build 산출물: `.pages-dist/<slug>.html`
- 운영 URL: `https://hayeon.kr/<slug>.html`
- 생성된 HTML은 저장소 루트에 커밋하지 않는다.

### 7-2. slug 규칙

- 영문 소문자, 숫자, 하이픈만 사용한다.
- 예: `nagoya`, `seoul-2026`
- `sourceHtml`은 반드시 `<slug>.html` 형식이다.
- 기존 19개 HTML 파일명과 충돌하면 배포 검증에서 실패한다.

### 7-3. visible 정책

`visible`은 신규 페이지 생성 여부를 제어한다.

- `visible: true`: `<slug>.html` 생성 대상
- `visible: false`: 정적 HTML 생성 제외 및 홈 노출 제외

신규 페이지를 보류하거나 숨길 때는 물리 삭제보다 `visible: false`를 우선 사용한다.

### 7-4. showOnHome 정책

신규 페이지를 만들었다고 홈에 자동 노출되지 않는다. `showOnHome: true`일 때만 홈 카드에 노출된다.

- `showOnHome: true`: 홈 중간 2열 카드 영역에 노출
- `showOnHome: false`: 상세 페이지 URL은 생성되지만 홈에는 미노출

홈 카드 이미지는 페이지 이동 링크이며 raw originalUrl 새 창 링크를 사용하지 않는다.

### 7-5. homeTitle / homeSubtitle / homeImage / homeOrder

홈 노출을 켤 때 사용하는 필드:

- `homeTitle`: 홈 카드 제목
- `homeSubtitle`: 홈 카드 보조 텍스트
- `homeImage`: 홈 카드 이미지
- `homeOrder`: 홈 카드 정렬 순서

`showOnHome: true`일 때 `homeTitle`과 `homeImage`가 필요하다. `homeOrder`는 낮은 숫자가 먼저 표시되는 기준으로 사용한다.

## 8. 이미지 운영 정책

### 8-1. 표시용 최적화 이미지

페이지에 표시되는 이미지는 GitHub Pages artifact의 최적화 이미지다.

```text
https://hayeon.kr/assets/images/tokyo/img1.jpeg
```

현재 표시용 이미지 최적화 정책:

- max dimension: 1400px
- JPEG quality: 78
- 원본 `assets/images/**` 파일은 수정하지 않음
- `.pages-dist` 안의 배포용 복사본만 최적화
- 이미지 최적화 캐시를 사용해 content-only 변경 시 기존 최적화 결과를 재사용

### 8-2. 원본 raw 이미지

이미지를 클릭하면 GitHub raw main 브랜치의 원본 이미지가 새 창으로 열린다.

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img1.jpeg
```

원본 raw URL은 상세/갤러리 이미지의 `originalUrl`에 입력한다.

### 8-3. image와 originalUrl 예시

```text
image:
assets/images/tokyo/img1.jpeg

originalUrl:
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img1.jpeg
```

차이:

- `image`: 사용자 페이지에 표시되는 최적화 이미지 경로
- `originalUrl`: 클릭 시 새 창으로 열 원본 이미지 URL

### 8-4. 이미지 삭제 시 주의점

- CMS에서 이미지 항목을 삭제해도 실제 이미지 파일은 자동 삭제되지 않는다.
- JSON 참조 삭제와 파일 삭제는 별도 작업이다.
- 미사용 파일 정리는 별도 작업으로 파일 참조 여부를 확인한 뒤 수행한다.
- 원본 파일의 저작권 또는 사용 권한을 단정하지 않는다.

## 9. GitHub Actions Pages 배포 흐름

```text
main push 또는 PR merge
↓
GitHub Actions Deploy Pages workflow 실행
↓
Validate CMS content
↓
Validate source references
↓
generated pages HTML 생성
↓
표시용 이미지 최적화 / 캐시 재사용
↓
.pages-dist artifact 생성
↓
GitHub Pages artifact 업로드
↓
GitHub Pages 배포
↓
hayeon.kr 반영
```

현재 배포 최적화 상태:

- 이미지 최적화 캐시 사용
- content-only 변경 시 기존 이미지 cache hit
- 일반 CMS 수정 배포는 약 2~3분 수준
- docs/reports/prompt/specs/README 변경은 Pages workflow skip 대상
- 연속 push 시 이전 Pages workflow cancel 가능

운영 기준:

- `.pages-dist`는 배포 산출물이며 커밋 대상이 아니다.
- `content/generated-pages/*.json`의 신규 페이지 HTML도 `.pages-dist`에만 생성한다.
- 원본 `assets/images/**` 파일은 유지한다.
- Pages artifact는 1GB 미만이어야 한다.
- `docs/`, `scripts/`, `reports/`, `prompt/`, `assets/images/unused/`, zip 파일, `netlify.toml`은 사용자 사이트 Pages artifact에서 제외한다.
- `admin/config.yml`은 사용자 사이트 Pages artifact에서 제외되어 `https://hayeon.kr/admin/config.yml`이 404가 되는 구조를 유지한다.

## 10. Netlify admin 운영 정책

Netlify는 사용자 사이트 배포용이 아니다. Netlify는 CMS 관리자 화면만 제공한다.

CMS 관리자 URL:

```text
https://hayeon-cms-auth.netlify.app/admin/
```

Netlify admin artifact는 `.netlify-admin`이며 관리자 정적 파일만 포함한다.

```text
.netlify-admin/
  _redirects
  favicon.ico
  admin/
    index.html
    config.yml
```

평상시 Build status는 Stopped builds로 유지한다.

CMS content-only 저장 시 기대 흐름:

```text
GitHub Pages는 배포됨
Netlify production deploy는 생성되지 않아야 함
Netlify credit은 추가 차감되지 않아야 함
```

관리자 UI 또는 admin config 변경 시 절차:

1. Netlify Build status를 Active builds로 전환한다.
2. `main` 최신 커밋 기준 deploy를 실행한다.
3. `https://hayeon-cms-auth.netlify.app/admin/`을 확인한다.
4. `https://hayeon-cms-auth.netlify.app/admin/config.yml`을 확인한다.
5. 검증 후 Build status를 Stopped builds로 되돌린다.

Netlify credit 사용량은 사용자 계정의 Dashboard에서 수동 확인한다.

## 11. 자주 하는 작업

### 기존 페이지 텍스트만 수정

1. CMS `페이지 관리`에서 대상 페이지를 연다.
2. 텍스트 필드만 수정한다.
3. Save 후 publish 또는 PR merge를 진행한다.
4. GitHub Actions Pages 성공 후 운영 페이지를 확인한다.

### 기존 페이지 이미지 추가

1. CMS `페이지 관리`에서 대상 페이지를 연다.
2. 갤러리 사진 항목을 추가한다.
3. `image`에 `assets/images/uploads/...` 경로를 입력한다.
4. `originalUrl`에 GitHub raw main URL을 입력한다.
5. Save 후 publish 또는 PR merge를 진행한다.
6. 운영 페이지에서 표시용 이미지와 클릭 시 원본 새 창 열림을 확인한다.

### 기존 페이지 이미지 삭제

1. CMS에서 갤러리 사진 항목을 삭제한다.
2. Save 후 publish 또는 PR merge를 진행한다.
3. 운영 페이지에서 해당 사진이 사라졌는지 확인한다.
4. 실제 이미지 파일 정리는 별도 작업으로 처리한다.

### 신규 페이지 생성

1. CMS `신규 여행 페이지` collection에서 새 항목을 만든다.
2. `slug`, `sourceHtml`, `title`, `visible`, `gallery`를 입력한다.
3. 홈 노출이 필요하면 `showOnHome`, `homeTitle`, `homeImage`, `homeOrder`를 입력한다.
4. Save 후 publish 또는 PR merge를 진행한다.
5. GitHub Actions Pages 성공 후 `https://hayeon.kr/<slug>.html`을 확인한다.

### 신규 페이지 비노출 또는 삭제

- 권장 방식은 `visible: false` 비노출 처리다.
- 물리 삭제는 별도 PR 또는 관리자 검토 후 처리한다.
- 홈 카드에 노출 중이면 `showOnHome: false`도 함께 확인한다.

## 12. 운영 확인 URL

배포 후 확인할 URL:

- `https://hayeon.kr/`
- `https://hayeon.kr/index.html`
- `https://hayeon.kr/content/site.json`
- `https://hayeon.kr/content/pages/tokyo.json`
- `https://hayeon.kr/assets/common.css`
- `https://hayeon.kr/assets/site.js`
- `https://hayeon.kr/assets/cms-renderer.js`
- `https://hayeon.kr/assets/images/tokyo/img0.jpeg`
- `https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img0.jpeg`
- `https://hayeon.kr/admin/`
- `https://hayeon-cms-auth.netlify.app/admin/`
- `https://hayeon-cms-auth.netlify.app/admin/config.yml`

사용자 사이트에서 노출되면 안 되는 URL:

- `https://hayeon.kr/admin/config.yml` 기대값: 404
- `https://hayeon.kr/scripts/validate-content.js`
- `https://hayeon.kr/assets/images/unused/document.png`
- `https://hayeon.kr/Epilogue.zip`
- `https://hayeon.kr/netlify.toml`

## 13. 문제 발생 시 확인 순서

### CMS 저장이 운영에 보이지 않을 때

1. CMS 저장 또는 publish/merge가 실제로 발생했는지 확인한다.
2. GitHub PR base branch가 `main`인지 확인한다.
3. PR 또는 commit 변경 파일이 의도한 `content/*.json`인지 확인한다.
4. GitHub Actions `Deploy Pages` run이 성공했는지 확인한다.
5. 운영 JSON URL에서 변경 값이 보이는지 확인한다.
6. 운영 HTML에서 렌더링과 링크 동작을 확인한다.
7. 브라우저 캐시를 우회하기 위해 query string을 붙여 다시 확인한다.

### 신규 페이지가 운영에 보이지 않을 때

1. JSON 파일이 `content/generated-pages/<slug>.json`에 있는지 확인한다.
2. `slug`가 `^[a-z0-9-]+$` 규칙을 지키는지 확인한다.
3. `sourceHtml`이 `<slug>.html`이고 기존 19개 HTML 파일명과 충돌하지 않는지 확인한다.
4. `visible`이 `true`인지 확인한다.
5. `image` 경로 파일이 저장소에 있는지 확인한다.
6. `originalUrl`이 `https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<이미지경로>` 형식인지 확인한다.
7. GitHub Actions `Prepare Pages artifact` 단계에서 `.pages-dist/<slug>.html`이 생성됐는지 확인한다.
8. `node scripts/validate-static-site.js --root .pages-dist`가 통과했는지 확인한다.
9. 운영 URL `https://hayeon.kr/<slug>.html`을 query string과 함께 다시 확인한다.

### 신규 페이지가 홈에 보이지 않을 때

1. `visible`이 `true`인지 확인한다.
2. `showOnHome`이 `true`인지 확인한다.
3. `homeTitle`과 `homeImage`가 입력되어 있는지 확인한다.
4. `homeImage` 경로가 `assets/images/...`로 시작하고 실제 파일이 있는지 확인한다.
5. GitHub Actions Pages 배포가 성공했는지 확인한다.

### CMS 로그인이 안 될 때

1. 접속 URL이 `https://hayeon-cms-auth.netlify.app/admin/`인지 확인한다.
2. `https://hayeon-cms-auth.netlify.app/admin/config.yml`이 200인지 확인한다.
3. `admin/config.yml`의 `backend.branch`가 `main`인지 확인한다.
4. `site_domain`이 `hayeon-cms-auth.netlify.app`인지 확인한다.
5. GitHub 계정에 저장소 권한이 있는지 확인한다.
6. Netlify OAuth provider 설정을 확인한다.

### Netlify deploy 또는 credit 문제가 생길 때

1. Netlify Build status가 Stopped builds인지 확인한다.
2. 신규 production deploy가 생성됐는지 확인한다.
3. 생성됐다면 해당 commit이 admin 관련 파일을 바꿨는지 확인한다.
4. content-only 변경이면 build 실행 여부와 credit 수치를 Dashboard에서 확인한다.
5. admin 변경이면 배포 확인 후 다시 Stopped builds로 되돌린다.

## 14. Known Issues

### 외부 오디오

- Tokyo / Fukuoka: Google Drive audio가 브라우저 media 요청에서 ORB 차단될 수 있다.
- Osaka: 기존 외부 오디오 URL이 404 상태다.
- 현재 정책: 오디오 파일 권한과 대체 URL이 확정되기 전까지 운영 수정은 보류한다.
- 외부 오디오 파일은 권한 확인 전 저장소, GitHub Releases, Object Storage, Pages artifact에 추가하지 않는다.

### 이미지 파일 물리 삭제

- CMS에서 이미지 항목을 삭제해도 실제 파일은 자동 삭제되지 않는다.
- 미사용 파일 정리는 별도 작업이 필요하다.

### 신규 페이지 삭제

- 권장 방식은 `visible: false` 비노출 처리다.
- 물리 삭제는 별도 PR 또는 관리자 검토 후 처리한다.

### Netlify Stopped builds

- 관리자 UI 변경 후 Stopped builds 복귀를 잊으면 Netlify credit이 불필요하게 소모될 수 있다.

### 실제 iPhone Safari 확인

- 모바일 레이아웃 변경 후 최종 실기기 확인은 사용자 수동 확인이 필요하다.
- 로컬 브라우저 폭 검증과 실제 iPhone Safari 렌더링은 다를 수 있다.

## 15. 후속 개선 후보

- content-only 변경에서 이미지 artifact 업로드까지 줄이는 추가 fast path 검토
- 신규 이미지 원격 cache miss 검증을 별도 승인된 테스트로 수행
- 외부 오디오 대체 URL 또는 오디오 기능 대체 정책 확정
- 미사용 이미지 파일 정리 기준 수립
- CMS UI를 Decap CMS에서 전용 관리자 앱으로 전환할지 장기 검토

## 검증 명령

문서 작업 후 기본 확인:

```bash
node scripts/validate-content.js
node scripts/validate-static-site.js
git diff --check
git status --short
```

Pages artifact까지 확인할 때:

```bash
node scripts/prepare-pages-artifact.js
node scripts/validate-static-site.js --root .pages-dist
```

Netlify admin artifact를 확인할 때:

```bash
node scripts/prepare-netlify-admin.js
node scripts/validate-static-site.js --root .netlify-admin
```

## 관련 문서

존재가 확인된 운영 문서:

- [CMS 이미지 원본/최적화 정책](docs/cms-image-policy.md)
- [CMS 운영 체크리스트](docs/cms-operation-checklist.md)
- [배포 구조 문서](docs/deployment-structure.md)
- [GitHub Actions Pages 배포](docs/github-actions-pages-deployment.md)
- [main 전환 체크리스트](docs/main-cutover-checklist.md)
- [Netlify CMS Admin Domain](docs/netlify-cms-auth-admin.md)
- [Netlify Credit Optimization](docs/netlify-credit-optimization.md)
- [CMS UI 개선안](docs/cms-ui-improvement-plan.md)
