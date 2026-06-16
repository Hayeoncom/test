# CMS 운영 체크리스트

## 운영 전 필수 설정

- GitHub OAuth 또는 Decap CMS 인증 프록시 설정 필요
- CMS 접근 허용 계정 목록 확정 필요
- 접근 계정에 GitHub 저장소 `Hayeoncom/test` 쓰기 권한 부여 필요
- 운영 브랜치가 `refactor/ver1`인지 확인 필요
- GitHub Pages 또는 배포 대상이 해당 브랜치의 변경사항을 반영하는지 확인 필요
- 배포 루트에 루트 HTML 19개, `assets/`, `content/`, `admin/`, `favicon.ico`가 포함되는지 확인 필요
- 배포 전 `node scripts/validate-content.js` 실행 필요
- 배포 전 로컬 정적 서버에서 `/admin/`, `/admin/config.yml`, 대표 HTML 페이지 접근 확인 필요

## 운영 배포 전 체크리스트

1. `git status --short` 출력이 없는지 확인
2. `node scripts/validate-content.js` 실행
3. 루트 HTML 19개가 저장소 루트에 있는지 확인
4. `assets/common.css`, `assets/site.js`, `assets/cms-renderer.js`가 존재하는지 확인
5. `content/site.json`, `content/pages/*.json`이 존재하는지 확인
6. `admin/index.html`, `admin/config.yml`이 존재하는지 확인
7. `favicon.ico`가 존재하는지 확인
8. 배포 브랜치와 `admin/config.yml`의 `backend.branch`가 운영 정책과 맞는지 확인

## 운영 배포 후 체크리스트

1. 운영 URL의 `/index.html` 또는 루트 경로 접속
2. 운영 URL의 `/favicon.ico` 상태 200 확인
3. 운영 URL의 `/assets/common.css` 상태 200 확인
4. 운영 URL의 `/content/site.json` 상태 200 확인
5. 대표 페이지 2개 이상에서 이미지 깨짐 여부 확인
6. 브라우저 콘솔 오류 확인
7. `/admin/` 접속
8. `/admin/config.yml` 상태 200 확인
9. CMS 로그인 가능 여부 확인
10. CMS 저장 후 배포 반영까지 걸리는 시간 기록

## CMS 접속 경로

- 로컬 확인 경로: `http://localhost:<port>/admin/`
- 운영 확인 경로: `https://<운영도메인>/admin/`

## CMS 로그인 검증 절차

1. 운영 URL의 `/admin/` 접속
2. GitHub 로그인 버튼 표시 확인
3. 허용 계정으로 로그인
4. 저장소 권한 요청 화면이 표시되면 운영자가 승인
5. `Site Settings`와 `Pages` 컬렉션 접근 여부 확인
6. 로그인 실패 시 OAuth 앱 설정, 인증 프록시, 저장소 권한 순서로 확인

## 콘텐츠 수정 절차

1. `/admin/` 접속
2. GitHub 계정으로 로그인
3. `Pages` 컬렉션에서 수정 대상 페이지 선택
4. 제목, 설명, 섹션, 이미지, 캡션 등 필요한 항목 수정
5. 저장 후 editorial workflow 상태 확인
6. 게시 처리 후 GitHub commit 생성 여부 확인
7. 운영 화면에서 반영 여부 확인

## 콘텐츠 수정 검증 절차

1. 수정 전 대상 페이지 URL과 JSON 파일명을 기록
2. CMS에서 텍스트 한 항목 또는 이미지 한 항목만 변경
3. 저장 후 GitHub commit 생성 여부 확인
4. 변경된 `content/pages/*.json` 파일 확인
5. `node scripts/validate-content.js` 실행
6. 운영 화면에서 변경 내용 반영 여부 확인
7. 브라우저 콘솔 오류와 이미지 깨짐 여부 확인

## 이미지 업로드 절차

1. CMS 편집 화면에서 이미지 필드 선택
2. 새 이미지를 업로드
3. 업로드 경로가 `assets/images/uploads` 하위인지 확인
4. 저장 후 JSON의 이미지 경로가 `assets/images/uploads/...` 형태인지 확인
5. 운영 화면에서 이미지 로딩 상태 확인

## 이미지 업로드 검증 절차

