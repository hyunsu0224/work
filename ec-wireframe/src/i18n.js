// i18n.js — 언어팩 (ko / ja)
// - ui.*   : 빌더 UI 크롬 라벨
// - note.* : 출력물의 wf-note 주석 텍스트  (KR/JP 버전의 실질 차이)
// - meta.* : 출력 문서 head 코멘트 / 프리뷰 바 문구
// EC 콘텐츠 라벨(カテゴリから探す 등)은 양 언어 공통으로 일본어 유지(일본 EC 사이트 대상).

export const LANGS = ["ko", "ja"];

export const i18n = {
  ko: {
    ui: {
      appTitle: "EC 와이어프레임 빌더",
      pageType: "페이지 유형",
      device: "표시 대상",
      language: "언어",
      addSection: "＋ 섹션 추가",
      sections: "섹션 구성",
      palette: "컴포넌트",
      preview: "미리보기",
      download: "⬇ HTML 다운로드",
      reset: "초기화",
      empty: "왼쪽에서 섹션을 추가하세요.",
      options: "옵션",
      moveUp: "위로",
      moveDown: "아래로",
      remove: "삭제",
      fixedNote: "header · footer · cookie-bar 는 전 페이지 공통으로 자동 포함됩니다.",
      confirmReset: "현재 구성을 페이지 기본 템플릿으로 되돌릴까요?",
    },
    pageTypes: {
      top: "TOP", list: "商品一覧 (LIST)", detail: "商品詳細 (DETAIL)",
      cart: "CART", mypage: "MYPAGE", lp: "LP / 特集",
    },
    devices: { both: "PC + SP", pc: "PC", sp: "SP" },
    meta: {
      previewBar: "WIREFRAME PREVIEW ／ page_type: {page} ／ 로우파이 · SP+PC(768px) · 브라우저 폭을 줄이면 SP 레이아웃으로 전환됩니다",
      docComment: "로우파이 와이어프레임 — {page} — 색/이미지 없는 회색박스 골격",
    },
  },
  ja: {
    ui: {
      appTitle: "EC ワイヤーフレーム ビルダー",
      pageType: "ページ種別",
      device: "表示対象",
      language: "言語",
      addSection: "＋ セクション追加",
      sections: "セクション構成",
      palette: "コンポーネント",
      preview: "プレビュー",
      download: "⬇ HTML ダウンロード",
      reset: "リセット",
      empty: "左からセクションを追加してください。",
      options: "オプション",
      moveUp: "上へ",
      moveDown: "下へ",
      remove: "削除",
      fixedNote: "header・footer・cookie-bar は全ページ共通で自動的に含まれます。",
      confirmReset: "現在の構成をページ標準テンプレートに戻しますか？",
    },
    pageTypes: {
      top: "TOP", list: "商品一覧 (LIST)", detail: "商品詳細 (DETAIL)",
      cart: "CART", mypage: "MYPAGE", lp: "LP / 特集",
    },
    devices: { both: "PC + SP", pc: "PC", sp: "SP" },
    meta: {
      previewBar: "WIREFRAME PREVIEW ／ page_type: {page} ／ ローファイ · SP+PC(768px) · ブラウザ幅を狭めるとSPレイアウトに切り替わります",
      docComment: "ローファイ・ワイヤーフレーム — {page} — 色/画像なしのグレーボックス骨格",
    },
  },
};

