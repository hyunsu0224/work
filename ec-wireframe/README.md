# EC 와이어프레임 빌더

브라우저에서 서버로 열어 EC 사이트 로우파이 와이어프레임을 **조립 → 라이브 프리뷰 → HTML 다운로드**하는 툴.
한국어/일본어 언어 토글 지원(주석·wf-note만 언어별 분리, EC 콘텐츠 라벨은 일본어 공통).

## 실행
```bash
node server.js
```
→ 브라우저에서 http://localhost:5173

포트 변경: `node server.js 3000`

## 사용법
1. 상단에서 **페이지 유형**(top/list/detail/cart/mypage/lp) 선택 → 표준 템플릿이 깔림
2. 왼쪽 **컴포넌트** 칩으로 섹션 추가, ▲▼로 순서 변경, ✕로 삭제
3. 각 섹션의 **옵션**(열수·매수·뱃지 등) 조정 → 오른쪽 프리뷰 실시간 갱신
4. **표시 대상**(PC+SP / PC / SP)으로 프리뷰 폭 전환
5. **언어**(한국어/日本語) 토글
6. **⬇ HTML 다운로드** → `<페이지유형>-wireframe.html` (자기완결 단일 파일)

header · footer · cookie-bar 는 전 페이지 공통으로 자동 포함됩니다.

## 구조
```
index.html          빌더 진입점
server.js           무의존 정적 서버
styles/
  builder.css       빌더 UI 스타일
  wireframe.css     출력물(와이어프레임) 스타일 — 단일 소스, export 시 인라인
src/
  app.js            UI 컨트롤러(상태·프리뷰·다운로드)
  catalog.js        컴포넌트 사전(render 함수) — demo 마크업과 동일 출력
  templates.js      페이지 유형별 표준 섹션 구성
  export.js         상태 → 자기완결 HTML 조립(공통 헤더/푸터/스크립트)
  i18n.js           언어팩(ko/ja): UI·wf-note·메타
skill/              원본 wireframe-generator 스킬(참조 문서·근거)
```

## 확장 방법
- **새 컴포넌트**: `src/catalog.js`에 `render(opts, ctx)` 추가 → `i18n.js`의 `comp`/`note`에 라벨 추가 → 필요한 `templates.js`/`palette`에 등록
- **새 페이지 유형**: `templates.js`의 `PAGE_TYPES`·`templates`·`palette` + `i18n.js`의 `pageTypes`
- 컴포넌트/룰 근거는 `skill/references/` 참조

## TODO (다음 단계 후보)
- 드래그&드롭 순서 변경(현재는 ▲▼)
- company-rules 실 클래스 맵핑 → 실장용 마크업 export 모드
- 구성 저장/불러오기(JSON), 프리셋
- CSS 코멘트까지 언어 토글(현재 wf-note만)
