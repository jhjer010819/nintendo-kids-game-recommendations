import { matchGames, READING_RANK, CONTROL_RANK, CONTROL_GAME, VIOLENCE_RANK, SESSION_RANK } from "./matching.js";
import { withBase, GUIDE_LINKS } from "./site-paths.js";

const STEP_COUNT = 3;

const guideByTitle = new Map(GUIDE_LINKS.map((g) => [g.title, g.slug]));

const WIZARD = [
  {
    id: 1,
    kicker: "아이 정보",
    seconds: "약 30초",
    title: "우리 아이는 어떤가요?",
    desc: "평소 모습에 가장 가까운 걸 골라주세요. 고르면 어떤 기준으로 찾는지 바로 보여드려요.",
    nextReady: "다음 · 안심 조건 고르기 →",
    groups: [
      {
        id: "age",
        title: "나이",
        missing: "나이",
        options: [
          { value: "3-4", label: "만 3~4세", summary: "만 3~4세", hint: "글과 규칙이 거의 없는, 짧은 판으로 끝나는 게임 위주로 골라요." },
          { value: "5-7", label: "만 5~7세", summary: "만 5~7세", hint: "실패해도 금방 다시 시작되는 게임 위주로 골라요." },
          { value: "8-10", label: "만 8~10세", summary: "만 8~10세", hint: "규칙을 조금 따라가면 되는 게임 위주로 골라요." },
          { value: "11+", label: "만 11세 이상", summary: "만 11세 이상", hint: "스토리와 목표를 따라가는 게임까지 포함해 골라요." },
        ],
      },
      {
        id: "reading",
        title: "글 읽기",
        missing: "글 읽기",
        options: [
          { value: "none", label: "글자 몰라요", summary: "글자 모름", hint: "음성·그림만으로 진행되는 게임 위주로 골라요." },
          { value: "basic", label: "쉬운 단어 OK", summary: "쉬운 글", hint: "짧은 안내 문구 정도면 되는 게임 위주로 골라요." },
          { value: "fluent", label: "대사도 술술", summary: "대사도 OK", hint: "스토리 대사가 있는 게임까지 포함해 골라요." },
          { value: "parent", label: "부모가 읽어줘요", summary: "부모가 읽어줌", hint: "글은 부모가 읽어 주는 전제로, 대사가 있는 게임도 빼지 않아요." },
        ],
      },
      {
        id: "control",
        title: "컨트롤러 다루기",
        missing: "컨트롤러",
        help: "버튼만 누르는지, 캐릭터를 움직여 점프하는지, 화면 방향까지 직접 돌리는지 보면 돼요. 집에서 가장 자주 보이는 쪽에 가깝게 고르세요.",
        options: [
          { value: "beginner", label: "버튼 한두 개", summary: "버튼 위주", hint: "버튼 한두 개와 흔들기로 되는 게임 위주로 골라요." },
          { value: "average", label: "이동·점프", summary: "이동·점프", hint: "2D 위주에, 카메라가 알아서 따라오는 3D까지 골라요." },
          { value: "skilled", label: "3D 자유롭게", summary: "3D", hint: "화면을 직접 돌리고 버튼을 여러 개 쓰는 게임까지 포함해요." },
        ],
      },
      {
        id: "frustration",
        title: "잘 안 풀릴 때 우리 아이는?",
        missing: "졌을 때 반응",
        layout: "stack",
        options: [
          { value: "easy_quit", label: "속상해서 쉬고 싶어해요", summary: "실패에 민감", hint: "떨어져도 그 자리에서 바로 이어지는 게임 위주로 골라요." },
          { value: "normal", label: "다독이면 다시 해요", summary: "다독이면 다시", hint: "다독여 주면 다시 해보기 좋은 게임을 우선해요." },
          { value: "persistent", label: "어려워도 계속 도전해요", summary: "도전 좋아함", hint: "조금 어려운 구간이 있는 게임까지 포함해요." },
        ],
      },
    ],
  },
  {
    id: 2,
    kicker: "안심 조건",
    seconds: "약 40초",
    title: "어떤 선까지 괜찮을까요?",
    desc: "집에서 허용하는 선에 가장 가까운 걸 골라주세요. 고르면 어떤 게임을 빼는지 바로 보여드려요.",
    nextReady: "다음 · 취향 고르기 →",
    groups: [
      {
        id: "violence",
        title: "싸움·폭력 연출",
        missing: "싸움 연출",
        layout: "stack",
        help: "게임 속에서 캐릭터끼리 부딪히거나 싸우는 장면을 어디까지 괜찮게 보시나요?",
        options: [
          { value: "strict", label: "없는 게 좋아요", summary: "싸움 연출 없음", hint: "경쟁·생활·꾸미기처럼 싸우는 장면이 없는 게임만 남겨요." },
          { value: "cartoon", label: "통통 튕기는 정도 OK", summary: "가벼운 연출", hint: "밟거나 부딪히면 통 튀어나가는 정도까지 포함해요 (마리오·커비)." },
          { value: "action", label: "칼·무기 싸움도 OK", summary: "전투 연출 OK", hint: "검이나 무기로 적을 물리치는 장면까지 포함해요 (피 표현 없음)." },
        ],
      },
      {
        id: "session_shape",
        title: "게임 끝맺음",
        missing: "끝맺음",
        layout: "stack",
        help: "정한 시간에 끄기 쉬운 게임을 원하시면 짧은 판을 골라주세요.",
        options: [
          { value: "short_match", label: "짧게 한 판씩", summary: "짧은 판", hint: "5~10분이면 한 판이 끝나는 게임을 우선해요 (카트·파티·스포츠)." },
          { value: "stage", label: "스테이지 단위 OK", summary: "스테이지 단위", hint: "한 스테이지 끝날 때 멈추기 좋은 게임까지 (마리오 원더·커비)." },
          { value: "open_ended", label: "길게 이어져도 괜찮아요", summary: "자유 진행", hint: "끝이 정해지지 않은 생활·탐험 게임까지 포함해요 (동물의 숲·포켓몬)." },
        ],
      },
      {
        id: "coop_mode",
        title: "같이 하기",
        missing: "같이 하기",
        multi: true,
        help: "혼자도 하고 가끔 같이 한다면, 해당하는 것을 모두 고르세요.",
        options: [
          { value: "solo", label: "혼자도 해요", summary: "혼자도", hint: "아이 혼자 끝까지 할 수 있는 게임을 포함해요." },
          { value: "helper", label: "부모가 도와요", summary: "부모 도움", hint: "부모가 옆에서 조작을 나눠 가질 수 있는 게임을 포함해요." },
          { value: "party", label: "다 같이 해요", summary: "다 같이", hint: "한 화면에서 가족이 같이 하는 게임을 포함해요." },
        ],
      },
      {
        id: "hardware",
        title: "보유 기기",
        missing: "기기",
        help: "Lite는 휴대만 되는 기종이에요. TV에 꽂거나 본체를 흔들어야 하는 게임은 추천에서 빠져요.",
        options: [
          { value: "switch1", label: "Switch", summary: "Switch", hint: "지금 가진 스위치에서 되는 게임만 남겨요. 스위치 2 전용은 빠져요." },
          { value: "switch2", label: "Switch 2", summary: "Switch 2", hint: "스위치 2 게임을 우선하고, 이전 기종 게임도 함께 봐요." },
          { value: "lite", label: "Lite", summary: "Lite", hint: "휴대 전용이라 모션이나 TV가 필수인 게임은 빼요." },
        ],
      },
    ],
  },
  {
    id: 3,
    kicker: "취향",
    seconds: "약 20초",
    title: "어떤 놀이를 좋아하나요?",
    desc: "평소 마음에 드는 쪽에 가장 가까운 걸 골라주세요. 고르면 그 취향에 점수를 더 줘요.",
    nextReady: "결과 보기 →",
    groups: [
      {
        id: "characters",
        title: "좋아하는 캐릭터",
        missing: "캐릭터",
        multi: true,
        options: [
          { value: "mario", label: "마리오", summary: "마리오", hint: "마리오와 요시가 나오는 게임을 더 봐요." },
          { value: "kirby", label: "커비", summary: "커비", hint: "동그란 커비가 나오는 게임을 더 봐요." },
          { value: "pokemon", label: "포켓몬", summary: "포켓몬", hint: "피카츄 등 포켓몬이 나오는 게임을 더 봐요." },
          { value: "animal", label: "동물의 숲", summary: "동물의 숲", hint: "동물의 숲 주민과 섬이 나오는 게임을 더 봐요." },
          {
            value: "none",
            label: "없음",
            summary: "없음",
            exclusive: true,
            hint: "좋아하는 캐릭터가 없어도 돼요. 특정 시리즈를 더 추천하지 않아요.",
          },
        ],
      },
      {
        id: "play_style",
        title: "플레이 스타일",
        missing: "플레이 스타일",
        multi: true,
        options: [
          { value: "decorating", label: "꾸미기", summary: "꾸미기", hint: "섬·집을 가꾸고 모으는 게임을 우선해요." },
          { value: "adventure", label: "모험", summary: "모험", hint: "앞으로 탐험하며 진행하는 게임을 우선해요." },
          { value: "sports", label: "스포츠·대결", summary: "스포츠", hint: "짧은 한 판으로 겨루는 게임을 우선해요." },
          { value: "puzzle", label: "퍼즐", summary: "퍼즐", hint: "길을 찾고 수수께끼를 푸는 게임을 우선해요." },
          { value: "body", label: "몸으로 놀기", summary: "몸으로 놀기", hint: "조이콘이나 링을 움직여 몸으로 하는 게임을 우선해요." },
        ],
      },
    ],
  },
];

