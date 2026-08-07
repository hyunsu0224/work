---
name: ec-wireframe-generator
description: ecbeing 플랫폼 EC 사이트의 로우파이 와이어프레임(회색박스, HTML)을 컴포넌트 조립 방식으로 제작한다. 사용자가 "와이어프레임", "ワイヤーフレーム", "wireframe", "画面設計", "페이지 구성/설계", "top/一覧/詳細 페이지 뼈대", "화면 골격"을 만들거나 검토하려 할 때 반드시 사용한다. EC 사이트의 top·商品一覧·商品詳細·cart·mypage·LP 등 페이지 구조를 잡거나, 사내 룰(ecbeing URL 문법·클래스 네이밍)을 지킨 재사용 가능한 마크업 골격이 필요할 때, 혹은 추후 실장 맵핑을 염두에 둔 화면 설계가 필요할 때 폭넓게 발동한다. "그냥 대충 화면 그려줘" 같은 모호한 요청이라도 EC/쇼핑 페이지 맥락이면 이 스킬을 쓴다.
---

# EC Wireframe Generator

ecbeing 플랫폼 EC 사이트의 **로우파이 와이어프레임**을 만든다.
컴포넌트 사전에서 블록을 꺼내 → 페이지 템플릿 순서로 조립 → 사내 룰(URL/네이밍)을 심는다.
목적은 두 가지: (1) 구조·배치 빠른 검증, (2) **추후 실장 맵핑의 밑그림**.

## 산출물 규칙 (고정)
- **충실도**: 로우파이 회색 박스만. 실제 색·이미지·폰트 넣지 않음. 이미지 자리는 `wf-box--img`(대각선).
- **형식**: HTML 렌더링(단일 `.html` 파일, `wireframe.css` 링크 또는 인라인).
- **대응**: SP + PC 양쪽. 브레이크포인트 768px. 분기 지점은 `wf-note` 주석.
- **주석**: 각 요소의 동작·옵션은 `<span class="wf-note">…</span>`로 화면에 명시(예: "hover→메가메뉴").
- **링크**: href에 ecbeing 실제 URL 패턴(`/shop/c/c{code}/` 등) 사용. `#` 남발 금지.

## 워크플로우
1. **페이지 유형 확정** — top / list / detail / cart / mypage / lp 중 선택.
   → `references/page-templates.md`에서 해당 유형의 표준 섹션 로드.
2. **섹션 구성 확정** — 필수 섹션 + 옵션 섹션 취사. 순서 조정.
3. **블록별 옵션 지정** — 각 섹션을 `references/components.md`의 컴포넌트로 채우고 옵션 플래그 설정.
4. **사내 룰 적용** — `references/company-rules.md`로 URL·네이밍·SP분기·메타 주석 심기.
5. **조립·렌더** — `assets/base-header.html` + `assets/base-footer.html` + 본문. `assets/wireframe.css` 적용.
6. **검토·수정** — SP/PC 확인, 인터랙션(hover·드로어·아코디언) 동작 확인.

## 입력(지시서) 최소 형식
```
페이지: <top | list | detail | cart | mypage | lp>
대상: <SP | PC | both>
섹션:
  1. <컴포넌트>  옵션: [...]
  2. <컴포넌트>  옵션: [...]
비고: <사내룰 예외 / 특이사항>
```
지시서가 짧아도 페이지 템플릿의 필수 섹션은 자동 포함하고, 애매하면 옵션은 기본값으로 채운 뒤 주석으로 표기한다.

## 참조 파일 (언제 읽을지)
- `references/page-templates.md` — **1단계**. 페이지 유형별 섹션 순서.
- `references/components.md` — **3단계**. 블록 구성·상태·옵션.
- `references/company-rules.md` — **4단계**. URL 문법·네이밍·SP분기·맵핑표. 실장 연결의 핵심.
- `references/ec-reference-analysis.md` — 새 컴포넌트/사이트별 variant가 필요할 때. 3사 실측 근거.

## assets
- `assets/wireframe.css` — 로우파이 회색박스 시스템(전 페이지 링크).
- `assets/base-header.html` — 헤더(PC 메가메뉴 hover + SP 드로어 slide-in, JS 포함).
- `assets/base-footer.html` — 푸터(링크군 + SP/PC전환 + 쿠키바).

## 맵핑(실장 연결) 원칙
- 로우파이는 `wf-*` 클래스로 작성 → 실장 CSS와 충돌 없음.
- `company-rules.md`의 치환표로 `wf-*` → ecbeing 실 클래스 대응.
- 사이트별로 실 클래스가 다르면 `company-rules.<site>.md`로 분기 권장(예: feiler/regal/dwmall).

## 새 사이트 온보딩
공개 top URL을 받으면: (1) fetch → 구조 추출, (2) `ec-reference-analysis.md`에 사례 추가,
(3) 사이트별 variant 축·URL 코드 체계·실 클래스를 `company-rules.<site>.md`로 분기.
