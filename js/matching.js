/**
 * Nintendo-for-kids match scoring.
 * Returns up to 5 ranked results with matchPct; hard filters drop incompatible titles.
 */

export const READING_RANK = { none: 0, basic: 1, fluent: 2, parent: 2 };
export const CONTROL_RANK = { beginner: 0, average: 1, skilled: 2 };
export const CONTROL_GAME = { 쉬움: 0, 보통: 1, 어려움: 2 };
export const VIOLENCE_RANK = { strict: 0, cartoon: 1, action: 2 };
export const SESSION_RANK = { short_match: 0, stage: 1, open_ended: 2 };

const WEIGHTS = {
  age: 18,
  reading: 12,
  control: 12,
  frustration: 10,
  violence: 14,
  session: 8,
  coop: 10,
  hardware: 10,
  character: 10,
  playStyle: 8,
};

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
}

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
    const matchPct = Math.min(100, Math.round((score / max) * 100));
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
  if (a.hardware === "lite") {
    if (game.requires_motion || game.lite_ok === false) {
      return { ok: false, reason: "lite" };
    }
  }
  // Switch 1 cannot run Switch 2 exclusives.
  if (a.hardware === "switch1") {
    if (game.switch_1_supported === false) return { ok: false, reason: "switch1" };
  }
  if (a.hardware === "switch2") {
    const onSwitch2 = game.switch_2_supported !== false;
    const onSwitch1 = game.switch_1_supported !== false;
    // Native Switch 2 and backward-compatible Switch 1 titles stay.
    // Only titles that support neither are dropped.
    if (!onSwitch2 && !onSwitch1) return { ok: false, reason: "switch2" };
  }

  const userV = VIOLENCE_RANK[a.violence] ?? 1;
  const gameV = VIOLENCE_RANK[game.mom_control?.violence_level] ?? 1;
  if (gameV > userV) return { ok: false, reason: "violence" };

  const [, hi] = ageRange(a.age);
  if (game.min_age > hi + 2) return { ok: false, reason: "age" };

  // "글자 몰라요" (0) still drops a game two steps above (Animal Crossing is 2).
  // "부모가 읽어줘요" ranks as fluent so an adult reading aloud keeps those games.
  const userR = READING_RANK[a.reading] ?? 1;
  if ((game.reading_level ?? 0) - userR >= 2) return { ok: false, reason: "reading" };

  return { ok: true };
}

function softScore(game, a) {
  let score = 0;
  let max = 0;
  const reasons = [];

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

  max += WEIGHTS.reading;
  const userR = READING_RANK[a.reading] ?? 1;
  const need = game.reading_level ?? 0;
  const rDiff = Math.abs(userR - need);
  if (userR >= need) {
    score += WEIGHTS.reading * (rDiff === 0 ? 1 : 0.85);
    if (a.reading === "parent" && need > 0) reasons.push("부모가 읽어 주면 진행");
    else reasons.push("읽기 수준 OK");
  } else if (need - userR === 1) {
    score += WEIGHTS.reading * 0.45;
  }

  max += WEIGHTS.control;
  const userC = CONTROL_RANK[a.control] ?? 1;
  const gameC = CONTROL_GAME[game.control_difficulty] ?? 1;
  if (userC >= gameC) {
    score += WEIGHTS.control;
    reasons.push("조작 난이도 적합");
  } else if (gameC - userC === 1) {
    score += WEIGHTS.control * 0.4;
  }

  // easy_quit prefers frustration_friendly.
  // persistent keeps full credit for friendly games and only lightly prefers harder ones.
  max += WEIGHTS.frustration;
  if (a.frustration === "easy_quit") {
    if (game.frustration_friendly) {
      score += WEIGHTS.frustration;
      reasons.push("실패해도 바로 이어짐");
    }
  } else if (a.frustration === "normal") {
    score += game.frustration_friendly ? WEIGHTS.frustration : WEIGHTS.frustration * 0.7;
  } else if (a.frustration === "persistent") {
    score += WEIGHTS.frustration;
    if (!game.frustration_friendly) score += 2;
  } else {
    score += WEIGHTS.frustration * 0.5;
  }

  // Violence is already a hard ceiling. Don't emit a generic "safe" reason:
  // every survivor would qualify. Mention it only when the game is gentler
  // than the ceiling the parent actually set.
  max += WEIGHTS.violence;
  const userV = VIOLENCE_RANK[a.violence] ?? 1;
  const gameV = VIOLENCE_RANK[game.mom_control?.violence_level] ?? 1;
  if (gameV <= userV) {
    score += WEIGHTS.violence * (gameV === userV ? 1 : 0.9);
    if (gameV < userV) reasons.push("허용한 연출보다 순한 편");
  }

  // Session length is the preference. save_style is display text only and
  // must not rank "anytime" as easier than "checkpoint".
  max += WEIGHTS.session;
  const userS = SESSION_RANK[a.session_shape];
  const gameS = SESSION_RANK[game.session_shape];
  if (userS == null || gameS == null) {
    score += WEIGHTS.session * 0.5;
  } else if (gameS <= userS) {
    score += WEIGHTS.session * (gameS === userS ? 1 : 0.85);
    if (gameS === userS) reasons.push("끝맺음 맞음");
  } else if (gameS === userS + 1) {
    score += WEIGHTS.session * 0.4;
  } else {
    score += WEIGHTS.session * 0.15;
  }

  max += WEIGHTS.coop;
  const pickedCoop = asList(a.coop_mode);
  const coopTypes = game.mom_control?.coop_types || [];
  const coopHits = pickedCoop.filter((mode) => coopTypes.includes(mode)).length;
  const helperViaParty =
    pickedCoop.includes("helper") && !coopTypes.includes("helper") && coopTypes.includes("party");
  if (pickedCoop.length === 0) {
    score += WEIGHTS.coop * 0.4;
  } else if (coopHits === pickedCoop.length) {
    score += WEIGHTS.coop;
    reasons.push("함께 하기 맞음");
  } else if (coopHits > 0) {
    score += WEIGHTS.coop * (0.4 + 0.45 * (coopHits / pickedCoop.length));
  } else if (helperViaParty) {
    score += WEIGHTS.coop * 0.5;
  } else {
    score += WEIGHTS.coop * 0.15;
  }

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

  max += WEIGHTS.character;
  // "없음" is an explicit no-preference. Score it like an empty list.
  // Matching the token against game.characters would treat every title as a miss.
  const chars = characterPrefs(a.characters);
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

  max += WEIGHTS.playStyle;
  const pickedStyles = asList(a.play_style);
  const styles = game.play_styles || [];
  if (pickedStyles.length === 0) {
    score += WEIGHTS.playStyle * 0.5;
  } else {
    const styleHits = pickedStyles.filter((style) => styles.includes(style)).length;
    if (styleHits > 0) {
      score += WEIGHTS.playStyle * (0.55 + 0.45 * (styleHits / pickedStyles.length));
      reasons.push("플레이 스타일 일치");
    } else {
      score += WEIGHTS.playStyle * 0.25;
    }
  }

  return { score, max, reasons };
}

const NO_CHARACTER_PREF = new Set(["none", "없음"]);

function characterPrefs(value) {
  return asList(value)
    .map((item) => String(item).trim().toLowerCase())
    .filter((item) => item && !NO_CHARACTER_PREF.has(item));
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
