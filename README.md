# 우리 아이 닌텐도 Guide

학부모가 아이 성향을 입력하면 닌텐도 스위치 타이틀을 추천하는 **정적** 웹사이트입니다.

## 온라인 (자동 배포)

푸시만 하면 GitHub Actions가 Vite로 빌드해 GitHub Pages에 올립니다.

- **Live:** <https://kidgame.mymallow.cloud/> (and <https://kidgame.mymallow.cloud/index.html>)
- **GitHub Pages (legacy path):** <https://jhjer010819.github.io/nintendo-kids-game-recommendations/> (custom domain preferred; build `base` is `/`)
- **Repo:** <https://github.com/jhjer010819/nintendo-kids-game-recommendations>

Pages → **Enforce HTTPS**를 켜 두면 `http://` 리다이렉트 이슈를 줄일 수 있습니다. `/`가 하얗게 보이면 강력 새로고침(캐시된 옛 HTML)을 하세요.

`main`에 푸시 → Actions → Deploy GitHub Pages → 약 1–2분 후 반영.

### 최초 1회 (Pages 소스)

GitHub 웹에서 아직 Pages가 안 켜져 있으면:

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → **Source** = **GitHub Actions**

(권한 있으면 Actions 워크플로가 첫 배포를 끝낸 뒤 URL이 활성화됩니다.)

## 로컬에서 미리보기

```bash
git clone https://github.com/jhjer010819/nintendo-kids-game-recommendations.git
cd nintendo-kids-game-recommendations
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

브라우저에서 <http://127.0.0.1:5173> 접속.

> 모듈(`import`)과 `fetch(.../data/games.json)`을 쓰므로 **파일 직접 열기(file://)는 안 됩니다.**

빌드(로컬에서 Pages와 같은 `base` 경로로 확인):

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 5173
```

미리보기는 <http://127.0.0.1:5173/> 입니다.

## 페이지 구성

- `/` — Track A 히어로(맞춤 찾기 CTA) + 스크롤 아래 Track B(알고리즘·가이드 링크·푸터)
- `/about.html` `/contact.html` `/privacy.html` `/terms.html` — 소개·문의·개인정보·이용약관
- `/games/<slug>.html` — 부모용 심층 가이드 12편
- 브랜드: **마이멜로 (MyMallow)** · 문의: contact@mymallow.cloud

예: <https://kidgame.mymallow.cloud/games/kirby-discovery.html>

## 파일 구성

```
.
  index.html                 # SPA 엔트리 (위저드)
  about.html / contact.html / privacy.html / terms.html
  games/*.html               # 심층 가이드 (Vite MPA)
  css/styles.css / css/seo-pages.css
  js/app.js / matching.js / site-paths.js
  public/data/games.json     # 편집 가능한 게임 카탈로그
  scripts/generate-static-pages.mjs
  vite.config.js             # base = / (custom domain kidgame.mymallow.cloud)
  public/CNAME               # kidgame.mymallow.cloud
  .github/workflows/deploy-pages.yml
```

## games.json에 타이틀 추가하기

`public/data/games.json`은 배열입니다. 객체를 하나 더 넣으면 됩니다. `main`에 푸시하면 Pages가 자동 갱신됩니다.

| 필드 | 설명 |
|------|------|
| `id` | 영문 고유 ID |
| `title` | 한국어 표시 제목 |
| `min_age` / `max_age` | 권장 만 나이 |
| `reading_level` | `0` 거의 불필요 · `1` 기초 · `2` 중급+ |
| `control_difficulty` | `"쉬움"` \| `"보통"` \| `"어려움"` |
| `frustration_friendly` | 실패해도 부담 적으면 `true` |
| `requires_motion` | 모션 필수면 `true` (Lite에서 제외) |
| `switch_1_supported` / `switch_2_supported` / `lite_ok` | 기기 호환 |
| `characters` | 예: `["마리오","mario"]` — 매칭용 키워드 |
| `play_styles` | `"decorating"` \| `"adventure"` \| `"sports"` \| `"puzzle"` \| `"body"` |
| `session_shape` | `"short_match"` 짧은 판 · `"stage"` 스테이지 · `"open_ended"` 자유 진행 |
| `mom_control.violence_level` | `"strict"` 싸움 없음 · `"cartoon"` 통통 튕김 · `"action"` 칼·무기 (피 없음) |
| `mom_control.save_type` | 결과 카드에만 보이는 저장 설명. 점수에는 쓰지 않음 |
| `mom_control.save_style` | 예전 필드. 점수에 쓰지 않음 |
| `mom_control.coop_types` | `["solo","helper","party"]` 일부 |
| `mom_control.*` 표시 문자열 | 엄마 안심 지수에 그대로 노출 |
| `summary` / `badge` / `image_emoji` | 카드 요약·뱃지·이모지 |

시드 데이터는 약 14개입니다. 나중에 ~100개로 교체해도 UI는 그대로입니다.

## 매칭 요약

1. **하드 필터**: Lite+모션, Switch 1에서 `switch_1_supported === false`(스위치 2 전용), 둘 다 미지원인 기기, 폭력 상한 초과, 연령·읽기 크게 불일치 → 제외
2. **소프트 점수**: 연령·읽기·조작·좌절·폭력·끝맺음·협동·하드웨어·캐릭터·플레이스타일 가중치 합산. 저장 방식(anytime/checkpoint)은 점수를 올리지 않습니다.
3. 읽기에서 `부모가 읽어줘요`는 유창(2)과 같이 보아, 글자를 모르는 선택과 달리 동물의 숲 같은 대사 게임을 빼지 않습니다.
4. 좌절에서 `어려워도 계속 도전`은 실패에 관대한 게임을 깎지 않고, 어려운 구간에만 작은 가산을 줍니다.
5. 일치도 `%` = score / max × 100 (최대 100). **35% 미만은 버림**. 상위 **최대 5개**만 표시 (부족하면 더 적게).

## 위저드 질문

1. 나이 / 글 읽기 / 조작 / 잘 안 풀릴 때
2. 싸움·폭력 연출 / 게임 끝맺음 / 같이 하기(복수) / 보유 기기
3. 캐릭터(복수, `없음`은 다른 캐릭터와 함께 고를 수 없고 빈 선택과 같은 중립 점수) / 플레이 스타일(복수)