1. 업로드 전 이미지 파일명과 확장자 확인
2. CMS 이미지 필드에 업로드
3. 저장 후 GitHub에서 `assets/images/uploads` 하위 파일 생성 확인
4. JSON의 이미지 경로가 실제 파일과 일치하는지 확인
5. `node scripts/validate-content.js` 실행
6. 운영 화면에서 이미지 표시 확인

## 신규 페이지 생성 절차

현재 구조에서는 CMS가 `content/pages/*.json` 생성까지 지원한다.

- 기존 HTML URL 구조에 연결하려면 신규 HTML 파일을 별도로 생성해야 한다.
- JSON만 생성한 신규 페이지는 기존 HTML URL로 자동 노출되지 않는다.
- 신규 페이지 자동 노출이 필요하면 공통 viewer 페이지 또는 정적 빌드 도구 도입이 필요하다.

## 저장 후 반영 확인 절차

1. GitHub 저장소에 CMS 저장 commit이 생성되었는지 확인
2. 변경된 JSON 파일 경로 확인
3. 배포 프로세스 실행 또는 GitHub Pages 재배포 상태 확인
4. 운영 URL 접속
5. 브라우저 콘솔 오류 확인
6. 이미지 깨짐 여부 확인
7. 변경한 텍스트와 이미지가 화면에 표시되는지 확인

## 저장 후 Git Commit 확인 절차

1. GitHub 저장소의 commit 목록 확인
2. CMS 저장 시각과 commit 시각 비교
3. commit 변경 파일에 `content/pages/*.json`, `content/site.json`, 또는 `assets/images/uploads/*`가 포함되는지 확인
4. 예상하지 않은 HTML, CSS, JS 변경이 포함되면 배포 전 검토

## 저장 후 배포 반영 확인 절차

1. 배포 로그 또는 GitHub Pages Actions 상태 확인
2. 운영 페이지 새로고침
3. 브라우저 캐시를 무시하고 새로고침
4. JSON URL을 직접 열어 변경 내용 확인
5. 화면에 변경 내용이 표시되는지 확인
6. 반영되지 않으면 배포 브랜치, 캐시, JSON 경로 순서로 확인

## JSON 검증 스크립트 실행 절차

```sh
node scripts/validate-content.js
```

- 성공 시 `Content validation passed` 메시지가 출력된다.
- 실패 시 오류 파일과 항목이 출력된다.
- 실패 상태에서는 CMS 저장 commit을 배포 대상으로 사용하지 않는다.

## GitHub 권한 확인 항목

- CMS 접근 계정이 저장소 collaborator 또는 조직 멤버인지 확인
- 저장소 write 권한 보유 여부 확인
- OAuth 앱 또는 인증 프록시가 해당 저장소 접근을 허용하는지 확인
- editorial workflow를 사용할 경우 게시 승인 권한 확인

## 운영 브랜치와 배포 브랜치 확인 방법

1. `admin/config.yml`의 `backend.branch` 확인
2. GitHub Pages 또는 정적 호스팅 설정의 배포 브랜치 확인
3. 두 브랜치가 다르면 CMS 저장 후 운영 반영이 지연되거나 누락될 수 있음
4. 운영 정책상 분리된 브랜치를 사용할 경우 병합 절차를 별도 문서로 관리

## 장애 시 확인 항목

- `/admin/config.yml` 로딩 여부
- GitHub OAuth 설정 여부
- CMS 접근 계정의 저장소 권한
- `backend.repo`, `backend.branch` 설정
- `media_folder`, `public_folder` 경로
- JSON 문법 오류 여부
- `content/pages/*.json`의 필수 필드 누락 여부
- 이미지 파일의 실제 존재 여부
- `assets/cms-renderer.js` 로딩 여부
- 브라우저 콘솔 오류 여부

## 장애 발생 시 확인 순서

1. 운영 URL 접속 가능 여부
2. `/admin/config.yml` HTTP 상태
3. 브라우저 콘솔 오류
4. `node scripts/validate-content.js` 결과
5. 이미지 파일 존재 여부
6. GitHub OAuth 또는 인증 프록시 상태
7. 저장소 write 권한
8. GitHub Pages 또는 정적 호스팅 배포 로그
