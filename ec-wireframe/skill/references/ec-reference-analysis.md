# ec-reference-analysis.md — 레퍼런스 3사 실측

`company-rules.md`의 근거이자, 새 컴포넌트가 필요할 때 참조하는 실물 사례집.
분석일 기준 공개 top 페이지 3종. 세 곳 모두 **ecbeing 플랫폼** 확인.

| 사이트 | 업종 | URL |
|---|---|---|
| FEILER | 패션잡화(핸카치/바그) | feiler.jp/shop/default.aspx |
| REGAL | 구두 | regal.co.jp/shop/default.aspx |
| DISCOVER WEST mall | 지역식품·철도굿즈 | dwmall.westjr.co.jp/shop/default.aspx |

---

## 공통 골격 (3사 일치)
1. **헤더**: 로고 + 글로벌내비(카테고리/브랜드or지역/특집/뉴스) + 유틸(가이드/FAQ/문의) + 회원액션(로그인·신규등록·즐겨찾기·마이페이지·카트뱃지·검색).
2. **메가메뉴/드로어**: PC hover 전개 + `close/とじる`. SP 햄버거 드로어.
3. **히어로 캐러셀**.
4. **카테고리 그리드 내비**(아이콘 타일).
5. **랭킹**(카테고리/성별/지역 탭).
6. **상품 캐러셀**(新着/おすすめ/今売れた/NEW ARRIVALS).
7. **특집/뉴스 배너군**.
8. **패싯 진입**(シーン・機能 / デザイン / エリア / ブランド).
9. **푸터**: 가이드·코퍼레이트·법적표시 링크군 + SP/PC 전환 + 카피라이트.
10. **쿠키 동의 바**.

## URL 문법 (공통) — company-rules 1항의 출처
- `c`=카테고리/브랜드, `r`=랭킹/리스트, `g`=상품, `e`=특집, `t`=토픽, `pages`=정적.
- `customer/`, `cart/`, `contact/`, `goods/search`.
- `?ismodesmartphone=on` SP 전환(Regal 푸터에서 확인).

## 사이트별 특징 (variant 근거)
### FEILER
- 글로벌내비 카테고리 아코디언 + LOVERARY 서브브랜드(`/shop/c/c20/`).
- 상품카드: NEW뱃지 + Quick view + ♡ + `¥N（税込）`.
- 랭킹을 카테고리별(핸카치/바그/포치) + LOVERARY로 분리.
- variant 축: 柄(패턴)·色·サイズ(핸카치 15~30cm).
- 사이드: CATEGORY / RECOMMEND / カラーから選ぶ(색칩) / 최근 본 상품.

### REGAL
- 글로벌내비 다층: カテゴリ(MENS/WOMENS/KIDS/GOODS/CARE) + ブランド(로고 그리드) + ニュース + もっと見る + コーポレート.
- **SALE 표기 확정 근거**: `¥9,900（税込）30%OFF ¥6,930（税込）` → 정가 취소선 + OFF% + 할인가.
- variant 축: **サイズ**(구두 필수), 상품코드에 색·사이즈 인코딩(`gF07PCCA____BL___220`).
- 패싯: シーン・機能 / デザイン(トウ形状) / ブランド.
- 결제수단 배너군(Amazon Pay/楽天/PayPay/d払い/Paidy…).

### DISCOVER WEST mall
- 글로벌내비 앵커형: `#block_globalnav_category`, `#block_globalnav_area` + `とじる`.
- 지역(エリア) 축 강함: 北陸/近畿/山陰/せとうち/九州(`/shop/c/c10~c50/`).
- 랭킹: 카테고리별 + **지역별** 이중.
- 캐러셀: 今売れた商品 / あなたへのおすすめ / 新着.
- variant 축: 식품 특성(のし·配送日·冷蔵冷凍·セット).
- 지연로딩 `img/usr/lazyloading.png` 전면 사용.

## variant 축 요약 (detail 템플릿 반영)
| 사이트 | 주 축 |
|---|---|
| FEILER | 柄 · 色 · サイズ |
| REGAL | サイズ(필수) · 色 |
| DW mall | セット内容 · のし · 配送温度帯 · 配送日 |

→ `variant-selector`는 축을 지시서에서 지정하는 범용 칩 구조로 설계함.
