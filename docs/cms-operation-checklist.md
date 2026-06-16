# CMS 운영 체크리스트

## 운영 전 필수 설정

- GitHub OAuth 또는 Decap CMS 인증 프록시 설정 필요
- CMS 접근 허용 계정 목록 확정 필요
- 접근 계정에 GitHub 저장소 `Hayeoncom/test` 쓰기 권한 부여 필요
- 운영 브랜치가 `refactor/ver1`인지 확인 필요
- GitHub Pages 또는 배포 대상이 해당 브랜치의 변경사항을 반영하는지 확인 필요

## CMS 접속 경로

- 로컬 확인 경로: `http://localhost:<port>/admin/`
- 운영 확인 경로: `https://<운영도메인>/admin/`

## 콘텐츠 수정 절차

1. `/admin/` 접속
2. GitHub 계정으로 로그인
3. `Pages` 컬렉션에서 수정 대상 페이지 선택
4. 제목, 설명, 섹션, 이미지, 캡션 등 필요한 항목 수정
5. 저장 후 editorial workflow 상태 확인
6. 게시 처리 후 GitHub commit 생성 여부 확인
7. 운영 화면에서 반영 여부 확인

## 이미지 업로드 절차

1. CMS 편집 화면에서 이미지 필드 선택
2. 새 이미지를 업로드
3. 업로드 경로가 `assets/images/uploads` 하위인지 확인
4. 저장 후 JSON의 이미지 경로가 `assets/images/uploads/...` 형태인지 확인
5. 운영 화면에서 이미지 로딩 상태 확인

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