function blankAnswers() {
  return {
    age: null,
    reading: null,
    control: null,
    frustration: null,
    violence: null,
    session_shape: null,
    coop_mode: [],
    hardware: null,
    characters: [],
    play_style: [],
  };
}

const state = {
  view: "landing",
  step: 1,
  slide: "forward",
  games: [],
  answers: blankAnswers(),
  results: [],
  lastPicked: {},
  open: {},
  busy: false,
};

const app = document.getElementById("app");
const landingMarkup = app?.querySelector(".landing-page")?.outerHTML ?? "";
let startRequested = false;

const ICONS = {
  check: '<path d="M20 6L9 17l-5-5"/>',
  minus: '<path d="M6 12h12"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  corner: '<path d="M15 10 20 15l-5 5"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.4 7.6-8 9-4.6-1.4-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 8h.01"/>',
  alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevUp: '<path d="M6 15l6-6 6 6"/>',
};

function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}

async function init() {
  app.setAttribute("data-booted", "1");
  const hasLanding = Boolean(landingMarkup);
  if (!hasLanding) {
    app.innerHTML = `<div class="loading">게임 목록을 불러오는 중…</div>`;
  } else {
    bindLanding();
  }
  try {
    const gamesUrl = new URL(
      `${import.meta.env.BASE_URL || "/"}data/games.json`,
      window.location.origin,
    ).href;
    const res = await fetch(gamesUrl);
    if (!res.ok) throw new Error("games.json load failed");
    state.games = await res.json();
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><p>게임 데이터를 불러오지 못했습니다.<br>잠시 후 새로고침하거나 <a href="/index.html">/index.html</a>로 열어 보세요.</p></div>`;
    console.error(err);
    return;
  }
  if (startRequested) {
    beginWizard();
    return;
  }
  if (!hasLanding) render();
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
    window.scrollTo(0, 0);
    return;
  }
  app.innerHTML = renderWizard();
  bindWizard();
  window.scrollTo(0, 0);
}

function renderLanding() {
  if (landingMarkup) return landingMarkup;
  return `
    <div class="landing-page">
      <section class="landing-hero" aria-label="시작">
        <div class="brand-mark" aria-hidden="true"><i class="fa-solid fa-gamepad"></i></div>
        <p class="brand-eyebrow">유아부터 초등까지, 내 아이를 위한</p>
        <h1 class="brand-title">닌텐도 게임 추천</h1>
        <p class="brand-sub">아이 연령과 성향에 딱 맞는 안전한 스위치 게임을 엄마·아빠가 직접 골라보세요.</p>
        <button type="button" class="btn btn-primary" id="btn-start">
          딱 맞는 게임 찾기 <i class="fa-solid fa-arrow-right"></i>
        </button>
      </section>
    </div>
  `;
}

function beginWizard() {
  resetAnswers();
  state.view = "step";
  state.step = 1;
  state.slide = "forward";
  render();
}

function bindLanding() {
  document.getElementById("btn-start")?.addEventListener("click", () => {
    if (!state.games.length) {
      startRequested = true;
      return;
    }
    beginWizard();
  });
}

function currentStep() {
  return WIZARD[state.step - 1];
}

function groupFilled(group) {
  const value = state.answers[group.id];
  if (group.multi) return Array.isArray(value) && value.length > 0;
  return Boolean(value);
}

function selectedValues(group) {
  const value = state.answers[group.id];
  if (group.multi) return new Set(Array.isArray(value) ? value : []);
  return new Set(value ? [value] : []);
}

function activeHint(group) {
  const value = state.answers[group.id];
  if (group.multi) {
    const picked = Array.isArray(value) ? value : [];
    if (!picked.length) return "";
    const last = state.lastPicked[group.id];
    const key = picked.includes(last) ? last : picked[picked.length - 1];
    return group.options.find((opt) => opt.value === key)?.hint || "";
  }
  if (!value) return "";
  return group.options.find((opt) => opt.value === value)?.hint || "";
}

function progressPct() {
  return ((state.step - 1) / STEP_COUNT) * 100;
}

function chipColumns(group) {
  if (group.layout === "stack") return 1;
  return group.options.length === 3 ? 3 : 2;
}

function chipHtml(group) {
  const selected = selectedValues(group);
  const cols = chipColumns(group);
  const buttons = group.options
    .map((opt) => {
      const on = selected.has(opt.value);
      const wide = opt.exclusive ? " chip-wide" : "";
      return `
        <button type="button" class="chip${on ? " is-on" : ""}${wide}" data-group="${group.id}" data-value="${opt.value}" aria-pressed="${on ? "true" : "false"}">
          <span class="chip-check">${icon("check")}</span>
          <span class="chip-label">${opt.label}</span>
        </button>`;
    })
    .join("");
  return `<div class="chip-grid cols-${cols}" role="group" aria-labelledby="label-${group.id}">${buttons}</div>`;
}

function hintBlock(group) {
  const hint = activeHint(group);
  if (!hint) return "";
  return `<p class="hint">${icon("corner")}<span>${escapeHtml(hint)}</span></p>`;
}

function groupHtml(group) {
  const extras = [
    group.multi ? `<span class="q-note">여러 개 가능</span>` : "",
    group.help
      ? `<button type="button" class="help-btn" aria-expanded="false" aria-controls="help-${group.id}">${icon("help")}<span>헷갈려요</span></button>`
      : "",
  ].filter(Boolean).join("");
  const headExtra = extras ? `<div class="q-extra">${extras}</div>` : "";
  const help = group.help
    ? `<div class="help-panel" id="help-${group.id}" hidden><p>${escapeHtml(group.help)}</p></div>`
    : "";
  return `
    <section class="q-group" id="q-${group.id}">
      <div class="q-head">
        <h3 class="q-title" id="label-${group.id}">${group.title}</h3>
        ${headExtra}
      </div>
      ${help}
      ${chipHtml(group)}
      <div class="hint-slot" data-hint-for="${group.id}">${hintBlock(group)}</div>
    </section>`;
}

function nextLabel(step) {
  const missing = step.groups.filter((group) => !groupFilled(group));
  if (!missing.length) return { ready: true, text: step.nextReady };
  return { ready: false, text: `${missing.map((group) => group.missing).join(", ")}만 고르면 돼요` };
}

function renderWizard() {
  const step = currentStep();
  const pct = progressPct();
  const next = nextLabel(step);
  const slide = state.slide === "back" ? "slide-back" : "slide-forward";
  return `
    <div class="flow wizard-flow" data-step="${step.id}">
      <div class="step-stage">
        <div class="step-body ${slide}">
          <div class="prog-row">
            <p class="prog-kicker">${step.id} / ${STEP_COUNT} · ${step.kicker}</p>
            <p class="prog-time">${step.seconds}</p>
          </div>
          <div class="prog-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="완료한 단계">
            <span class="prog-fill" style="width:${pct}%"></span>
          </div>
          <h1 class="flow-title">${step.title}</h1>
          <p class="flow-desc">${step.desc}</p>
          <div class="q-card">
            ${step.groups.map(groupHtml).join("")}
          </div>
          <button type="button" class="next-btn ${next.ready ? "is-ready" : "is-pending"}" id="btn-next">${escapeHtml(next.text)}</button>
          <p class="fine-print">처음부터 다시 고르려면 결과 맨 아래의 다시하기를 눌러 주세요</p>
          <button type="button" class="back-link" id="btn-back">${step.id === 1 ? "처음으로" : "이전"}</button>
          <p id="step-status" class="sr-only" aria-live="polite"></p>
        </div>
      </div>
    </div>`;
}

function bindWizard() {
  const root = app.querySelector(".wizard-flow");
  if (!root) return;
  root.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (chip && root.contains(chip)) {
      onChip(chip);
      return;
    }
    const help = event.target.closest(".help-btn");
    if (help && root.contains(help)) {
      const panel = document.getElementById(help.getAttribute("aria-controls"));
      const open = help.getAttribute("aria-expanded") === "true";
      help.setAttribute("aria-expanded", open ? "false" : "true");
      if (panel) panel.hidden = open;
      return;
    }
    if (event.target.closest("#btn-next")) onNext();
    else if (event.target.closest("#btn-back")) onBack();
  });
}

function onChip(chip) {
  const step = currentStep();
  const group = step.groups.find((item) => item.id === chip.dataset.group);
  if (!group) return;
  const value = chip.dataset.value;
  if (group.multi) {
    const option = group.options.find((item) => item.value === value);
    const current = Array.isArray(state.answers[group.id]) ? state.answers[group.id] : [];
    const index = current.indexOf(value);
    let next;
    if (option?.exclusive) {
      next = index >= 0 ? [] : [value];
    } else {
      const exclusive = new Set(group.options.filter((item) => item.exclusive).map((item) => item.value));
      next = index >= 0
        ? current.filter((item) => item !== value)
        : current.filter((item) => !exclusive.has(item)).concat(value);
    }
    state.answers[group.id] = next;
    state.lastPicked[group.id] = next.includes(value) ? value : next[next.length - 1] || null;
  } else {
    state.answers[group.id] = value;
    state.lastPicked[group.id] = value;
  }
  paintStep();
}

function paintStep() {
  const step = currentStep();
  for (const group of step.groups) {
    const selected = selectedValues(group);
    app.querySelectorAll(`.chip[data-group="${group.id}"]`).forEach((btn) => {
      const on = selected.has(btn.dataset.value);
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const slot = app.querySelector(`[data-hint-for="${group.id}"]`);
    if (slot) slot.innerHTML = hintBlock(group);
  }
  const next = nextLabel(step);
  const button = document.getElementById("btn-next");
  if (!button) return;
  button.textContent = next.text;
  button.classList.toggle("is-ready", next.ready);
  button.classList.toggle("is-pending", !next.ready);
}

function onNext() {
  if (state.busy) return;
  const step = currentStep();
  const missing = step.groups.filter((group) => !groupFilled(group));
  if (missing.length) {
    const target = document.getElementById(`q-${missing[0].id}`);
    if (target) {
      target.classList.remove("nudge");
      void target.offsetWidth;
      target.classList.add("nudge");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const status = document.getElementById("step-status");
    if (status) status.textContent = `${missing[0].title} 항목을 아직 고르지 않았어요.`;
    return;
  }
  if (state.step === STEP_COUNT) {
    state.busy = true;
    state.results = matchGames(state.games, state.answers);
    state.open = {};
    if (state.results[0]) state.open[state.results[0].game.id] = true;
    state.view = "results";
    state.slide = "forward";
    render();
    window.setTimeout(() => {
      state.busy = false;
    }, 220);
    return;
  }
  state.busy = true;
  state.slide = "forward";
  state.step += 1;
  render();
  window.setTimeout(() => {
    state.busy = false;
  }, 220);
}

function onBack() {
  if (state.busy) return;
  if (state.step === 1) {
    state.view = "landing";
    render();
    window.scrollTo(0, 0);
    return;
  }
  state.busy = true;
  state.slide = "back";
  state.step -= 1;
  render();
  window.setTimeout(() => {
    state.busy = false;
  }, 220);
}

function ageBand(ageKey) {
  const map = { "3-4": [3, 4], "5-7": [5, 7], "8-10": [8, 10], "11+": [11, 99] };
  return map[ageKey] || [5, 10];
}

const SESSION_COPY = {
  short_match: "짧은 한 판",
  stage: "스테이지 단위",
  open_ended: "자유롭게 이어짐",
};

function pickedList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function buildChecks(game, answers) {
  const mom = game.mom_control || {};
  const userR = READING_RANK[answers.reading] ?? 1;
  const needR = game.reading_level ?? 0;
  const readingValue = ["그림·음성으로 진행", "짧은 안내 문구 위주", "스토리 대사를 읽어야 함"][needR] || "짧은 안내 문구 위주";
  const userC = CONTROL_RANK[answers.control] ?? 1;
  const gameC = CONTROL_GAME[game.control_difficulty] ?? 1;
  const controlValue = ["이동·점프, 카메라 자동", "점프와 방향, 카메라 보조", "3D 시점과 여러 버튼"][gameC];
  const userV = VIOLENCE_RANK[answers.violence] ?? 1;
  const gameV = VIOLENCE_RANK[mom.violence_level] ?? 1;
  const violenceValue = mom.violence || {
    strict: "싸움 연출 없음",
    cartoon: "통통 튕기는 정도",
    action: "칼·무기 싸움 (피 없음)",
  }[mom.violence_level] || "—";
  const [lo, hi] = ageBand(answers.age);
  const ageOk = game.min_age <= hi + 1 && (game.max_age ?? 99) >= lo;
  const userS = SESSION_RANK[answers.session_shape];
  const gameS = SESSION_RANK[game.session_shape];
  const sessionOk = userS == null || gameS == null || gameS <= userS;
  const sessionValue = `${SESSION_COPY[game.session_shape] || "끝맺음 정보 없음"} · ${mom.save_type || "저장 정보 없음"}`;
  const pickedCoop = pickedList(answers.coop_mode);
  const coopTypes = mom.coop_types || [];
  const coopOk = pickedCoop.length > 0 && pickedCoop.every((mode) => coopTypes.includes(mode));
  return [
    { label: "연령", value: `만 ${game.min_age}세부터 추천`, ok: ageOk },
    { label: "글 읽기", value: readingValue, ok: userR >= needR },
    { label: "조작", value: controlValue, ok: userC >= gameC },
    { label: "폭력 표현", value: violenceValue, ok: gameV <= userV },
    { label: "끝맺음", value: sessionValue, ok: sessionOk },
    { label: "함께하기", value: mom.coop_support || "—", ok: coopOk },
  ];
}

function verdictOf(game, answers, checks) {
  const byLabel = Object.fromEntries(checks.map((item) => [item.label, item.ok]));
  const userR = READING_RANK[answers.reading] ?? 1;
  const userC = CONTROL_RANK[answers.control] ?? 1;
  const gameC = CONTROL_GAME[game.control_difficulty] ?? 1;
  const userV = VIOLENCE_RANK[answers.violence] ?? 1;
  const gameV = VIOLENCE_RANK[game.mom_control?.violence_level] ?? 1;
  const fragile = answers.frustration === "easy_quit" && !game.frustration_friendly;
  const kartAssist = (game.id === "mario_kart8" || game.id === "mario_kart_world") && answers.control !== "skilled";
  const violenceOver = gameV > userV || byLabel["폭력 표현"] === false;
  if (
    userR < (game.reading_level ?? 0)
    || userC < gameC
    || fragile
    || kartAssist
    || violenceOver
    || byLabel["끝맺음"] === false
  ) {
    return "care";
  }
  return "safe";
}

function cautionNotes(game, answers) {
  const notes = [];
  if (game.id === "kirby_discovery") {
    notes.push("2인 플레이 때 둘째 플레이어는 커비가 아닌 다른 캐릭터로 고정돼요.");
  }
  if (game.id === "mario_kart8" && answers.control !== "skilled") {
    notes.push("스마트 스티어링은 일시정지 메뉴에서 켤 수 있어요.");
  }
  if (game.id === "mario_kart_world" && answers.control !== "skilled") {
    notes.push("자동 가속과 핸들 보조를 켜면 코스를 끝까지 달리기 쉬워요.");
  }
  if (game.requires_motion) {
    notes.push("조이콘을 움직여야 해서 테이블에 내려놓고 하는 플레이는 어려워요.");
  }
  const userV = VIOLENCE_RANK[answers.violence] ?? 1;
  const gameV = VIOLENCE_RANK[game.mom_control?.violence_level] ?? 1;
  if (gameV > userV) {
    notes.push("허용한 것보다 싸움 연출이 강해요. 첫 판은 옆에서 같이 확인해 주세요.");
  }
  const userS = SESSION_RANK[answers.session_shape];
  const gameS = SESSION_RANK[game.session_shape];
  if (userS != null && gameS != null && gameS > userS) {
    notes.push("한 판이 고른 것보다 길어질 수 있어요. 끌 시간을 미리 정해 주세요.");
  }
  const userR = READING_RANK[answers.reading] ?? 1;
  if (userR < (game.reading_level ?? 0)) {
    notes.push("화면에 글이 나와요. 부모가 한 줄씩 읽어 주면 진행이 쉬워요.");
  }
  if (answers.frustration === "easy_quit" && !game.frustration_friendly) {
    notes.push("같은 구간에서 막히면 짜증이 날 수 있어요. 짧은 목표만 정해 주세요.");
  }
  return notes.slice(0, 2);
}

function pitchFor(game, answers) {
  const age = WIZARD[0].groups[0].options.find((opt) => opt.value === answers.age)?.summary || "이 나이";
  const control = WIZARD[0].groups[2].options.find((opt) => opt.value === answers.control)?.summary || "조작";
  const pitches = {
    kirby_discovery: answers.frustration === "persistent"
      ? `${age} · ${control} 수준에 맞고, 숨은 길을 찾는 재미도 있어요.`
      : `${age} · ${control} 수준에 딱 맞고, 떨어져도 바로 그 자리에서 다시 시작돼요.`,
    mario_wonder: "2D라 조작이 쉽고, 부모가 옆에서 같이 뛰며 도와줄 수 있어요.",
    yoshi_crafted: "느긋한 속도에, 날개로 떠 있는 모드가 있어 실패에 약한 아이도 편해요.",
    mario_kart8: answers.control === "skilled"
      ? "짧은 레이스로 가족이 바로 한 판 즐길 수 있어요."
      : "자동 핸들 보조를 켜면 커브 헤매는 아이도 코스를 끝까지 달릴 수 있어요.",
    animal_crossing: "싸우는 장면이 없고, 자기 속도대로 섬을 가꾸는 놀이예요.",
    pokemon_scarlet: "읽을 글과 메뉴가 있어요. 부모가 처음 저장 방법을 같이 봐 주면 좋아요.",
    nintendo_sports: "조이콘을 움직여 하는 스포츠예요. 짧은 경기라 가족이 번갈아 하기 좋아요.",
    zelda_echoes: "퍼즐을 푸는 탐험이에요. 글과 힌트를 읽을 수 있는 아이에게 맞아요.",
    splatoon3: "잉크로 영역을 칠하는 팀 놀이예요. 온라인 승부는 감정 기복이 있을 수 있어요.",
    kirby_fighters2: "한 판이 짧아 가족이 바로 붙어 놀기 좋아요. 맞으면 통통 튀어 오르는 연출이에요.",
    pokemon_letsgo: "공을 던지는 동작으로 포켓몬을 만나요. 처음 조작은 부모가 한 번 보여 주세요.",
    ring_fit: "링을 밀고 당기며 움직이는 운동 모험이에요. 하루 시간을 정해 두고 하는 편이 좋아요.",
    mario_kart_world: answers.control === "skilled"
      ? "스위치 2 전용 짧은 레이스예요. 가족이 바로 한 판 달릴 수 있어요."
      : "스위치 2 전용 레이스예요. 자동 가속·핸들 보조를 켜면 짧은 판으로 같이 달릴 수 있어요.",
    donkey_kong_bananza: "스위치 2 전용 탐험이에요. 주먹으로 길을 내고, 부모가 2인으로 도와줄 수 있어요. 인게임 결제가 있습니다.",
  };
  return pitches[game.id] || game.summary || "";
}

function cautionHtml(notes) {
  if (!notes.length) return "";
  const title = `알아둘 점 ${notes.length}가지`;
  const body = notes.length === 1 ? notes[0] : notes.join(" ");
  return `<div class="caution">${icon("alert")}<p><strong>${title}</strong> · ${escapeHtml(body)}</p></div>`;
}

function checksHtml(checks) {
  return checks
    .map((item) => `
      <div class="check-row ${item.ok ? "is-ok" : "is-miss"}">
        <span class="k">${escapeHtml(item.label)}</span>
        <span class="v">${escapeHtml(item.value)}</span>
        <span class="mark">${item.ok ? icon("check") : icon("minus")}</span>
      </div>`)
    .join("");
}

function resultCard(item, index) {
  const game = item.game;
  const checks = buildChecks(game, state.answers);
  const okCount = checks.filter((row) => row.ok).length;
  const verdict = verdictOf(game, state.answers, checks);
  const notes = cautionNotes(game, state.answers);
  const open = Boolean(state.open[game.id]);
  const top = index === 0;
  const verdictLabel = verdict === "safe" ? "안심하고 줘도 돼요" : "부모가 처음 설정해 주세요";
  const verdictIcon = verdict === "safe" ? "shield" : "info";
  const href = guideByTitle.has(game.title) ? withBase(`games/${guideByTitle.get(game.title)}.html`) : "";
  const cta = href ? `<a class="guide-cta" href="${href}">부모 가이드 전체 보기</a>` : "";
  const badge = top
    ? `<span class="best-pill">가장 잘 맞아요</span>`
    : `<span class="rank-label">${index + 1}위</span>`;
  return `
    <article class="game-card${open ? " is-open" : ""}" data-id="${escapeHtml(game.id)}">
      <div class="hero-art" ${open ? "" : "hidden"} aria-hidden="true">
        <span class="hero-emoji">${game.image_emoji || "🎮"}</span>
      </div>
      <div class="card-kicker">
        ${badge}
        <span class="fit-label">내 조건 ${okCount}/${checks.length} 맞춤</span>
      </div>
      <h2 class="game-title ${top ? "is-top" : "is-rest"}">${escapeHtml(game.title)}</h2>
      <p class="verdict ${verdict === "safe" ? "is-safe" : "is-care"}">${icon(verdictIcon)}<span>${verdictLabel}</span></p>
      <p class="pitch">${escapeHtml(pitchFor(game, state.answers))}</p>
      <div class="game-more" ${open ? "" : "hidden"}>
        ${cautionHtml(notes)}
        <div class="check-list">${checksHtml(checks)}</div>
        <p class="source">근거 · 권장 만 ${game.min_age}세+ · 마이멜로 정리</p>
        ${cta}
      </div>
      <button type="button" class="fold" data-id="${escapeHtml(game.id)}" aria-expanded="${open ? "true" : "false"}">
        ${open ? `접기 ${icon("chevUp")}` : `왜 추천했는지 자세히 ${icon("chevDown")}`}
      </button>
    </article>`;
}

function renderResults() {
  const slide = state.slide === "back" ? "slide-back" : "slide-forward";
  const list = state.results.length
    ? state.results.map((item, index) => resultCard(item, index)).join("")
    : `<div class="game-card empty-card"><p class="pitch">이 조건에 맞는 게임이 충분하지 않아요. 나이·폭력·기기를 조금만 넓혀 보세요.</p></div>`;
  return `
    <div class="flow results-flow">
      <div class="step-stage">
        <div class="step-body ${slide}">
          <h1 class="flow-title results-title">맞는 게임</h1>
          <div class="result-list">${list}</div>
          <button type="button" class="restart-btn" id="btn-restart">다시하기</button>
        </div>
      </div>
    </div>`;
}

function bindResults() {
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    beginWizard();
  });
  app.querySelectorAll(".fold").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const card = btn.closest(".game-card");
      if (!card) return;
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      state.open[id] = open;
      const hero = card.querySelector(".hero-art");
      const more = card.querySelector(".game-more");
      if (hero) hero.hidden = !open;
      if (more) more.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = open ? `접기 ${icon("chevUp")}` : `왜 추천했는지 자세히 ${icon("chevDown")}`;
    });
  });
}

function resetAnswers() {
  state.answers = blankAnswers();
  state.results = [];
  state.step = 1;
  state.lastPicked = {};
  state.open = {};
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
