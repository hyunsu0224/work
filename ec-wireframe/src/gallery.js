// 自動生成ファイル — templates/*.wf.json から build-gallery.mjs で生成される。直接編集禁止。
export const gallery = [
  {
    "id": "sample-lp-campaign",
    "name": "夏キャンペーンLP (サンプル)",
    "desc": "メインビジュアル・特徴・media-text・ランキング・お客様の声・FAQ・CTA を含む特集ページ見本",
    "state": {
      "lang": "ja",
      "device": "both",
      "pageType": "lp",
      "showNotes": true,
      "sections": [
        {
          "comp": "free-banner",
          "opts": {
            "height": "hero"
          },
          "comment": "メインビジュアル：夏の大型セール"
        },
        {
          "comp": "feature-cols",
          "opts": {
            "cols": 3,
            "title": "選ばれる3つの理由"
          },
          "comment": ""
        },
        {
          "comp": "media-text",
          "opts": {
            "imageSide": "right",
            "title": "新作コレクション",
            "desc": "今シーズン注目のアイテムをピックアップ。素材とディテールにこだわった逸品。",
            "cta": "アイテムを見る",
            "slides": 3,
            "anim": "fade"
          },
          "comment": "画像スライド3枚 + フェードイン"
        },
        {
          "comp": "media-text",
          "opts": {
            "imageSide": "left",
            "title": "数量限定セット",
            "desc": "人気アイテムをお得に揃えられる限定セット。期間・数量限定。",
            "cta": "詳しく見る",
            "slides": 1,
            "anim": "slide"
          },
          "comment": ""
        },
        {
          "comp": "carousel",
          "opts": {
            "title": "人気ランキング",
            "count": 6,
            "badge": true,
            "sale": true,
            "more": true
          },
          "comment": ""
        },
        {
          "comp": "voice",
          "opts": {
            "count": 3
          },
          "comment": ""
        },
        {
          "comp": "faq",
          "opts": {
            "count": 4
          },
          "comment": ""
        },
        {
          "comp": "cta-band",
          "opts": {
            "headline": "今すぐチェック",
            "cta": "セール会場へ"
          },
          "comment": ""
        }
      ]
    }
  },
  {
    "id": "sample-product-detail",
    "name": "商品詳細サンプル",
    "desc": "パンくず・ギャラリー・バリアント・レビュー・関連商品",
    "state": {
      "lang": "ja",
      "device": "both",
      "pageType": "detail",
      "showNotes": true,
      "sections": [
        {
          "comp": "breadcrumb",
          "opts": {},
          "comment": ""
        },
        {
          "comp": "detail-main",
          "opts": {
            "variant": "サイズ·カラー",
            "gallery": 5,
            "stickyCta": true,
            "instant": true
          },
          "comment": "SPは下部固定CTA推奨"
        },
        {
          "comp": "detail-desc",
          "opts": {},
          "comment": ""
        },
        {
          "comp": "review",
          "opts": {
            "count": 3
          },
          "comment": ""
        },
        {
          "comp": "related",
          "opts": {
            "count": 4
          },
          "comment": ""
        }
      ]
    }
  }
];
