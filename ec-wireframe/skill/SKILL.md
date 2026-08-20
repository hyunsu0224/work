---
name: ec-wireframe-generator
description: ecbeing プラットフォームの EC サイトのローファイ ワイヤーフレーム（グレーボックス、HTML）をコンポーネント組み立て方式で作成する。ユーザーが「ワイヤーフレーム」「ワイヤーフレーム」「wireframe」「画面設計」「ページ構成/設計」「top/一覧/詳細 ページの骨格」「画面の骨組み」を作成または検討しようとするときに必ず使用する。EC サイトの top・商品一覧・商品詳細・cart・mypage・LP などのページ構造を組んだり、社内ルール（ecbeing URL 文法・クラスネーミング）を守った再利用可能なマークアップ骨格が必要なとき、あるいは後日の実装マッピングを見据えた画面設計が必要なときに幅広く発動する。「とりあえずざっくり画面を描いて」のような曖昧な依頼でも EC/ショッピングページの文脈であればこのスキルを使う。
---

# EC Wireframe Generator

ecbeing プラットフォームの EC サイトの **ローファイ ワイヤーフレーム**を作る。
コンポーネント辞書からブロックを取り出し → ページテンプレートの順序で組み立て → 社内ルール（URL/ネーミング）を埋め込む。
目的は二つ: (1) 構造・配置の素早い検証、(2) **後日の実装マッピングの下絵**。

## 成果物ルール (固定)
- **忠実度**: ローファイのグレーボックスのみ。実際の色・画像・フォントは入れない。画像の場所は `wf-box--img`（斜線）。
- **形式**: HTML レンダリング（単一の `.html` ファイル、`wireframe.css` リンクまたはインライン）。
- **対応**: SP + PC 両方。ブレイクポイント 768px。分岐地点は `wf-note` コメント。
- **コメント**: 各要素の動作・オプションは `<span class="wf-note">…</span>` で画面に明示（例: 「hover→メガメニュー」）。
- **リンク**: href に ecbeing の実際の URL パターン（`/shop/c/c{code}/` など）を使用。`#` の乱用禁止。

## ワークフロー
1. **ページ種別の確定** — top / list / detail / cart / mypage / lp から選択。
   → `references/page-templates.md` から該当種別の標準セクションをロード。
2. **セクション構成の確定** — 必須セクション + オプションセクションの取捨。順序調整。
3. **ブロックごとのオプション指定** — 各セクションを `references/components.md` のコンポーネントで埋め、オプションフラグを設定。
4. **社内ルール適用** — `references/company-rules.md` で URL・ネーミング・SP分岐・メタコメントを埋め込む。
5. **組み立て・レンダー** — `assets/base-header.html` + `assets/base-footer.html` + 本文。`assets/wireframe.css` を適用。
6. **検討・修正** — SP/PC 確認、インタラクション（hover・ドロワー・アコーディオン）の動作確認。

## 入力(指示書) 最小形式
```
ページ: <top | list | detail | cart | mypage | lp>
対象: <SP | PC | both>
セクション:
  1. <コンポーネント>  オプション: [...]
  2. <コンポーネント>  オプション: [...]
備考: <社内ルール例外 / 特記事項>
```
指示書が短くてもページテンプレートの必須セクションは自動的に含め、曖昧な場合はオプションをデフォルト値で埋めたうえでコメントに表記する。

## 参照ファイル (いつ読むか)
- `references/page-templates.md` — **1段階**。ページ種別ごとのセクション順序。
- `references/components.md` — **3段階**。ブロック構成・状態・オプション。
- `references/company-rules.md` — **4段階**。URL 文法・ネーミング・SP分岐・マッピング表。実装連携の要。
- `references/ec-reference-analysis.md` — 新規コンポーネント/サイト別 variant が必要なとき。3社の実測根拠。

## assets
- `assets/wireframe.css` — ローファイのグレーボックスシステム（全ページリンク）。
- `assets/base-header.html` — ヘッダー（PC メガメニュー hover + SP ドロワー slide-in、JS 含む）。
- `assets/base-footer.html` — フッター（リンク群 + SP/PC切替 + クッキーバー）。

## マッピング(実装連携) 原則
- ローファイは `wf-*` クラスで作成 → 実装 CSS と衝突なし。
- `company-rules.md` の置換表で `wf-*` → ecbeing 実クラスに対応。
- サイト別に実クラスが異なる場合は `company-rules.<site>.md` で分岐を推奨（例: feiler/regal/dwmall）。

## 新規サイトのオンボーディング
公開 top URL を受け取ったら: (1) fetch → 構造抽出、(2) `ec-reference-analysis.md` に事例追加、
(3) サイト別 variant 軸・URL コード体系・実クラスを `company-rules.<site>.md` で分岐。
