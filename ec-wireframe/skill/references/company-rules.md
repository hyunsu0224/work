# company-rules.md — 社内ルール (ecbeing 規約 & マッピング)

ワイヤーフレームにこのルールを埋め込んでおくと **後日の実装時にマッピングがほぼ自動**になる。
根拠データは `references/ec-reference-analysis.md`(Feiler·Regal·DW mall 実測)。

---

## 1. URL 文法 (ecbeing 共通)
| 種別 | パターン | ページテンプレート | 例 |
|---|---|---|---|
| Top | `/shop/default.aspx` | top | 全サイト同一 |
| カテゴリリスト | `/shop/c/c{code}/` | list | `/shop/c/c2010/` |
| ランキング/カテゴリリスト | `/shop/r/r{code}/` | list | `/shop/r/r1010/` |
| 商品詳細 | `/shop/g/g{code}/` | detail | `/shop/g/gJZ31…/` |
| 特集 | `/shop/e/e{code}/` | lp | `/shop/e/egift/` |
| ニュース/トピック | `/shop/t/t{code}/` | lp | `/shop/t/t1510/` |
| 静的自由ページ | `/shop/pages/{name}.aspx` | lp | `/shop/pages/guide.aspx` |
| マイページ/ログイン | `/shop/customer/menu.aspx` | mypage | — |
| 新規登録 | `/shop/customer/agree.aspx` など | — | サイト別に異なる |
| お気に入り | `/shop/customer/bookmark.aspx` | — | — |
| カート | `/shop/cart/cart.aspx` | cart | — |
| 検索 | `/shop/goods/search.aspx` · `search_condition.aspx` | — | — |
| お問い合わせ | `/shop/contact/contact.aspx` | lp | — |

> **ワイヤールール**: リンク href には上記の実際のパターンを入れる(`#` 禁止、コードは `{code}` プレースホルダー)。
> 例) カテゴリタイル → `/shop/c/c{code}/`。こうすれば実装時にコードだけ埋めればよい。

## 2. SP/PC 分岐
- **ブレイクポイント**: `768px`。未満=SP。
- ecbeing PC 基本幅: `meta-viewport: width=1200` → コンテナ max 1200px。
- **手動切替パラメータ**: `?ismodesmartphone=on` (フッターの SP/PC トグル)。ワイヤーのフッターに明示。
- ecbeing は SP/PC のマークアップが分離サービングされる場合がある(デバイス判定)。ワイヤーは単一 CSS で両方を表現するが、**分岐地点を `wf-note` でコメント**。

## 3. ランタイムメタ (実装参照用、ワイヤーにはコメントのみ)
```
meta-etm:page_type : top | category | goods | …   ← ページ種別判定
meta-etm:device    : desktop | smartphone
meta-etm:cart_item : []                            ← カートバッジのソース
meta-etm:attr      : {devicetype, login, …}
```
→ カートバッジ・ログイン状態・ページ種別はこの値から来る。ワイヤーでは `wf-note` で「ここに実装データバインディング」と表示。

## 4. クラスネーミング (ローファイ → 実装置換ルール)
- ワイヤーは全て `wf-*` プレフィックス(ローファイ専用、実装 CSS との衝突防止)。
- 実装時は以下の対応で置換(サイト別に確定後、この表を更新):

| ローファイ(wf-*) | ecbeing 実装候補(例) | 備考 |
|---|---|---|
| `wf-mega` (CATEGORY) | `#block_globalnav_category` | アンカー+`とじる` close |
| `wf-mega` (AREA/BRAND) | `#block_globalnav_area` | アンカー+`とじる` close |
| `wf-card` | 商品リストパーツ | プラットフォーム標準パーツ |
| `wf-box--img` (lazy) | `img[src=".../lazyloading.png"]` | 遅延ロードの慣例 |

> **重要**: 上記の候補は3社の観察に基づく推定。**実際のクラスは社内確定版に置き換え**、この表をサイト別に分岐(例: `company-rules.feiler.md`)することを推奨。

## 5. 共通 UI 慣例 (3社確認)
- メガメニュー close ラベル: `close` / `とじる`。
- 遅延ロード: `img/usr/lazyloading.png` プレースホルダー → ワイヤーでは `wf-box--img`。
- 価格表記: `¥12,100（税込）`、SALE は `定価 → NN%OFF → 割引価格`。
- クッキーバー: 下部固定 + 同意/承諾 ボタン(個人情報優先)。
- 商品カードバッジ: `NEW`, `SALE`, お気に入り ♡, Quick view。

## 6. アクセシビリティ/マークアップ基本
- ランドマーク: `header` / `nav` / `main` / `footer` を使用。
- 画像には意味のある `alt`(ワイヤーはラベルテキストで代替)。
- ドロワー/アコーディオンは `aria-expanded` を付与(実装時)。
