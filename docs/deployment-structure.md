# 배포 구조 문서

## 현재 디렉터리 구조

```text
/
├── *.html
├── *.style.css
├── style.css
├── assets/
│   ├── common.css
│   ├── site.js
│   ├── cms-renderer.js
│   └── images/
├── content/
│   ├── site.json
│   └── pages/
├── admin/
│   ├── index.html
│   └── config.yml
├── docs/
├── scripts/
├── favicon.ico
├── CNAME
├── .gitignore
└── README.md
```

## 각 경로 역할

- 루트 HTML 19개: 기존 공개 페이지 URL을 유지하는 정적 HTML 진입점
- `*.style.css`, `style.css`: 기존 페이지별 화면 스타일
- `assets/common.css`: 001, 004에서 정리한 공통 스타일과 반응형 보정
- `assets/site.js`: 공통 화면 동작과 슬라이더 재초기화
- `assets/cms-renderer.js`: `content/pages/*.json`을 읽어 기존 HTML DOM에 반영하는 렌더러
- `assets/images/`: 페이지별 이미지와 CMS 업로드 이미지 저장 위치
- `content/site.json`: 사이트와 페이지 목록 메타 데이터
- `content/pages/*.json`: 페이지별 CMS 콘텐츠 데이터
- `admin/`: Decap CMS 관리자 화면과 설정
- `docs/`: 운영자용 문서와 배포 구조 문서
- `scripts/`: 로컬 검증 스크립트
- `favicon.ico`: 브라우저 favicon 요청 대응 파일
- `CNAME`: GitHub Pages 사용자 도메인 설정 파일
- `.gitignore`: 로컬 OS 메타데이터 등 Git 제외 규칙

## 배포 포함 대상

운영 정적 호스팅에는 다음 파일과 디렉터리가 포함되어야 한다.

- 루트 HTML 19개
- 루트 CSS 파일: `style.css`, `*.style.css`
- `assets/`
- `assets/images/`
- `assets/common.css`
- `assets/site.js`
- `assets/cms-renderer.js`
- `content/`
- `content/site.json`
- `content/pages/*.json`
- `admin/`
- `admin/index.html`
- `admin/config.yml`
- `favicon.ico`
- `CNAME`

## 배포 제외 검토 대상

다음 파일과 디렉터리는 운영 공개 필요성을 별도로 검토한다.

- `docs/`: 운영 문서가 공개되어도 되는지 확인 필요
- `scripts/`: 검증 도구 공개 필요성 확인 필요
- `reports/`: 현재 저장소 밖 `/Users/hsnkch/hh/reports`에 작성 중이지만, 저장소 안에 존재할 경우 공개 제외 검토 필요
- `prompt/`: 현재 저장소 밖 `/Users/hsnkch/hh/prompt`에 위치하지만, 저장소 안에 포함될 경우 공개 제외 검토 필요
- `Epilogue.zip`, `Rota - FREE.zip`: 운영 사이트 렌더링에 직접 필요하지 않은 파일로 공개 필요성 확인 필요
- `Photography/`: 현재 운영 HTML에서 직접 참조하지 않는 폴더로 공개 필요성 확인 필요
- `assets/images/unused/`: 미사용 이미지 보관 위치로 공개 필요성 확인 필요
- OS 메타데이터 파일: `.DS_Store`
- 임시 파일과 로컬 백업 파일

이번 작업에서는 위 파일을 삭제하지 않는다. 공개 제외가 필요하면 별도 배포 파이프라인 또는 후속 정리 작업으로 분리한다.

## GitHub Pages 배포 시 주의사항

