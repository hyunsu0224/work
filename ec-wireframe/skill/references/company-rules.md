# company-rules.md — 사내 룰 (ecbeing 규약 & 맵핑)

와이어프레임에 이 규칙을 심어두면 **추후 실장 시 맵핑이 거의 자동**으로 된다.
근거 데이터는 `references/ec-reference-analysis.md`(Feiler·Regal·DW mall 실측).

---

## 1. URL 문법 (ecbeing 공통)
| 유형 | 패턴 | 페이지템플릿 | 예 |
|---|---|---|---|
| Top | `/shop/default.aspx` | top | 전 사이트 동일 |
| 카테고리 리스트 | `/shop/c/c{code}/` | list | `/shop/c/c2010/` |
| 랭킹/카테고리 리스트 | `/shop/r/r{code}/` | list | `/shop/r/r1010/` |
| 상품상세 | `/shop/g/g{code}/` | detail | `/shop/g/gJZ31…/` |
| 특집 | `/shop/e/e{code}/` | lp | `/shop/e/egift/` |
| 뉴스/토픽 | `/shop/t/t{code}/` | lp | `/shop/t/t1510/` |
| 정적 자유페이지 | `/shop/pages/{name}.aspx` | lp | `/shop/pages/guide.aspx` |
| 마이페이지/로그인 | `/shop/customer/menu.aspx` | mypage | — |
| 신규등록 | `/shop/customer/agree.aspx` 등 | — | 사이트별 상이 |
| 즐겨찾기 | `/shop/customer/bookmark.aspx` | — | — |
| 카트 | `/shop/cart/cart.aspx` | cart | — |
| 검색 | `/shop/goods/search.aspx` · `search_condition.aspx` | — | — |
| 문의 | `/shop/contact/contact.aspx` | lp | — |

> **와이어 규칙**: 링크 href에는 위 실제 패턴을 넣는다(`#` 금지, 코드는 `{code}` 플레이스홀더).
> 예) 카테고리 타일 → `/shop/c/c{code}/`. 이러면 실장 시 코드만 채우면 됨.

## 2. SP/PC 분기
- **브레이크포인트**: `768px`. 미만=SP.
- ecbeing PC 기본 폭: `meta-viewport: width=1200` → 컨테이너 max 1200px.
- **수동 전환 파라미터**: `?ismodesmartphone=on` (푸터 SP/PC 토글). 와이어 푸터에 명시.
- ecbeing은 SP/PC 마크업이 분리 서빙되는 경우가 있음(디바이스 판정). 와이어는 단일 CSS로 양쪽 표현하되, **분기 지점을 `wf-note`로 주석**.

## 3. 런타임 메타 (실장 참조용, 와이어엔 주석으로만)
```
meta-etm:page_type : top | category | goods | …   ← 페이지 유형 판정
meta-etm:device    : desktop | smartphone
meta-etm:cart_item : []                            ← 카트 뱃지 소스
meta-etm:attr      : {devicetype, login, …}
```
→ 카트 뱃지·로그인 상태·페이지 유형은 이 값에서 온다. 와이어에선 `wf-note`로 "여기 실장 데이터 바인딩" 표시.

## 4. 클래스 네이밍 (로우파이 → 실장 치환 규칙)
- 와이어는 전부 `wf-*` 프리픽스(로우파이 전용, 실장 CSS와 충돌 방지).
- 실장 시 아래 대응으로 치환(사이트별 확정 후 이 표를 업데이트):

| 로우파이(wf-*) | ecbeing 실장 후보(예) | 비고 |
|---|---|---|
| `wf-mega` (CATEGORY) | `#block_globalnav_category` | 앵커+`とじる` close |
| `wf-mega` (AREA/BRAND) | `#block_globalnav_area` | 앵커+`とじる` close |
| `wf-card` | 商品リストパーツ | 플랫폼 표준 파트 |
| `wf-box--img` (lazy) | `img[src=".../lazyloading.png"]` | 지연로딩 관례 |

> **중요**: 위 후보는 3사 관찰 기반 추정. **실제 클래스는 사내 확정본으로 교체**하고 이 표를 사이트별로 분기(예: `company-rules.feiler.md`)하는 것을 권장.

## 5. 공통 UI 관례 (3사 확인)
- 메가메뉴 close 라벨: `close` / `とじる`.
- 지연로딩: `img/usr/lazyloading.png` 플레이스홀더 → 와이어에선 `wf-box--img`.
- 가격표기: `¥12,100（税込）`, SALE는 `정가 → NN%OFF → 할인가`.
- 쿠키바: 하단 고정 + 同意/承諾 버튼(개인정보 우선).
- 상품카드 뱃지: `NEW`, `SALE`, 즐겨찾기 ♡, Quick view.

## 6. 접근성/마크업 기본
- 랜드마크: `header` / `nav` / `main` / `footer` 사용.
- 이미지엔 의미 있는 `alt`(와이어는 라벨 텍스트로 대체).
- 드로어/아코디언은 `aria-expanded` 부여(실장 시).
