# GitHub Actions Pages 배포

## 목적

이 문서는 GitHub Pages legacy branch source 배포를 GitHub Actions Pages 배포로 전환할 때의 운영 절차를 정리한다.

기존 branch source 방식은 `refactor/ver1` 루트 전체를 Pages 대상으로 사용한다. 이 방식은 운영에 필요 없는 `docs/`, `scripts/`, zip 파일, 미사용 이미지까지 공개 산출물 후보가 되며, 저장소와 이미지 디렉터리 크기가 커질수록 배포 시간이 길어진다.

GitHub Actions Pages 방식은 workflow에서 검증을 먼저 실행한 뒤 `.pages-dist`에 운영 파일만 복사하고, 이 디렉터리만 Pages artifact로 업로드한다.

## 배포 흐름

1. `refactor/ver1`에 push되거나 사용자가 workflow를 수동 실행한다.
2. GitHub Actions가 저장소를 checkout한다.
3. `node scripts/validate-content.js`로 CMS JSON 구조를 검증한다.
4. JavaScript 문법 검사를 실행한다.
5. `node scripts/validate-static-site.js`로 원본 정적 참조를 검증한다.
6. `git diff --check`로 공백 오류를 확인한다.
7. `node scripts/prepare-pages-artifact.js`가 `.pages-dist`를 새로 구성한다.
8. `.pages-dist` 기준으로 `node scripts/validate-static-site.js --root .pages-dist`를 다시 실행한다.
9. `.pages-dist`만 `actions/upload-pages-artifact`로 업로드한다.
10. `actions/deploy-pages`가 GitHub Pages에 배포한다.

## Workflow 실행 조건

- push branch: `refactor/ver1`
- manual trigger: `workflow_dispatch`
- CMS 저장 branch: `admin/config.yml`의 `backend.branch: refactor/ver1`

CMS가 `refactor/ver1`에 commit을 만들면 같은 branch push 조건으로 Pages workflow가 실행되는 구조다.

## Artifact 포함 대상

- 루트 HTML 19개
- `style.css`
- `*.style.css`
- `.nojekyll`
- `CNAME`
- `favicon.ico`
- `assets/common.css`
- `assets/site.js`
- `assets/cms-renderer.js`
- HTML, CSS, JSON에서 직접 참조하는 `assets/images/` 파일
- `assets/images/uploads/`
- `content/site.json`
- `content/pages/*.json`
- `admin/index.html`
- `admin/config.yml`

## Artifact 제외 대상

아래 경로는 repository에는 유지하지만 public Pages artifact에는 포함하지 않는다.

- `.git/`
- `.github/`
- `docs/`
- `scripts/`
- `reports/`
- `prompt/`
- `assets/images/unused/`
- `Epilogue.zip`
- `Rota - FREE.zip`
- `Photography/`
- `travel/`
- `.DS_Store`

운영 HTML, JSON, CSS, JS에서 참조가 추가되면 제외 정책을 다시 검토해야 한다.

## GitHub Pages Source 변경 절차

관리자 권한으로 GitHub Pages source를 GitHub Actions로 변경한다.

```text
GitHub Repository
-> Settings
-> Pages
-> Build and deployment
-> Source
-> GitHub Actions
```

API 권한이 있는 경우 `PATCH /repos/Hayeoncom/test/pages`에서 `build_type`을 `workflow`로 변경할 수 있다.

## 배포 실패 시 확인 순서

1. `Validate CMS content` step 로그
2. `Check JavaScript syntax` step 로그
3. `Validate source references` step 로그
4. `Prepare Pages artifact` step 로그
5. `Validate Pages artifact` step 로그
6. `Upload Pages artifact` step 로그
7. `Deploy to GitHub Pages` step 로그
8. GitHub Pages source가 GitHub Actions인지 확인

## 배포 후 운영 URL 확인 목록

- `https://hayeon.kr/`
- `https://hayeon.kr/index.html`
- `https://hayeon.kr/admin/`
- `https://hayeon.kr/admin/config.yml`
- `https://hayeon.kr/content/site.json`
- `https://hayeon.kr/content/pages/home.json`
- `https://hayeon.kr/assets/common.css`
- `https://hayeon.kr/assets/site.js`
- `https://hayeon.kr/assets/cms-renderer.js`
- `https://hayeon.kr/favicon.ico`

## Rollback 절차

임시 테스트 운영을 branch source로 되돌릴 경우:

```text
GitHub Repository
-> Settings
-> Pages
-> Build and deployment
-> Source: Deploy from a branch
-> Branch: refactor/ver1
-> Folder: / (root)
-> Save
```

정식 운영을 `main` branch source로 되돌릴 경우:

```text
GitHub Repository
-> Settings
-> Pages
-> Build and deployment
-> Source: Deploy from a branch
-> Branch: main
-> Folder: / (root)
-> Save
```

rollback은 사용자 또는 관리자 승인 후 수행한다. rollback 후 `/`, `/admin/`, `/content/`, `/assets/` 접근 상태를 다시 확인한다.
