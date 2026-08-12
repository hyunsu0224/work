# templates — 공유 템플릿 갤러리

다른 사람이 만든 와이어프레임 구성(`.wf.json`)을 여기에 등록하면, 빌더의 **📁 템플릿** 목록에서 누구나 불러올 수 있습니다.

## 새 템플릿 등록 절차
1. 빌더에서 **💾 구성 저장**으로 받은 `.wf.json`을 이 폴더(`templates/`)에 넣습니다.
2. (선택) 파일 최상단에 `name`, `desc`를 추가하면 목록에 표시됩니다.
   ```json
   { "name": "표시될 이름", "desc": "설명", "pageType": "lp", "sections": [ ... ] }
   ```
   → `name`/`desc`는 메타 정보이며, 불러올 때는 무시되고 나머지(pageType·sections 등)만 적용됩니다.
3. 갤러리 인덱스를 갱신합니다:
   ```bash
   node build-gallery.mjs      # templates/*.wf.json → src/gallery.js
   ```
4. 공개 페이지에 반영하려면 재빌드 후 커밋:
   ```bash
   node build-static.mjs
   git add templates src/gallery.js docs && git commit -m "chore: add template" && git push
   ```

## 주의
- 템플릿을 불러오면 **현재 작업 내용이 대체**됩니다(빌더가 경고를 표시). 되돌리기(Ctrl+Z)로 직전 구성으로 복구는 가능하지만, 새로고침 시 자동저장이 덮어써진 상태가 유지됩니다.
