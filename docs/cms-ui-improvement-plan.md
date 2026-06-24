# CMS UI 개선안

## 목적

Decap CMS 관리자 화면의 편집 불편 요소를 현재 `admin/config.yml` 기준으로 정리하고, 단기/중기/장기 개선안을 비교한다.

이번 문서는 개선안 정리만 다룬다. 실제 `admin/config.yml` 변경은 후속 작업에서 분리한다.

## 현재 설정 기준 확인

`admin/config.yml`에서 확인한 현재 구조:

- backend: GitHub
- repository: `Hayeoncom/test`
- branch: `main`
- site domain: `hayeon-cms-auth.netlify.app`
- publish mode: `editorial_workflow`
- collections:
  - `site`: `content/site.json`
  - `pages`: `content/pages/*.json`
- `generated_pages`: `content/generated-pages/*.json`
- `pages` collection은 기존 19개 페이지 보호를 위해 `create: false` 상태다.
- `generated_pages` collection은 신규 여행 페이지 생성을 위해 `create: true` 상태다.
- `pages` collection summary는 `{{title}}`이다.
- item summary는 `{{fields.caption}}{{fields.title}}{{fields.image}}`이다.
- `originalUrl` field는 존재하며 영어 hint가 있다.

## 현재 UI 문제 정리

| 항목 | 현재 확인 내용 | 사용자 영향 |
|---|---|---|
| collection 이름 | `Site Settings`, `Pages`처럼 영어 중심이다. | 비개발 사용자가 어떤 메뉴를 골라야 하는지 바로 알기 어렵다. |
| 페이지 목록 | summary가 `{{title}}`만 사용된다. | 파일 ID, page type, 공개 상태를 한눈에 비교하기 어렵다. |
| 필드명 | `Source HTML`, `Page Type`, `Display Order`, `Meta`, `href` 등 개발자 중심 표현이 섞여 있다. | 편집 중 수정해도 되는 필드와 내부 관리 필드 구분이 어렵다. |
| JSON 구조 노출 | sections, items, navigation, audio object/list 구조가 그대로 보인다. | 사진/텍스트만 바꾸려는 사용자에게 화면이 복잡하다. |
| 이미지와 originalUrl | `Image`와 `Original Image URL`이 같은 item 안에 있으나 홈 카드와 상세 이미지의 동작 차이는 CMS 안에서 충분히 설명되지 않는다. | 홈 카드에 originalUrl을 넣어도 기대한 원본 보기 동작이 아닐 수 있다. |
| 저장 절차 안내 | editorial workflow publish/merge 흐름은 CMS UI 안에서 별도 안내가 부족하다. | Save 후 운영 반영까지 필요한 단계와 대기 시간을 놓칠 수 있다. |
| 위험 필드 | `ID`, `Source HTML`, `Page Type`, `Navigation`, `Audio`, `Visible` 등이 노출된다. | 기존 URL, 렌더링 방식, 링크 구조를 실수로 바꿀 위험이 있다. |
| 삭제/신규 생성 | 기존 `pages` collection은 `create: false`이며, 신규 URL은 `generated_pages` collection에서 생성한다. | 기존 페이지 보호와 신규 페이지 생성 흐름이 분리된다. |

## 053 신규 페이지 자동 생성 구조

053 작업 이후 신규 여행 페이지 UI는 별도 collection으로 분리한다.

- collection: `generated_pages`
- 저장 위치: `content/generated-pages/<slug>.json`
- 생성 URL: `https://hayeon.kr/<slug>.html`
- slug 규칙: `^[a-z0-9-]+$`
- 생성 HTML 위치: GitHub Actions Pages build 중 `.pages-dist/<slug>.html`
- 저장소 루트에는 generated HTML을 커밋하지 않는다.
- 홈 노출은 자동이 아니라 기존 홈 카드 데이터 수동 추가 방식이다.

관리 화면 안내 기준:

- 기존 페이지에 사진을 추가할 때는 `페이지 관리` collection을 사용한다.
- 새 URL을 만들 때만 `신규 여행 페이지` collection을 사용한다.
- 표시용 이미지는 `assets/images/...` 경로를 사용한다.
- 원본 이미지는 `https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/...` 형식을 사용한다.
- `admin/config.yml` 변경이므로 Netlify admin 재배포가 필요하다.

## 단기 개선안: Decap config 정리

작업 범위가 작고 현재 구조를 유지하는 안이다.

제안 항목:

- collection `label`, `label_singular`, `description` 한글화
- field `label` 한글화
- field `hint` 추가
- `summary` 개선
- `display_url` 설정 확인
- `logo` 또는 `logo_url` 적용 가능 여부 확인
- `search` 유지 또는 비활성화 검토
- `delete: false` 적용 검토
- 신규 페이지 생성을 막기 위한 `create: false` 검토
- 위험한 내부 필드는 hidden/read-only 대체 가능성 검토
- `originalUrl` 입력 도움말 강화
- 홈 카드와 상세 이미지의 링크 정책 설명 추가
- list/object field의 접힘 또는 요약 지원 여부 확인 후 적용 검토

