# 우리 아이 닌텐도 Guide

학부모가 아이 성향을 입력하면 닌텐도 스위치 타이틀을 추천하는 **정적** 웹사이트입니다.

## 로컬에서 미리보기

```bash
git clone https://github.com/jhjer010819/nintendo-kids-game-recommendations.git
cd nintendo-kids-game-recommendations
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

브라우저에서 <http://127.0.0.1:5173> 접속.

> 모듈(`import`)과 `fetch('./data/games.json')`을 쓰므로 **파일 직접 열기(file://)는 안 됩니다.**

빌드:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 5173
```

## 파일 구성

```
.
  index.html          # 엔트리
  css/styles.css      # Nintendo 레드/옐로/블루 테마
  js/app.js           # 랜딩 → 4스텝 위저드 → 결과 UI
  js/matching.js      # 점수·필터 알고리즘
  data/games.json     # 편집 가능한 게임 카탈로그
  package.json        # Vite 개발 서버
  vite.config.js
  README.md
```

## games.json에 타이틀 추가하기

`data/games.json`은 배열입니다. 객체를 하나 더 넣으면 됩니다.

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
| `play_styles` | `"decorating"` \| `"adventure"` \| `"sports"` |
| `mom_control.violence_level` | `"strict"` \| `"cartoon"` \| `"action"` |
| `mom_control.save_style` | `"anytime"` \| `"checkpoint"` |
| `mom_control.coop_types` | `["solo","helper","party"]` 일부 |
| `mom_control.*` 표시 문자열 | Mom-Safety Badge에 그대로 노출 |
| `summary` / `badge` / `image_emoji` | 카드 요약·뱃지·이모지 |

시드 데이터는 약 12개입니다. 나중에 ~100개로 교체해도 UI는 그대로입니다.

## 매칭 요약

1. **하드 필터**: Lite+모션, 기기 미지원, 폭력 상한 초과, 연령·읽기 크게 불일치 → 제외
2. **소프트 점수**: 연령·읽기·조작·좌절·폭력·저장·협동·하드웨어·캐릭터·플레이스타일 가중치 합산
3. 일치도 `%` = score / max × 100. **35% 미만은 버림**. 상위 **최대 5개**만 표시 (부족하면 더 적게).

## 위저드 질문 (고정)

1. 나이 / 읽기 / 조작 / 좌절
2. 폭력 / 저장 / 협동
3. 하드웨어 / TV·휴대
4. 캐릭터(복수) / 플레이 스타일
