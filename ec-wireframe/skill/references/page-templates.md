# page-templates.md — ページテンプレート

「このページ種別はこれらのセクションがこの順序で来る」の標準。ページ種別を選ぶだけで骨格が敷かれる。
各セクションは `components.md` のブロックで埋める。`[必須]`/`[オプション]` 表記。

> 全ページ共通: **header(base-header.html) → 本文 → footer(base-footer.html) → cookie-bar**。
> ecbeing URL 種別のマッピングは `company-rules.md` 参照。

---

## TOP (`/shop/default.aspx`, `page_type: top`)
1. `[必須]` hero-slider — シーズン/キャンペーンビジュアル
2. `[オプション]` 会員特典/決済 プロモバナー (2~3列)
3. `[必須]` category-grid — カテゴリから探す
4. `[オプション]` topics-banner — 特集/読み物
5. `[必須]` ranking-tab — カテゴリ・性別ごとのランキング
6. `[必須]` product-carousel — 新着/おすすめ/今売れた (1~3ブロック)
7. `[オプション]` area/brand ナビ (食品=地域 / 雑貨=ブランド)
8. `[オプション]` scene·design 検索導線(ファセット)
9. `[オプション]` info-list — INFORMATION
10. `[オプション]` SNS/Instagram · members プロモ · 決済手段バナー

## 商品一覧 / LIST (`/shop/c/cXXXX/`, `/shop/r/rXXXX/`)
1. `[必須]` breadcrumb
2. `[必須]` カテゴリタイトル + 件数
3. `[オプション]` カテゴリ説明 / サブカテゴリチップ
4. `[必須]` sort-bar (並べ替え + 表示件数 + ビュー切替)
5. `[必須]` filter (PC=左サイド / SP=上部 絞り込み ドロワー)
6. `[必須]` product-grid (PC 3~4列 / SP 2列)
7. `[必須]` pagination
8. `[オプション]` 下部 category-grid / 関連特集

## 商品詳細 / DETAIL (`/shop/g/gXXXX/`)
1. `[必須]` breadcrumb
2. `[必須]` 2カラムレイアウト: 左 gallery / 右 商品情報
   - 右側: ブランド · 商品名 · 価格(税込, SALE) · variant-selector · 数量 · cta(カート) · サブcta(お気に入り/即時購入)
   - `[オプション]` 在庫/配送/納期、クーポン、決済アイコン
3. `[必須]` 商品詳細説明(スペック表 + 画像本文)
4. `[オプション]` サイズガイド / 素材 / お手入れ
5. `[オプション]` レビュー(評点 + リスト)
6. `[必須]` 関連商品 / この商品を見た人は (product-carousel)
7. `[オプション]` 最近見た商品

> SP: 詳細は1カラムの縦スタック。cta を下部固定バーに出すオプションを推奨(`sticky-cta`)。

## CART (`/shop/cart/cart.aspx`)
1. `[必須]` ステップインジケーター (カート→情報入力→確認→完了)
2. `[必須]` カートアイテムリスト(サムネイル·名·数量·価格·削除)
3. `[必須]` 金額サマリー(小計/送料/合計) + レジに進む cta
4. `[オプション]` クーポン/ポイント、おすすめ追加、継続購入

## MYPAGE (`/shop/customer/menu.aspx`)
1. `[必須]` 会員概要(氏名/ポイント/ランク)
2. `[必須]` メニューグリッド(注文履歴/お気に入り/会員情報/住所帳 …)
3. `[オプション]` おすすめ / 最近見た商品

## LP / FREEPAGE (`/shop/pages/*.aspx`, `/shop/e/eXXXX/`)
- 自由構成。header/footer のみ共通。本文は topics-banner + product-carousel + 自由セクションの組み合わせ。
- 特集(e)=商品連動型 / 静的(pages)=コンテンツ型。

---

## 指示書 最小形式 (3層入力)
```
ページ: <top | list | detail | cart | mypage | lp>
対象: <SP | PC | both>
セクション:
  1. <コンポーネント>  オプション: [...]
  2. <コンポーネント>  オプション: [...]
備考: <特記事項 / 社内ルール例外>
```
