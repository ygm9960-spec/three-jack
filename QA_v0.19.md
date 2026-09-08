# v0.19 QA 결과

## 구조·콘텐츠 정적 검사
- 학생용 장면: 33개
- 학생용 라인: 348개
- 허용되지 않은 line type: 0건
- 장면 배경 별칭 해석 후 누락: 0건
- 이미지 별칭 대상 파일 누락: 0건
- JS에서 참조하는 HTML id 누락: 0건
- 중복 HTML id: 0건
- app.js / storyData.js / assetMap.js / stageMap.js / visualMap.js / directorMap.js / assetAliases.js / assetAvailability.js / sw.js: Node 문법 검사 통과

## 실제 브라우저 렌더·장면 시뮬레이션
테스트 환경에서 실제 실행 가능한 Chromium 엔진으로 자동 검수함.
- 390×844: 33개 모든 장면 진입 + 각 장면 마지막 라인 렌더링 검사
  - JavaScript page error 0
  - HTTP/자산 4xx·5xx 0
  - request failure 0
  - 가로 overflow 0
  - 고정 대사창 자체 overflow 0
- 360×800: 프롤로그/각 챕터 시작·끝/에필로그 대표 8장면 검사 통과
- 412×915 Samsung Internet UA: 대표 8장면 검사 통과
- 430×932 Edge Mobile UA: 대표 8장면 검사 통과
- 390×844 iPhone Safari UA: 대표 8장면 검사 통과

주의: 현재 실행 환경에는 실제 Firefox(Gecko)·Safari(WebKit) 실행 바이너리가 없어 해당 엔진을 직접 실행하지는 못했다. 대신 Safari/Firefox에서 문제가 될 수 있는 문법·CSS 의존성을 제거/폴백 처리했고, Safari UA/모바일 크기 렌더링은 Chromium에서 별도 점검했다.

## 용량
- v0.18.1 원본 ZIP 해제 기준 약 41 MB
- v0.19 배포 폴더 약 9.5 MB
- 이미지: 배경 10개 물리 파일 약 3.0 MB / 캐릭터 31개 물리 파일 약 6.2 MB
- HTML+CSS+JS 핵심 텍스트 자산 약 288 KB
- 프롤로그 숨은 배경 프리로드 제거로 초기 체감 로딩도 추가 감소

## 복구·안정성 확인
- 이미지 누락 시 캐릭터 fallback/이전 정상 이미지 사용 구조 유지
- localStorage 오류는 try/catch로 앱 진행 유지
- 진행상황 primary + backup 저장 및 범위 보정 유지
- 빠른 연타 gate와 장면 transition lock 유지
- 오디오 파일이 아직 비어 있어도 BGM 엔진은 파일 존재 목록을 확인해 조용히 비활성화됨
