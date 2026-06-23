# Hayeon 운영 문서

## 프로젝트 개요

이 저장소는 정적 여행 사진 사이트 `https://hayeon.kr/`의 운영 파일을 관리한다.

- 사용자 사이트는 GitHub Pages에서 제공한다.
- 운영 브랜치는 `main`이다.
- 콘텐츠는 Decap CMS에서 `content/*.json` 파일을 수정하는 방식으로 관리한다.
- GitHub Actions Pages workflow가 `.pages-dist` 배포 산출물을 만들고 GitHub Pages에 배포한다.
- Netlify는 사용자 사이트 배포용이 아니라 CMS 관리자 화면 제공용이다.

## 운영 URL

| 구분 | URL | 기대값 |
|---|---|---|
| 사용자 사이트 | `https://hayeon.kr/` | 200 |
| 사용자 사이트 index | `https://hayeon.kr/index.html` | 200 |
| CMS 관리자 | `https://hayeon-cms-auth.netlify.app/admin/` | 200 |
| 사용자 사이트의 admin 안내 페이지 | `https://hayeon.kr/admin/` | 200, Netlify 관리자 URL 안내 또는 이동 |
| 사용자 사이트 CMS config | `https://hayeon.kr/admin/config.yml` | 404 |
| Netlify CMS config | `https://hayeon-cms-auth.netlify.app/admin/config.yml` | 200 |

`hayeon.kr` 또는 `www.hayeon.kr`을 Netlify custom domain으로 연결하지 않는다.

## CMS 콘텐츠 수정 절차

1. `https://hayeon-cms-auth.netlify.app/admin/`에 접속한다.
2. `Login with GitHub`을 선택한다.
3. GitHub 계정으로 로그인한다.
4. `Pages` collection을 선택한다.
5. 수정할 페이지를 선택한다.
6. 텍스트, 이미지 경로, `originalUrl` 등을 수정한다.
7. `Save`를 선택한다.
8. editorial workflow 화면에서 publish 또는 merge 절차를 진행한다.
9. GitHub PR 또는 commit이 `main`에 반영되는지 확인한다.
10. GitHub Actions `Deploy Pages` workflow가 성공할 때까지 기다린다.
11. `https://hayeon.kr/` 또는 대상 상세 페이지에서 운영 반영 여부를 확인한다.

주의사항:

- 저장 직후 사용자 사이트에 바로 반영되지 않을 수 있다.
- GitHub Actions Pages 배포가 끝난 뒤 사용자 사이트에 반영된다.
- editorial workflow 설정 때문에 PR merge가 필요할 수 있다.
- 로그인 계정은 `Hayeoncom/test` 저장소에 필요한 권한이 있어야 한다.
- OAuth secret, token, client secret, password, 2FA 값은 저장소 파일에 기록하지 않는다.

## 이미지 운영 정책

웹페이지 표시 이미지는 `assets/images/**` 경로의 최적화 이미지를 사용한다.

원본 이미지 보기는 `content/pages/*.json`의 선택 필드인 `originalUrl`을 사용한다.

운영 표준 형식:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<이미지경로>
```

예시:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img2.jpeg
```

정책:

- 웹페이지에서는 `image` 필드의 최적화 이미지를 표시한다.
- 상세 페이지 이미지를 클릭했을 때 `originalUrl`이 있으면 새 창에서 원본 이미지를 연다.
- 원본 링크는 `target="_blank"`와 `rel="noopener noreferrer"` 구조를 사용한다.
- 홈 카드 이미지는 기존 페이지 이동 링크를 유지한다.
- 홈 카드에는 `originalUrl` 새 창 링크를 적용하지 않는다.
- `originalUrl`이 없으면 일반 이미지로만 표시한다.
- 페이지 번호 링크는 새 창이 아니라 현재 창에서 이동한다.

## GitHub Actions Pages 배포 흐름

```text
main push 또는 PR merge
↓
GitHub Actions Deploy Pages workflow 실행
↓
콘텐츠와 정적 참조 검증
↓
.pages-dist 생성
↓
배포 산출물 이미지 최적화
↓
GitHub Pages artifact 업로드
↓
GitHub Pages 배포
↓
https://hayeon.kr/ 반영
```

운영 기준:

- `.pages-dist`는 배포 산출물이며 커밋 대상이 아니다.
- 이미지 최적화는 `.pages-dist` 안의 배포 산출물에서만 수행한다.
- 원본 `assets/images/**` 파일은 유지한다.
- Pages artifact는 1GB 미만이어야 한다.
- `docs/`, `scripts/`, `reports/`, `prompt/`, `assets/images/unused/`, zip 파일, `netlify.toml`은 사용자 사이트 Pages artifact에서 제외한다.
- `admin/config.yml`은 사용자 사이트 Pages artifact에서 제외되어 `https://hayeon.kr/admin/config.yml`이 404가 되는 구조를 유지한다.

## Netlify admin 운영 정책

Netlify는 CMS 관리자 정적 파일만 제공한다.

```text
https://hayeon-cms-auth.netlify.app/admin/
```

Netlify admin artifact는 `.netlify-admin`이며 아래 파일만 필요하다.

```text
.netlify-admin/
  _redirects
  favicon.ico
  admin/
    index.html
    config.yml
```

기본 운영 정책은 Stopped builds다.