- 현재 HTML은 `assets/...`, `content/...` 같은 상대 경로를 사용하므로 프로젝트 하위 경로 배포에서도 동작할 수 있다.
- 파일명에 공백이 있는 `2019 tokyo.html`, `new york.html`은 URL에서 `%20`으로 인코딩되어 접근된다.
- 기존 URL 구조를 유지해야 하므로 공백 파일명은 이번 구조에서 변경하지 않는다.
- `admin/config.yml`의 `backend.branch`와 GitHub Pages 배포 브랜치가 다르면 CMS 저장 내용이 운영 화면에 바로 반영되지 않을 수 있다.
- `CNAME` 파일이 있으므로 사용자 도메인 설정이 필요한 배포 환경인지 확인해야 한다.
- Jekyll 처리가 필요한 구조는 현재 사용하지 않는다. `.nojekyll` 추가 여부는 배포 환경에서 문제가 확인될 때 별도 판단한다.

## 일반 정적 호스팅 배포 시 주의사항

- 저장소 루트를 그대로 정적 루트로 배포하는 구성이 가장 단순하다.
- 루트 HTML 19개가 배포 루트에 있어야 기존 URL이 유지된다.
- `content/**/*.json`이 정적 파일로 서빙되어야 CMS 렌더러가 동작한다.
- `admin/config.yml`이 `text/yaml` 또는 일반 정적 파일로 접근 가능해야 한다.
- 캐시 정책이 강하면 CMS 저장 후 운영 화면 반영이 지연될 수 있다.
- 이미지 경로 대소문자를 보존해야 한다. 현재 `.JPG`, `.jpeg`, `.png`가 혼재한다.

## CMS 운영 시 필요한 파일

- `admin/index.html`
- `admin/config.yml`
- `content/site.json`
- `content/pages/*.json`
- `assets/images/uploads/`
- `assets/cms-renderer.js`
- `assets/site.js`
- `assets/common.css`

## JSON 콘텐츠 검증 절차

배포 전 다음 명령을 실행한다.

```sh
node scripts/validate-content.js
```

검증 항목은 다음과 같다.

- JSON 문법
- 빈 JSON 파일 여부
- `content/site.json` 기본 구조
- `content/pages/*.json` 필수 필드
- 허용된 `pageType`
- 허용된 section `type`
- 이미지 경로 존재 여부
- 내부 링크 대상 파일 존재 여부
- `sourceHtml` 대상 파일 존재 여부
- `displayOrder` 숫자 여부
- `visible` boolean 여부
- 외부 오디오 URL 형식

## 신규 페이지 생성 정책

최종 추천안은 C안, 정적 빌드 도구 도입이다.

단기 운영안은 A안이다.

- CMS에서 신규 `content/pages/*.json` 생성
- 개발자가 기존 구조에 맞는 HTML 파일 수동 생성
- 기존 19개 HTML URL 유지

장기 개선안은 JSON 기준 정적 HTML 생성이다.

- CMS 데이터와 운영 HTML의 일치성 확보
- 신규 페이지 자동 생성 가능
- 빌드/배포 검증 흐름 추가 필요

B안 공통 viewer는 중간 단계로 검토 가능하지만, 기존 페이지와 신규 페이지 URL 체계가 이원화될 수 있다.

## HTML fallback 정책

최종 추천안은 C안, 정적 빌드 전환이다.

현재 단계에서는 fallback을 유지한다.

- JavaScript 또는 JSON 로딩 실패 시 기존 HTML 콘텐츠가 남아 있어 안정성이 높다.
- 단, JSON과 HTML fallback 데이터가 불일치할 수 있다.

장기적으로는 JSON을 기준으로 정적 HTML을 생성해 운영 화면 안정성과 데이터 일치성을 함께 확보한다.

## 후속 개선 제안

### HIGH

- 운영 GitHub OAuth 또는 Decap 인증 프록시 설정
- 운영 배포 브랜치와 CMS 저장 브랜치 확정
- 운영 환경에서 CMS 저장, Git commit 생성, 배포 반영 검증

### MEDIUM

- 배포 파이프라인에서 `node scripts/validate-content.js` 실행
- 공개 제외 대상 파일을 배포 산출물에서 분리
- JSON 기준 정적 HTML 생성 설계

### LOW

- 실제 기기별 반응형 회귀 검증 자동화
- favicon 브랜드 정책 정리
