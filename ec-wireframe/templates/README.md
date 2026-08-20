# templates — 共有テンプレートギャラリー

他の人が作ったワイヤーフレーム構成（`.wf.json`）をここに登録すると、ビルダーの **📁 テンプレート** 一覧から誰でも読み込めます。

## 新しいテンプレートの登録手順
1. ビルダーの **💾 構成保存** で受け取った `.wf.json` をこのフォルダ（`templates/`）に入れます。
2. （任意）ファイルの最上部に `name`、`desc` を追加すると一覧に表示されます。
   ```json
   { "name": "表示される名前", "desc": "説明", "pageType": "lp", "sections": [ ... ] }
   ```
   → `name`/`desc` はメタ情報であり、読み込む際は無視され、残り（pageType・sectionsなど）のみが適用されます。
3. ギャラリーインデックスを更新します:
   ```bash
   node build-gallery.mjs      # templates/*.wf.json → src/gallery.js
   ```
4. 公開ページに反映するには再ビルド後にコミット:
   ```bash
   node build-static.mjs
   git add templates src/gallery.js docs && git commit -m "chore: add template" && git push
   ```

## 注意
- テンプレートを読み込むと **現在の作業内容が置き換えられます**（ビルダーが警告を表示）。元に戻す（Ctrl+Z）で直前の構成に復旧は可能ですが、リロード時は自動保存が上書きされた状態が維持されます。
