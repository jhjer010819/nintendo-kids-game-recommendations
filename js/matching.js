/**
 * Nintendo-for-kids match scoring.
 * Returns up to 5 ranked results with matchPct; hard filters drop incompatible titles.
 */

const READING_MAP = { none: 0, basic: 1, fluent: 2 };
const CONTROL_MAP = { beginner: 0, average: 1, skilled: 2 };
const CONTROL_GAME = { 쉬움: 0, 보통: 1, 어려움: 2 };
const VIOLENCE_RANK = { strict: 0, cartoon: 1, action: 2 };

const WEIGHTS = {
  age: 18,
  reading: 12,
  control: 12,
  frustration: 10,
  violence: 14,
  save: 8,
  coop: 10,
  hardware: 10,
  character: 10,
  playStyle: 8,
  playMode: 4,
};

function ageMid(ageKey) {
  const map = {
    "3-4": 3.5,
    "5-7": 6,
    "8-10": 9,
    "11+": 12,
  };
  return map[ageKey] ?? 7;
}

function ageRange(ageKey) {
  const map = {
    "3-4": [3, 4],
    "5-7": [5, 7],
    "8-10": [8, 10],
    "11+": [11, 99],
  };
  return map[ageKey] ?? [5, 10];
}

/**
 * Hard filters: hardware incompatibilities and violence ceiling.
 * Soft scoring for preference fit.
 */
export function matchGames(games, answers) {
  const scored = [];

  for (const game of games) {
    const hard = hardFilter(game, answers);
    if (!hard.ok) continue;

    const { score, max, reasons } = softScore(game, answers);
    const matchPct = Math.round((score / max) * 100);
    if (matchPct < 35) continue;

    scored.push({
      game,
      matchPct,
      score,
      reasons,
    });
  }

  scored.sort((a, b) => b.matchPct - a.matchPct || b.score - a.score);
  return scored.slice(0, 5);
}

function hardFilter(game, a) {
  // Hardware
  if (a.hardware === "lite") {
    if (game.requires_motion || game.lite_ok === false) {
      return { ok: false, reason: "lite" };
    }
  }
  if (a.hardware === "switch1") {
    if (game.switch_1_supported === false) return { ok: false, reason: "switch1" };
  }
  if (a.hardware === "switch2") {
    // Prefer titles that support Switch 2; exclusives without support are out
    if (game.switch_2_supported === false && game.switch_1_supported === false) {
      return { ok: false, reason: "switch2" };
    }
  }

  // Violence ceiling: user strict → only strict; cartoon → strict|cartoon; action → all
  const userV = VIOLENCE_RANK[a.violence] ?? 1;
  const gameV = VIOLENCE_RANK[game.mom_control?.violence_level] ?? 1;
  if (gameV > userV) return { ok: false, reason: "violence" };

  // Age: reject if game min_age is far above child's max band
  const [, hi] = ageRange(a.age);
  if (game.min_age > hi + 2) return { ok: false, reason: "age" };

  // Reading: reject if game needs fluent and child has none
  const userR = READING_MAP[a.reading] ?? 1;
  if ((game.reading_level ?? 0) - userR >= 2) return { ok: false, reason: "reading" };

  return { ok: true };
}

