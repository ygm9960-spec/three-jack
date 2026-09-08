# v0.19 변경사항 — 안정성·경량화·호환성 점검

## 경량화
- 동일 바이트의 캐릭터 이미지 45개와 배경 이미지 20개를 실제 파일 중복 대신 별칭 매핑으로 통합.
- 남은 WebP를 모바일 표시 크기에 맞게 재인코딩(캐릭터 품질 84, 배경 품질 82, 투명도 유지).
- 배포 폴더에서 과거 버전 QA/기능 상태/중간 산출물 문서를 제거.
- 프롤로그는 검은 화면이므로 보이지 않는 대서양 배경을 더 이상 다운로드하지 않음.
- 초기 부팅은 CH1 첫 실제 장면과 바로 다음 장면의 필요한 배경/캐릭터만 중복 없이 프리로드.
- 프리로드 이미지의 timeout/onload/onerror 핸들러를 완료 시 정리해 장시간 플레이 시 불필요한 타이머 누적을 줄임.

## 안정성·브라우저 호환
- Safari 계열용 `100vh → 100dvh` 폴백과 `-webkit-backdrop-filter` 폴백 추가.
- 비교적 오래된 Safari에서 문제가 될 수 있는 논리 할당 연산자(`||=`)와 `replaceAll` 의존을 제거.
- `requestIdleCallback`, `visualViewport`, `structuredClone`, `Image.decode`는 기존 feature-detection/fallback 구조 유지.
- Service Worker에 navigation network-first + offline index fallback, 이미지 cache-first, 정적 파일 stale-while-revalidate 성격의 캐시 흐름 적용.
- 캐시 버전을 v0.19로 갱신해 이전 배포 캐시와 충돌 방지.

## 유지한 연출 원칙
- 배경 줌/패닝/흔들림 없음.
- 고정 높이 대사창 유지.
- 기묘사화형 느린 타이핑 속도 유지.
- 장면 내 인물 레이어 유지 방식과 절제된 캐릭터 리액션 유지.
- 검은 프롤로그와 수미상관 에필로그 유지.
