# page-templates.md — 페이지 템플릿

"이 페이지 유형은 이 섹션들이 이 순서로 온다"의 표준. 페이지 유형만 고르면 뼈대가 깔린다.
각 섹션은 `components.md`의 블록으로 채운다. `[필수]`/`[옵션]` 표기.

> 모든 페이지 공통: **header(base-header.html) → 본문 → footer(base-footer.html) → cookie-bar**.
> ecbeing URL 유형 매핑은 `company-rules.md` 참조.

---

## TOP (`/shop/default.aspx`, `page_type: top`)
1. `[필수]` hero-slider — 시즌/캠페인 비주얼
2. `[옵션]` 会員特典/決済 프로모 배너 (2~3열)
3. `[필수]` category-grid — カテゴリから探す
4. `[옵션]` topics-banner — 特集/読み物
5. `[필수]` ranking-tab — 카테고리·성별별 랭킹
6. `[필수]` product-carousel — 新着/おすすめ/今売れた (1~3블록)
7. `[옵션]` area/brand 내비 (식품=지역 / 잡화=브랜드)
8. `[옵션]` scene·design 검색 진입(패싯)
9. `[옵션]` info-list — INFORMATION
10. `[옵션]` SNS/Instagram · members 프로모 · 결제수단 배너

## 商品一覧 / LIST (`/shop/c/cXXXX/`, `/shop/r/rXXXX/`)
1. `[필수]` breadcrumb
2. `[필수]` 카테고리 타이틀 + 건수
3. `[옵션]` 카테고리 설명 / 서브카테고리 칩
4. `[필수]` sort-bar (정렬 + 표시건수 + 뷰전환)
5. `[필수]` filter (PC=좌측 사이드 / SP=상단 絞り込み 드로어)
6. `[필수]` product-grid (PC 3~4열 / SP 2열)
7. `[필수]` pagination
8. `[옵션]` 하단 category-grid / 関連特集

## 商品詳細 / DETAIL (`/shop/g/gXXXX/`)
1. `[필수]` breadcrumb
2. `[필수]` 2단 레이아웃: 좌 gallery / 우 상품정보
   - 우측: 브랜드 · 상품명 · 가격(税込, SALE) · variant-selector · 수량 · cta(카트) · 서브cta(즐겨찾기/즉시구매)
   - `[옵션]` 재고/배송/납기, 쿠폰, 결제아이콘
3. `[필수]` 상품 상세설명(스펙표 + 이미지 본문)
4. `[옵션]` サイズガイド / 素材 / お手入れ
5. `[옵션]` レビュー(평점 + 리스트)
6. `[필수]` 関連商品 / この商品を見た人は (product-carousel)
7. `[옵션]` 최근 본 상품

> SP: 상세는 1단 세로 스택. cta를 하단 고정 바로 띄우는 옵션 권장(`sticky-cta`).

## CART (`/shop/cart/cart.aspx`)
1. `[필수]` 스텝 인디케이터 (カート→情報入力→確認→完了)
2. `[필수]` 카트 아이템 리스트(썸네일·명·수량·가격·삭제)
3. `[필수]` 금액 요약(소계/송료/합계) + レジに進む cta
4. `[옵션]` 쿠폰/포인트, おすすめ追加, 継続購入

## MYPAGE (`/shop/customer/menu.aspx`)
1. `[필수]` 회원 개요(이름/포인트/랭크)
2. `[필수]` 메뉴 그리드(注文履歴/お気に入り/会員情報/住所帳 …)
3. `[옵션]` おすすめ / 최근 본 상품

## LP / FREEPAGE (`/shop/pages/*.aspx`, `/shop/e/eXXXX/`)
- 자유 구성. header/footer만 공통. 본문은 topics-banner + product-carousel + 자유 섹션 조합.
- 특집(e)=상품 연동형 / 정적(pages)=콘텐츠형.

---

## 지시서 최소 형식 (3층 입력)
```
페이지: <top | list | detail | cart | mypage | lp>
대상: <SP | PC | both>
섹션:
  1. <컴포넌트>  옵션: [...]
  2. <컴포넌트>  옵션: [...]
비고: <특이사항 / 사내룰 예외>
```