예상 효과:

- 사용자가 수정해야 할 필드와 건드리면 위험한 필드를 구분하기 쉬워진다.
- 원본 이미지 URL 정책을 CMS 화면 안에서 바로 확인할 수 있다.
- 저장 후 publish/merge 흐름을 실수할 가능성이 줄어든다.

제약:

- Decap CMS 기본 UI의 레이아웃 한계는 남는다.
- 복잡한 list/object 구조 자체가 사라지지는 않는다.
- admin 변경 후 Netlify admin 배포 절차가 필요하다.

## 중기 개선안: Preview 개선

Decap CMS preview customization을 추가해 편집 중 결과를 더 쉽게 확인하는 안이다.

제안 항목:

- 실제 사이트 CSS 일부를 preview에 적용
- page type별 preview template 추가
- 이미지, 캡션, 날짜, 카메라 정보 표시 확인
- `originalUrl` 입력 여부를 preview에서 표시
- 홈 카드와 상세 이미지 동작 차이를 preview 안내로 표시

장점:

- 저장 전 화면 결과를 더 쉽게 예상할 수 있다.
- 이미지/캡션/원본보기 조합을 CMS 안에서 확인할 수 있다.

단점:

- JavaScript 구현이 필요하다.
- 실제 운영 HTML과 완전히 같은 렌더링을 보장하기 어렵다.
- preview 코드 유지보수 부담이 생긴다.

## 장기 개선안: CMS 교체 또는 전용 관리자

| 안 | 설명 | 장점 | 단점 | 추천도 |
|---|---|---|---|---|
| A | Decap config 개선 | 작업 범위가 작고 현재 구조를 유지한다. | UI 한계가 남는다. | 높음 |
| B | Decap preview/custom widget 추가 | 편집 경험을 개선할 수 있다. | JS 구현과 유지보수가 필요하다. | 중간 |
| C | Static CMS 또는 Decap 대체 CMS 검토 | 더 나은 UI 가능성이 있다. | 인증, 저장, 데이터 구조 마이그레이션이 필요할 수 있다. | 중간 |
| D | 전용 관리자 앱 개발 | 원하는 편집 UI를 만들 수 있다. | 인증, 저장 API, 권한, 배포 구현 부담이 크다. | 낮음 |
| E | Tina CMS 등 시각 편집형 CMS 검토 | 시각적 편집 UX 개선 가능성이 있다. | 현재 구조 변경 폭이 크고 도입 검증이 필요하다. | 보류 |

## 추천 방향

1단계:

- README 운영 프로세스 정리
- CMS UI 개선안 문서화

2단계:

- Decap config 기반 1차 UI 정리
- 한글 label 적용
- description/hint 추가
- summary 개선
- 불필요하거나 위험한 필드 노출 최소화
- `originalUrl` 도움말 강화
- 홈 카드와 상세 이미지 정책 설명 추가

3단계:

- 사용자가 여전히 불편하다고 판단하면 preview template 또는 전용 관리자 검토

## 041 후속 작업지시서 초안

저장소에는 `prompt/` 디렉터리가 없고, 현재 작업의 지시서 원본은 저장소 밖 `/Users/hsnkch/hh/prompt`에서 관리된다. 따라서 이번 작업에서는 후속 지시서 파일을 저장소에 만들지 않고 초안을 문서로 남긴다.

제목:

```text
041.CMS_UI_1차개선_Decap_Config_정리
```

범위:

- `admin/config.yml`의 collection label, field label, hint, description, summary 개선
- CMS 관리자에서 홈 카드와 상세 이미지의 링크 정책 설명 추가
- `originalUrl` 입력 도움말 강화
- 위험 필드 노출 최소화 가능성 적용
- `create: false`, `delete: false` 적용 가능 여부 확인 후 반영
- Netlify admin 배포 절차 수행
- Stopped builds 상태에서 admin 변경 시 Active builds 전환 필요 사항 확인
- admin 변경 배포 후 Stopped builds 복귀
- CMS 로그인 화면과 `Pages` collection 표시 확인
- content-only 저장 회귀 검증
- GitHub Pages 사용자 사이트 회귀 검증

검증:

- `https://hayeon-cms-auth.netlify.app/admin/` 200
- `https://hayeon-cms-auth.netlify.app/admin/config.yml` 200
- `https://hayeon.kr/admin/config.yml` 404
- CMS 로그인 진입 확인
- `node scripts/validate-content.js`
- `node scripts/validate-static-site.js`
- `git diff --check`

주의:

- OAuth secret, token, client secret, password, 2FA 값은 문서나 코드에 기록하지 않는다.
- 사용자 사이트 URL 구조는 변경하지 않는다.
- Netlify custom domain으로 `hayeon.kr` 또는 `www.hayeon.kr`을 연결하지 않는다.
