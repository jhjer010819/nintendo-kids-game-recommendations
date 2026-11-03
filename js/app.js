import { matchGames } from "./matching.js";
import { withBase, GUIDE_LINKS } from "./site-paths.js";

const STEPS = 4;

const state = {
  view: "landing", // landing | step | results
  step: 1,
  games: [],
  answers: {
    age: null,
    reading: null,
    control: null,
    frustration: null,
    violence: null,
    save_style: null,
    coop_mode: null,
    hardware: null,
    play_mode: [],
    characters: [],
    play_style: null,
  },
  results: [],
  modalGame: null,
};

const app = document.getElementById("app");

async function init() {
  app.innerHTML = `<div class="loading">게임 목록을 불러오는 중…</div>`;
  try {
    const gamesUrl = `${import.meta.env.BASE_URL}data/games.json`;
    const res = await fetch(gamesUrl);
    if (!res.ok) throw new Error("games.json load failed");
    state.games = await res.json();
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><p>게임 데이터를 불러오지 못했습니다.<br>public/data/games.json 경로를 확인해 주세요.</p></div>`;
    console.error(err);
    return;
  }
  render();
}

function render() {
  if (state.view === "landing") {
    app.innerHTML = renderLanding();
    bindLanding();
    return;
  }
  if (state.view === "results") {
    app.innerHTML = renderResults();
    bindResults();
    return;
  }
  app.innerHTML = renderStep(state.step);
  bindStep();
}

function renderLanding() {
  const guideLinks = GUIDE_LINKS.map(
    (g) =>
      `<li><a href="${withBase(`games/${g.slug}.html`)}">${g.title}</a></li>`,
  ).join("");

  return `
    <div class="landing-page">
      <section class="landing-hero" aria-label="시작">
        <div class="brand-mark" aria-hidden="true"><i class="fa-solid fa-gamepad"></i></div>
        <h1 class="brand-title">우리 아이 닌텐도 Guide</h1>
        <p class="brand-sub">아이 성향에 맞는 스위치 게임을 엄마·아빠와 함께 골라 보세요.</p>
        <button type="button" class="btn btn-primary" id="btn-start">
          아이 맞춤 게임 찾기 <i class="fa-solid fa-arrow-right"></i>
        </button>
      </section>

      <section class="landing-below" aria-label="가이드 정보">
        <div class="soft-divider" role="presentation">아래 내용은 천천히 읽어 보세요</div>

        <div class="quiet-block">
          <h2>마이멜로 닌텐도 추천 알고리즘 소개</h2>
          <div class="quiet-accordion">
            <details>
              <summary>4가지 핵심 요인</summary>
              <div class="acc-body">
                <ol>
                  <li><strong>발달 눈높이</strong> — 연령·읽기·조작이 게임 난이도와 맞는지</li>
                  <li><strong>정서 안전</strong> — 실패·폭력·자극이 가정 허용 범위 안인지</li>
                  <li><strong>함께 놀이</strong> — 솔로·헬퍼·파티 중 집에 맞는 협동 형태</li>
                  <li><strong>기기 현실</strong> — Switch / Lite / Switch 2·모션·TV·휴대</li>
                </ol>
              </div>
            </details>
            <details>
              <summary>컨트롤러 숙련 LV1–LV4 기준표</summary>
              <div class="acc-body">
                <table class="criteria-table">
                  <thead>
                    <tr><th>레벨</th><th>기준</th></tr>
                  </thead>
                  <tbody>
                    <tr><th>LV1</th><td>버튼 1~2개·모션 위주. 시점 조작 거의 없음.</td></tr>
                    <tr><th>LV2</th><td>기본 이동 + 점프/액션. 2D 스테이지 따라가기.</td></tr>
                    <tr><th>LV3</th><td>자이로·카메라 보조 가능. 간단한 3D 탐험.</td></tr>
                    <tr><th>LV4</th><td>자유 시점·복합 커맨드·실시간 대전 가능.</td></tr>
                  </tbody>
                </table>
                <p>위저드의 ‘서투름/보통/능숙’은 위 레벨을 가정용으로 단순화한 입력입니다.</p>
              </div>
            </details>
            <details>
              <summary>아이 성향별 짧은 사례</summary>
              <div class="acc-body">
                <ul class="case-list">
                  <li><strong>글자 모르고 쉽게 포기</strong> — 음성·그림 위주 + 실패 부담 낮은 입문 플랫포머부터.</li>
                  <li><strong>꾸미기·수집을 좋아함</strong> — 생활·꾸미기형과 낮은 폭력 허용을 함께 맞춥니다.</li>
                  <li><strong>형제와 한 화면</strong> — 로컬 파티·헬퍼 지원 타이틀을 우선 점수로 올립니다.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>

        <div class="quiet-block">
          <h2>인기 닌텐도 게임 부모용 심층 가이드</h2>
          <p>구매 전에 연령·조작·안심 포인트를 짧게 정리한 마이멜로 가이드입니다.</p>
          <ul class="guide-link-list">
            ${guideLinks}
          </ul>
        </div>

        <footer class="site-footer quiet-footer">
          <nav aria-label="푸터">
            <a href="${withBase("about.html")}">About</a>
            <a href="${withBase("contact.html")}">Contact</a>
            <a href="${withBase("privacy.html")}">Privacy Policy</a>
          </nav>
          <p class="footer-note">마이멜로 (MyMallow) · 학부모용 닌텐도 추천 가이드</p>
        </footer>
      </section>
    </div>
  `;
}

function bindLanding() {
  document.getElementById("btn-start")?.addEventListener("click", () => {
    resetAnswers();
    state.view = "step";
    state.step = 1;
    render();
  });
}

function progressPct(step) {
  return Math.round((step / STEPS) * 100);
}

function renderStep(step) {
  const bodies = {
    1: step1Html(),
    2: step2Html(),
    3: step3Html(),
    4: step4Html(),
  };
  const headers = {
    1: "아이 기본 정보 & 발달 단계",
    2: "안심·플레이 조건",
    3: "기기 & 화면",
    4: "취향 고르기",
  };
  const titles = {
    1: "👶 아이의 연령과 조작 숙련도는 어떤가요?",
    2: "안심·플레이 조건",
    3: "기기 & 화면",
    4: "취향 고르기",
  };
  const descs = {
    1: "아이의 눈높이에 꼭 맞는 게임을 찾기 위한 기본 질문입니다.",
    2: "폭력·저장·함께 하기 방식을 고릅니다.",
    3: "가지고 있는 기기와 플레이 환경을 선택하세요.",
    4: "좋아하는 캐릭터와 플레이 스타일을 골라 주세요.",
  };

  return `
    <div class="wizard-shell">
      <div class="progress-wrap">
        <div class="step-header-row">
          <span class="step-pill">STEP ${step} OF ${STEPS}</span>
          <span class="step-header-title">${headers[step]}</span>
          <span class="step-header-pct">${progressPct(step)}%</span>
        </div>
        <div class="progress-track" role="progressbar" aria-valuenow="${progressPct(step)}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width:${progressPct(step)}%"></div>
        </div>
      </div>
      <section class="step-panel step-${step}">
        <h2 class="step-title">${titles[step]}</h2>
        <p class="step-desc">${descs[step]}</p>
        ${bodies[step]}
        <div class="nav-row">
          <button type="button" class="btn btn-ghost" id="btn-back">${step === 1 ? "처음으로" : "이전"}</button>
          <button type="button" class="btn btn-primary" id="btn-next" ${canProceed(step) ? "" : "disabled"}>
            ${step === STEPS ? "결과 보기" : "다음"} <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>
    </div>
  `;
}

function optBtn(group, value, label, hint, emoji, selected) {
  return `
    <button type="button" class="opt ${selected ? "selected" : ""}" data-group="${group}" data-value="${value}" aria-pressed="${selected}">
      ${emoji ? `<span class="opt-emoji">${emoji}</span>` : ""}
      <span class="opt-text">${label}</span>
      ${hint ? `<span class="opt-hint">${hint}</span>` : ""}
    </button>
  `;
}

function step1Html() {
  const a = state.answers;
  return `
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-cake-candles"></i>나이 (만)</span>
      <div class="option-grid cols-4">
        ${optBtn("age", "3-4", "만 3~4세", "유아", "🐣", a.age === "3-4")}
        ${optBtn("age", "5-7", "만 5~7세", "미취학", "🧒", a.age === "5-7")}
        ${optBtn("age", "8-10", "만 8~10세", "초등 저학년", "🎒", a.age === "8-10")}
        ${optBtn("age", "11+", "만 11세 이상", "초등고학년", "🧑", a.age === "11+")}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-book-open"></i>읽기 수준</span>
      <div class="option-grid cols-3">
        ${optBtn("reading", "none", "글자모름", "음성과 그림 위주 플레이 필요", "🙈", a.reading === "none")}
        ${optBtn("reading", "basic", "기초", "쉬운 단어 읽기 가능", "📖", a.reading === "basic")}
        ${optBtn("reading", "fluent", "유창", "스토리형 대사 이해 가능", "📚", a.reading === "fluent")}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-gamepad"></i>컨트롤러 조작 능력</span>
      <div class="option-grid cols-3">
        ${optBtn("control", "beginner", "서투름", "버튼 1~2개 누르기, 모션 조작위주", "🤚", a.control === "beginner")}
        ${optBtn("control", "average", "보통", "기본 이동 및 자이로, 버튼 조작 가능", "👍", a.control === "average")}
        ${optBtn("control", "skilled", "능숙", "3D 자유 시점 및 복잡한 커맨드 조작 가능", "🕹️", a.control === "skilled")}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-face-dizzy"></i>게임 실패 시 좌절 저항력</span>
      <div class="option-grid cols-3">
        ${optBtn("frustration", "easy_quit", "쉽게포기", "자주 죽거나 실패하면 떼를 쓰거나 포기함", "💧", a.frustration === "easy_quit")}
        ${optBtn("frustration", "normal", "보통", "쉬운 보상이 있으면 재도전함", "🙂", a.frustration === "normal")}
        ${optBtn("frustration", "persistent", "끈기있음", "어려운 과제도 성취감을 느끼며 반복 도전", "💪", a.frustration === "persistent")}
      </div>
    </div>
  `;
}

function step2Html() {
  const a = state.answers;
  return `
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-shield-heart"></i>폭력·자극 허용</span>
      <div class="option-grid cols-3">
        ${optBtn("violence", "strict", "완전 금지", "무해한 것만", "🛡️", a.violence === "strict")}
        ${optBtn("violence", "cartoon", "만화 수준", "귀여운 액션 OK", "✨", a.violence === "cartoon")}
        ${optBtn("violence", "action", "액션 OK", "가벼운 전투 허용", "⚔️", a.violence === "action")}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-floppy-disk"></i>저장 방식 선호</span>
      <div class="option-grid">
        ${optBtn("save_style", "anytime", "수시 저장", "언제든 저장되면 좋아요", "💾", a.save_style === "anytime")}
        ${optBtn("save_style", "checkpoint", "체크포인트", "스테이지 단위도 OK", "🏁", a.save_style === "checkpoint")}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-people-group"></i>함께 하는 방식</span>
      <div class="option-grid cols-3">
        ${optBtn("coop_mode", "solo", "혼자", "아이 단독 플레이", "👤", a.coop_mode === "solo")}
        ${optBtn("coop_mode", "helper", "부모 도움", "어시스트·동반", "🤝", a.coop_mode === "helper")}
        ${optBtn("coop_mode", "party", "파티", "가족 다 같이", "🎉", a.coop_mode === "party")}
      </div>
    </div>
  `;
}

function step3Html() {
  const a = state.answers;
  const modes = a.play_mode || [];
  return `
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-microchip"></i>보유 하드웨어</span>
      <div class="option-grid cols-3">
        ${optBtn("hardware", "switch1", "Switch", "OLED/일반", "🟥", a.hardware === "switch1")}
        ${optBtn("hardware", "switch2", "Switch 2", "차세대", "🟦", a.hardware === "switch2")}
        ${optBtn("hardware", "lite", "Switch Lite", "휴대 전용", "🟨", a.hardware === "lite")}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-tv"></i>플레이 화면 (복수 선택)</span>
      <div class="option-grid">
        ${optBtn("play_mode", "tv", "TV 모드", "독에 꽂아 TV", "📺", modes.includes("tv"))}
        ${optBtn("play_mode", "handheld", "휴대 모드", "들고 다니며", "📱", modes.includes("handheld"))}
      </div>
    </div>
  `;
}

function step4Html() {
  const a = state.answers;
  const chars = a.characters || [];
  return `
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-star"></i>좋아하는 캐릭터 (복수 선택)</span>
      <div class="option-grid">
        ${optBtn("characters", "mario", "마리오", "요시·친구들", "🍄", chars.includes("mario"))}
        ${optBtn("characters", "kirby", "커비", "별의 커비", "⭐", chars.includes("kirby"))}
        ${optBtn("characters", "pokemon", "포켓몬", "피카츄 등", "⚡", chars.includes("pokemon"))}
        ${optBtn("characters", "animal", "동물의 숲", "주민들과", "🏝️", chars.includes("animal"))}
      </div>
    </div>
    <div class="field">
      <span class="field-label"><i class="fa-solid fa-heart"></i>플레이 스타일</span>
      <div class="option-grid cols-3">
        ${optBtn("play_style", "decorating", "꾸미기", "수집·생활", "🏡", a.play_style === "decorating")}
        ${optBtn("play_style", "adventure", "모험", "탐험·스테이지", "🗺️", a.play_style === "adventure")}
        ${optBtn("play_style", "sports", "스포츠·대결", "짧은 한 판", "🏆", a.play_style === "sports")}
      </div>
    </div>
  `;
}

function canProceed(step) {
  const a = state.answers;
  if (step === 1) return a.age && a.reading && a.control && a.frustration;
  if (step === 2) return a.violence && a.save_style && a.coop_mode;
  if (step === 3) return a.hardware && (a.play_mode?.length > 0);
  if (step === 4) return (a.characters?.length > 0) && a.play_style;
  return false;
}

function bindStep() {
  app.querySelectorAll(".opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      toggleAnswer(group, value);
      syncOptionUI(group);
      syncNextButton();
    });
  });

  document.getElementById("btn-back")?.addEventListener("click", () => {
    if (state.step === 1) {
      state.view = "landing";
      render();
      return;
    }
    state.step -= 1;
    render();
  });

  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (!canProceed(state.step)) return;
    if (state.step === STEPS) {
      state.results = matchGames(state.games, state.answers);
      state.view = "results";
      render();
      return;
    }
    state.step += 1;
    render();
  });
}

function toggleAnswer(group, value) {
  if (group === "play_mode" || group === "characters") {
    const arr = state.answers[group] || [];
    const i = arr.indexOf(value);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(value);
    state.answers[group] = arr;
    return;
  }
  state.answers[group] = value;
}

/** Update selected classes without remounting the step (keeps scroll/click targets stable). */
function syncOptionUI(group) {
  const multi = group === "play_mode" || group === "characters";
  const current = state.answers[group];
  app.querySelectorAll(`.opt[data-group="${group}"]`).forEach((btn) => {
    const on = multi
      ? Array.isArray(current) && current.includes(btn.dataset.value)
      : current === btn.dataset.value;
    btn.classList.toggle("selected", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function syncNextButton() {
  const next = document.getElementById("btn-next");
  if (!next) return;
  next.disabled = !canProceed(state.step);
}

function momBadgeHtml(game, compact = false) {
  const m = game.mom_control || {};
  return `
    <div class="mom-badge" aria-label="Mom-Safety Badge">
      <div class="mom-badge-title"><i class="fa-solid fa-shield-heart"></i> Mom-Safety Badge</div>
      <div class="mom-chip"><i class="fa-solid fa-book"></i>읽기 ${readingLabel(game.reading_level)}</div>
      <div class="mom-chip"><i class="fa-solid fa-floppy-disk"></i>${m.save_type || "—"}</div>
      <div class="mom-chip"><i class="fa-solid fa-shield"></i>${m.violence || "—"}</div>
      <div class="mom-chip"><i class="fa-solid fa-people-group"></i>${compact ? shortCoop(m.coop_support) : (m.coop_support || "—")}</div>
    </div>
  `;
}

function readingLabel(level) {
  if (level <= 0) return "거의 불필요";
  if (level === 1) return "기초";
  return "중급+";
}

function shortCoop(text) {
  if (!text) return "—";
  return text.length > 18 ? text.slice(0, 17) + "…" : text;
}

function renderResults() {
  const list = state.results;
  if (!list.length) {
    return `
      <div class="results-header">
        <h1>추천 결과</h1>
        <p>조건에 맞는 게임이 충분하지 않아요.</p>
      </div>
      <div class="empty-state">
        <p>조건을 조금 완화해 다시 시도해 보세요.</p>
      </div>
      <div class="results-actions">
        <button type="button" class="btn btn-secondary" id="btn-reset">조건 다시 설정</button>
      </div>
      ${state.modalGame ? renderModal(state.modalGame) : ""}
    `;
  }

  const cards = list
    .map((item, idx) => {
      const g = item.game;
      return `
        <button type="button" class="result-card" data-id="${g.id}" style="animation-delay:${idx * 0.05}s">
          <div class="result-emoji" aria-hidden="true">${g.image_emoji || "🎮"}</div>
          <div class="result-body">
            <span class="result-rank">TOP ${idx + 1}${g.badge ? ` · ${g.badge}` : ""}</span>
            <h3 class="result-title">${escapeHtml(g.title)}</h3>
            <p class="result-summary">${escapeHtml(g.summary || "")}</p>
            ${momBadgeHtml(g, true)}
          </div>
          <div class="match-pill" title="일치도">
            <span class="pct">${item.matchPct}%</span>
            <span class="lbl">일치</span>
          </div>
        </button>
      `;
    })
    .join("");

  return `
    <div class="results-header">
      <h1>우리 아이에게 맞는 게임</h1>
      <p>일치도 높은 순 · 상위 ${list.length}개</p>
    </div>
    <div class="results-list">${cards}</div>
    <div class="results-actions">
      <button type="button" class="btn btn-secondary" id="btn-reset">조건 다시 설정</button>
    </div>
    ${state.modalGame ? renderModal(state.modalGame) : ""}
  `;
}

function renderModal(game) {
  const item = state.results.find((r) => r.game.id === game.id);
  const pct = item?.matchPct ?? "—";
  return `
    <div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal">
        <div class="modal-top">
          <div class="result-emoji">${game.image_emoji || "🎮"}</div>
          <div>
            ${game.badge ? `<span class="modal-badge">${escapeHtml(game.badge)}</span>` : ""}
            <h2 id="modal-title">${escapeHtml(game.title)}</h2>
            <div class="match-pill" style="display:inline-flex;flex-direction:row;gap:0.35rem;padding:0.35rem 0.65rem;margin-top:0.35rem">
              <span class="pct">${pct}%</span>
              <span class="lbl">일치</span>
            </div>
          </div>
        </div>
        <p>${escapeHtml(game.summary || "")}</p>
        ${momBadgeHtml(game, false)}
        <ul style="margin:0 0 1rem;padding-left:1.1rem;font-size:0.85rem;color:var(--muted);font-weight:600;line-height:1.6">
          <li>권장 연령: 만 ${game.min_age}${game.max_age && game.max_age < 99 ? `–${game.max_age}` : "+"}세</li>
          <li>조작: ${escapeHtml(game.control_difficulty || "—")}</li>
          <li>모션 필요: ${game.requires_motion ? "예" : "아니오"}</li>
          <li>Lite: ${game.lite_ok ? "가능" : "비권장/불가"}</li>
        </ul>
        <button type="button" class="btn btn-primary modal-close" id="btn-modal-close">닫기</button>
      </div>
    </div>
  `;
}

function bindResults() {
  document.getElementById("btn-reset")?.addEventListener("click", () => {
    resetAnswers();
    state.view = "landing";
    state.modalGame = null;
    render();
  });

  app.querySelectorAll(".result-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const found = state.results.find((r) => r.game.id === id);
      if (found) {
        state.modalGame = found.game;
        render();
      }
    });
  });

  document.getElementById("btn-modal-close")?.addEventListener("click", () => {
    state.modalGame = null;
    render();
  });
  document.getElementById("modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") {
      state.modalGame = null;
      render();
    }
  });
}

function resetAnswers() {
  state.answers = {
    age: null,
    reading: null,
    control: null,
    frustration: null,
    violence: null,
    save_style: null,
    coop_mode: null,
    hardware: null,
    play_mode: [],
    characters: [],
    play_style: null,
  };
  state.results = [];
  state.step = 1;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