function softScore(game, a) {
  let score = 0;
  let max = 0;
  const reasons = [];

  // Age
  max += WEIGHTS.age;
  const mid = ageMid(a.age);
  const [lo, hi] = ageRange(a.age);
  if (mid >= game.min_age && mid <= (game.max_age ?? 99)) {
    score += WEIGHTS.age;
    reasons.push("연령 적합");
  } else if (hi >= game.min_age && lo <= (game.max_age ?? 99)) {
    score += WEIGHTS.age * 0.6;
  } else {
    score += WEIGHTS.age * 0.2;
  }

  // Reading
  max += WEIGHTS.reading;
  const userR = READING_MAP[a.reading] ?? 1;
  const need = game.reading_level ?? 0;
  const rDiff = Math.abs(userR - need);
  if (userR >= need) {
    score += WEIGHTS.reading * (rDiff === 0 ? 1 : 0.85);
    reasons.push("읽기 수준 OK");
  } else if (need - userR === 1) {
    score += WEIGHTS.reading * 0.45;
  }

  // Control
  max += WEIGHTS.control;
  const userC = CONTROL_MAP[a.control] ?? 1;
  const gameC = CONTROL_GAME[game.control_difficulty] ?? 1;
  if (userC >= gameC) {
    score += WEIGHTS.control;
    reasons.push("조작 난이도 적합");
  } else if (gameC - userC === 1) {
    score += WEIGHTS.control * 0.4;
  }

  // Frustration
  max += WEIGHTS.frustration;
  if (a.frustration === "easy_quit") {
    if (game.frustration_friendly) {
      score += WEIGHTS.frustration;
      reasons.push("포기하지 않게 설계됨");
    }
  } else if (a.frustration === "normal") {
    score += game.frustration_friendly ? WEIGHTS.frustration : WEIGHTS.frustration * 0.7;
  } else {
    // persistent
    score += WEIGHTS.frustration * (game.frustration_friendly ? 0.75 : 1);
  }

  // Violence (already hard-filtered; reward exact/safer)
  max += WEIGHTS.violence;
  const userV = VIOLENCE_RANK[a.violence] ?? 1;
  const gameV = VIOLENCE_RANK[game.mom_control?.violence_level] ?? 1;
  if (gameV <= userV) {
    score += WEIGHTS.violence * (gameV === userV ? 1 : 0.9);
    reasons.push("폭력 수준 안전");
  }

  // Save
  max += WEIGHTS.save;
  const save = game.mom_control?.save_style;
  if (save === a.save_style) {
    score += WEIGHTS.save;
    reasons.push("저장 방식 선호");
  } else if (a.save_style === "anytime" && save === "checkpoint") {
    score += WEIGHTS.save * 0.35;
  } else if (a.save_style === "checkpoint" && save === "anytime") {
    score += WEIGHTS.save * 0.7;
  }

  // Coop
  max += WEIGHTS.coop;
  const coopTypes = game.mom_control?.coop_types || [];
  if (coopTypes.includes(a.coop_mode)) {
    score += WEIGHTS.coop;
    reasons.push("협동 모드 맞음");
  } else if (a.coop_mode === "solo" && coopTypes.includes("solo")) {
    score += WEIGHTS.coop;
  } else if (a.coop_mode === "helper" && coopTypes.includes("party")) {
    score += WEIGHTS.coop * 0.5;
  } else {
    score += WEIGHTS.coop * 0.15;
  }

  // Hardware soft bonus
  max += WEIGHTS.hardware;
  if (a.hardware === "switch2" && game.switch_2_supported) {
    score += WEIGHTS.hardware;
  } else if (a.hardware === "switch1" && game.switch_1_supported) {
    score += WEIGHTS.hardware;
  } else if (a.hardware === "lite" && game.lite_ok) {
    score += WEIGHTS.hardware;
  } else if (a.hardware === "switch2" && game.switch_1_supported) {
    score += WEIGHTS.hardware * 0.7;
  } else {
    score += WEIGHTS.hardware * 0.3;
  }

  // Characters (multi select)
  max += WEIGHTS.character;
  const chars = (a.characters || []).map((c) => c.toLowerCase());
  if (chars.length === 0) {
    score += WEIGHTS.character * 0.5;
  } else {
    const gameChars = (game.characters || []).map((c) => String(c).toLowerCase());
    const hit = chars.some((c) =>
      gameChars.some((gc) => gc.includes(c) || c.includes(gc) || aliasHit(c, gc))
    );
    if (hit) {
      score += WEIGHTS.character;
      reasons.push("선호 캐릭터");
    } else {
      score += WEIGHTS.character * 0.2;
    }
  }

  // Play style
  max += WEIGHTS.playStyle;
  const styles = game.play_styles || [];
  if (a.play_style && styles.includes(a.play_style)) {
    score += WEIGHTS.playStyle;
    reasons.push("플레이 스타일 일치");
  } else {
    score += WEIGHTS.playStyle * 0.25;
  }

  // Play mode (tv / handheld) — soft, most Switch titles support both
  max += WEIGHTS.playMode;
  const modes = a.play_mode || [];
  if (modes.length === 0) {
    score += WEIGHTS.playMode * 0.5;
  } else if (a.hardware === "lite" && modes.includes("tv") && !modes.includes("handheld")) {
    score += WEIGHTS.playMode * 0.3;
  } else {
    score += WEIGHTS.playMode;
  }

  return { score, max, reasons };
}

function aliasHit(userKey, gameChar) {
  const aliases = {
    mario: ["마리오", "요시", "mario", "yoshi"],
    kirby: ["커비", "kirby"],
    pokemon: ["포켓몬", "피카츄", "pokemon"],
    animal: ["동물", "동물주민", "animal"],
  };
  const list = aliases[userKey] || [userKey];
  return list.some((x) => gameChar.includes(x.toLowerCase()));
}