// 컴포넌트 라벨(팔레트/섹션 리스트) 및 wf-note 텍스트.
// note 값은 함수(opts)로 두어 옵션 반영(예: 슬라이드 매수)이 가능.
export const strings = {
  ko: {
    comp: {
      hero: "히어로 슬라이더", promo: "프로모 배너", "category-grid": "카테고리 그리드",
      topics: "특집 배너군", ranking: "랭킹 탭", "carousel": "상품 캐러셀",
      info: "인포·뉴스 리스트", breadcrumb: "빵부스러기", "page-title": "카테고리 타이틀",
      sortbar: "정렬 바", "list-body": "필터＋상품그리드", pagination: "페이지네이션",
      "detail-main": "상세 메인(갤러리＋구매)", "detail-desc": "상품 설명", "review": "리뷰",
      related: "관련 상품", "cart-steps": "스텝 인디케이터", "cart-items": "카트 아이템",
      "cart-summary": "금액 요약", "mypage-overview": "회원 개요", "mypage-menu": "메뉴 그리드",
      "free-banner": "자유 배너", "free-text": "자유 텍스트 블록",
    },
    note: {
      hero: (o) => `자동슬라이드 ${o.slides || 5}매${o.autoplay ? "" : "(자동재생 off)"} / 좌우화살표${o.indicator ? " · 인디케이터" : ""} / 스와이프(SP)`,
      "category-grid": (o) => `타일 링크 → /shop/c/c{code}/ · PC ${o.cols || 5}열 / SP 2열`,
      topics: (o) => `배너 타일 → /shop/e/e{code}/ · PC ${o.cols || 4}열 / SP 2열`,
      ranking: () => "탭 클릭 → 해당 캐러셀 전환 / 순위뱃지 ①②③",
      carousel: (o) => `${o.badge ? "NEW뱃지 on / " : ""}${o.sale ? "SALE(정가 취소선+OFF%) / " : ""}Quick view hover${o.more ? " / もっと見る" : ""}`,
      breadcrumb: () => "계층 위치 · 홈 > 카테고리 > 현재",
      sortbar: () => "정렬(신착/인기/가격) + 표시건수 + 뷰전환(그리드/리스트)",
      "list-body": (o) => `PC=좌측 필터 사이드 / SP=상단 絞り込み 드로어 · 상품 PC ${o.cols || 4}열 / SP 2열`,
      pagination: () => "번호형 / もっと見る(무한로드) 옵션",
      "detail-main": (o) => `SP=1단 세로 스택${o.stickyCta ? " · 하단 고정 cta" : ""} / variant=${o.variant || "사이즈·색"}`,
      review: () => "평점(★) + 리뷰 리스트 + 더보기",
      related: () => "이 상품을 본 사람은 / 관련상품 캐러셀",
      "cart-steps": () => "カート→情報入力→確認→完了",
      "mypage-menu": () => "注文履歴 / お気に入り / 会員情報 / 住所帳 …",
    },
  },
  ja: {
    comp: {
      hero: "ヒーロースライダー", promo: "プロモバナー", "category-grid": "カテゴリグリッド",
      topics: "特集バナー群", ranking: "ランキングタブ", "carousel": "商品カルーセル",
      info: "インフォ・ニュース", breadcrumb: "パンくず", "page-title": "カテゴリタイトル",
      sortbar: "ソートバー", "list-body": "フィルタ＋商品グリッド", pagination: "ページネーション",
      "detail-main": "詳細メイン(ギャラリー＋購入)", "detail-desc": "商品説明", "review": "レビュー",
      related: "関連商品", "cart-steps": "ステップインジケータ", "cart-items": "カートアイテム",
      "cart-summary": "金額サマリー", "mypage-overview": "会員概要", "mypage-menu": "メニューグリッド",
      "free-banner": "フリーバナー", "free-text": "フリーテキスト",
    },
    note: {
      hero: (o) => `自動スライド${o.slides || 5}枚${o.autoplay ? "" : "(自動再生off)"} / 左右矢印${o.indicator ? " · インジケータ" : ""} / スワイプ(SP)`,
      "category-grid": (o) => `タイルリンク → /shop/c/c{code}/ · PC ${o.cols || 5}列 / SP 2列`,
      topics: (o) => `バナータイル → /shop/e/e{code}/ · PC ${o.cols || 4}列 / SP 2列`,
      ranking: () => "タブクリック → カルーセル切替 / 順位バッジ ①②③",
      carousel: (o) => `${o.badge ? "NEWバッジon / " : ""}${o.sale ? "SALE(定価取消線+OFF%) / " : ""}Quick view hover${o.more ? " / もっと見る" : ""}`,
      breadcrumb: () => "階層位置 · ホーム > カテゴリ > 現在",
      sortbar: () => "並び替え(新着/人気/価格) + 表示件数 + 表示切替",
      "list-body": (o) => `PC=左フィルタサイド / SP=上部 絞り込みドロワー · 商品 PC ${o.cols || 4}列 / SP 2列`,
      pagination: () => "番号型 / もっと見る(無限ロード) オプション",
      "detail-main": (o) => `SP=1カラム縦スタック${o.stickyCta ? " · 下部固定cta" : ""} / variant=${o.variant || "サイズ·色"}`,
      review: () => "評価(★) + レビューリスト + もっと見る",
      related: () => "この商品を見た人は / 関連商品カルーセル",
      "cart-steps": () => "カート→情報入力→確認→完了",
      "mypage-menu": () => "注文履歴 / お気に入り / 会員情報 / 住所帳 …",
    },
  },
};

// {token} 치환 헬퍼
export function fmt(tpl, vars = {}) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}