- Netlify는 사용자 사이트 배포용이 아니다.
- CMS content-only 저장 시 Netlify production deploy가 새로 생성되면 안 된다.
- 기존 Netlify 배포본은 `/admin/`과 `/admin/config.yml`을 계속 제공한다.
- `admin/index.html`, `admin/config.yml`, `netlify.toml`, `scripts/prepare-netlify-admin.js`, `scripts/netlify-ignore-build.js`를 바꿀 때만 Netlify build를 일시적으로 다시 켠다.
- admin 변경 배포 확인 후 다시 Stopped builds로 되돌린다.
- Netlify credit 사용량은 사용자 계정의 Dashboard에서 수동 확인한다.

## Netlify credit 절감 방식

CMS content-only 변경은 보통 `content/pages/*.json` 또는 `content/site.json`만 바꾼다. 이 변경은 사용자 사이트에는 필요하지만 Netlify admin artifact에는 영향을 주지 않는다.

운영 방식:

1. CMS 저장 또는 publish/merge로 `main`에 콘텐츠 변경이 들어온다.
2. GitHub Actions Pages가 사용자 사이트를 배포한다.
3. Netlify는 Stopped builds 상태를 유지한다.
4. Netlify production deploy가 새로 생성되지 않는지 확인한다.
5. Netlify credit 수치는 Dashboard에서 확인한다.

`netlify.toml`의 build ignore 설정은 fallback 정책으로 유지한다.

```toml
[build]
  command = "node scripts/prepare-netlify-admin.js"
  ignore = "node scripts/netlify-ignore-build.js"
  publish = ".netlify-admin"
```

## 운영 확인 URL

배포 후 확인할 URL:

- `https://hayeon.kr/`
- `https://hayeon.kr/index.html`
- `https://hayeon.kr/content/pages/tokyo.json`
- `https://hayeon.kr/assets/common.css`
- `https://hayeon.kr/assets/site.js`
- `https://hayeon.kr/assets/cms-renderer.js`
- `https://hayeon.kr/admin/`
- `https://hayeon-cms-auth.netlify.app/admin/`
- `https://hayeon-cms-auth.netlify.app/admin/config.yml`

사용자 사이트에서 노출되면 안 되는 URL:

- `https://hayeon.kr/admin/config.yml`
- `https://hayeon.kr/scripts/validate-content.js`
- `https://hayeon.kr/assets/images/unused/document.png`
- `https://hayeon.kr/Epilogue.zip`
- `https://hayeon.kr/netlify.toml`

## 검증 명령

저장소에서 확인된 기본 검증 명령:

```bash
node scripts/validate-content.js
node scripts/validate-static-site.js
node --check assets/cms-renderer.js
node --check assets/site.js
node --check scripts/prepare-pages-artifact.js
node --check scripts/prepare-netlify-admin.js
node --check scripts/validate-content.js
node --check scripts/validate-static-site.js
node --check scripts/netlify-ignore-build.js
git diff --check
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

## 문제 발생 시 확인 순서

CMS 저장이 운영에 보이지 않을 때:

1. CMS 저장 또는 publish/merge가 실제로 발생했는지 확인한다.
2. GitHub PR base branch가 `main`인지 확인한다.
3. PR 또는 commit 변경 파일이 의도한 `content/*.json`인지 확인한다.
4. GitHub Actions `Deploy Pages` run이 성공했는지 확인한다.
5. 운영 JSON URL에서 변경 값이 보이는지 확인한다.
6. 운영 HTML에서 렌더링과 링크 동작을 확인한다.
7. 브라우저 캐시를 우회하기 위해 query string을 붙여 다시 확인한다.

CMS 로그인이 안 될 때:

1. 접속 URL이 `https://hayeon-cms-auth.netlify.app/admin/`인지 확인한다.
2. `https://hayeon-cms-auth.netlify.app/admin/config.yml`이 200인지 확인한다.
3. `admin/config.yml`의 `backend.branch`가 `main`인지 확인한다.
4. `site_domain`이 `hayeon-cms-auth.netlify.app`인지 확인한다.
5. GitHub 계정에 저장소 권한이 있는지 확인한다.
6. Netlify OAuth provider 설정을 확인한다.

Netlify deploy 또는 credit 문제가 생길 때:

1. Netlify Build status가 Stopped builds인지 확인한다.
2. 신규 production deploy가 생성됐는지 확인한다.
3. 생성됐다면 해당 commit이 admin 관련 파일을 바꿨는지 확인한다.
4. content-only 변경이면 build 실행 여부와 credit 수치를 Dashboard에서 확인한다.
5. admin 변경이면 배포 확인 후 다시 Stopped builds로 되돌린다.

## Known Issues

### 외부 오디오

- Tokyo/Fukuoka Google Drive 오디오가 브라우저 media 요청에서 ORB 차단될 수 있다.
- Osaka 오디오 URL은 404 상태로 확인된 이력이 있다.
- 권한이 확인된 대체 오디오 URL이 준비되기 전까지 현 URL을 안정 동작으로 간주하지 않는다.
- 외부 오디오 파일은 권한 확인 전 저장소, GitHub Releases, Object Storage, Pages artifact에 추가하지 않는다.

### Netlify credit

- Netlify Dashboard 수치는 사용자 계정에서 직접 확인해야 한다.
- CLI/API에서 deploy 미생성 여부를 확인해도 credit 총량 변화까지 항상 정량 확인되는 것은 아니다.

### 실제 iPhone Safari 확인

- 모바일 레이아웃 변경 후 최종 실기기 확인은 사용자 수동 확인이 필요하다.
- 로컬 브라우저 폭 검증과 실제 iPhone Safari 렌더링은 다를 수 있다.

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
