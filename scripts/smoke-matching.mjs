/**
 * Scoring smoke checks for the wizard changes.
 * Run: npm test
 */
import { matchGames } from "../js/matching.js";
import games from "../public/data/games.json" with { type: "json" };

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL ${msg}`);
  } else {
    console.log(`ok   ${msg}`);
  }
}

function shell(overrides = {}) {
  const mom = {
    violence: "낮음",
    violence_level: "cartoon",
    save_type: "테스트 저장",
    save_style: "anytime",
    coop_support: "혼자",
    coop_types: ["solo"],
    ...(overrides.mom_control || {}),
  };
  return {
    id: "sample",
    title: "샘플",
    min_age: 6,
    max_age: 12,
    reading_level: 1,
    control_difficulty: "쉬움",
    frustration_friendly: true,
    requires_motion: false,
    switch_2_supported: true,
    switch_1_supported: true,
    lite_ok: true,
    characters: [],
    play_styles: ["adventure"],
    session_shape: "stage",
    ...overrides,
    mom_control: mom,
  };
}

const base = {
  age: "8-10",
  reading: "fluent",
  control: "skilled",
  frustration: "persistent",
  violence: "action",
  session_shape: "stage",
  coop_mode: ["solo"],
  hardware: "switch1",
  characters: [],
  play_style: ["adventure"],
};

function one(game, answers) {
  const rows = matchGames([game], answers);
  assert(rows.length === 1, `${game.id} stays in results`);
  return rows[0];
}

const shapes = new Set(["short_match", "stage", "open_ended"]);
for (const game of games) {
  assert(shapes.has(game.session_shape), `${game.id} session_shape`);
}

for (const id of ["nintendo_sports", "ring_fit"]) {
  const chars = (games.find((game) => game.id === id).characters || []).join(" ").toLowerCase();
  assert(!chars.includes("mario") && !chars.includes("마리오"), `${id} has no mario tag`);
}

assert(games.some((game) => (game.play_styles || []).includes("puzzle")), "puzzle style has a game");
assert(games.some((game) => (game.play_styles || []).includes("body")), "body style has a game");
assert(
  games.filter((game) => game.switch_1_supported === false && game.switch_2_supported === true).length >= 2,
  "at least two Switch 2 exclusives",
);

const friendly = one(shell({ id: "friendly", frustration_friendly: true }), base);
const tough = one(shell({ id: "tough", frustration_friendly: false }), base);
assert(Math.abs(tough.score - friendly.score - 2) < 0.001, `persistent light boost is ${tough.score - friendly.score}`);

const quitFriendly = one(
  shell({ id: "quit-f", frustration_friendly: true }),
  { ...base, frustration: "easy_quit" },
);
const quitTough = one(
  shell({ id: "quit-t", frustration_friendly: false }),
  { ...base, frustration: "easy_quit" },
);
assert(Math.abs(quitFriendly.score - quitTough.score - 10) < 0.001, `easy_quit prefers friendly by ${quitFriendly.score - quitTough.score}`);

const anytime = one(shell({ id: "any", mom_control: { save_style: "anytime" } }), base);
const checkpoint = one(shell({ id: "check", mom_control: { save_style: "checkpoint" } }), base);
assert(Math.abs(anytime.score - checkpoint.score) < 0.001, "save_style does not change the score");

const shortPick = { ...base, session_shape: "short_match" };
const shortGame = one(shell({ id: "short", session_shape: "short_match" }), shortPick);
const openGame = one(shell({ id: "open", session_shape: "open_ended" }), shortPick);
assert(shortGame.score > openGame.score, "short sessions rank above open-ended when a short round is requested");

const openPick = { ...base, session_shape: "open_ended" };
const shortWhenOpen = one(shell({ id: "short-open", session_shape: "short_match" }), openPick);
const openWhenOpen = one(shell({ id: "open-open", session_shape: "open_ended" }), openPick);
assert(openWhenOpen.score >= shortWhenOpen.score, "open-ended choice still accepts shorter games");
assert(openWhenOpen.score - shortWhenOpen.score < 2, "shorter games are not treated as harder to quit");

const exclusives = games.filter((game) => game.switch_1_supported === false);
const wide = {
  ...base,
  violence: "action",
  session_shape: "open_ended",
  coop_mode: ["solo", "helper", "party"],
  play_style: ["adventure", "sports", "puzzle", "body"],
  characters: ["mario"],
};
assert(matchGames(exclusives, { ...wide, hardware: "switch1" }).length === 0, "Switch 1 hides Switch 2 exclusives");
assert(matchGames(exclusives, { ...wide, hardware: "switch2" }).length === exclusives.length, "Switch 2 keeps its exclusives");

const neither = shell({
  id: "neither",
  switch_1_supported: false,
  switch_2_supported: false,
  lite_ok: false,
});
assert(matchGames([neither], { ...base, hardware: "switch2" }).length === 0, "Switch 2 drops titles that support neither");

const ring = games.filter((game) => game.id === "ring_fit");
const ringAnswers = { ...base, violence: "strict", session_shape: "stage", play_style: ["body"] };
assert(matchGames(ring, { ...ringAnswers, hardware: "switch1" }).length === 1, "Ring Fit stays on Switch 1");
assert(matchGames(ring, { ...ringAnswers, hardware: "switch2" }).length === 1, "Switch 2 still allows Switch 1 titles");
assert(matchGames(ring, { ...ringAnswers, hardware: "lite" }).length === 0, "Lite still drops motion titles");

const crossing = games.filter((game) => game.id === "animal_crossing");
const readAnswers = {
  ...base,
  violence: "strict",
  session_shape: "open_ended",
  characters: ["animal"],
  play_style: ["decorating"],
  coop_mode: ["solo"],
};
assert(matchGames(crossing, { ...readAnswers, reading: "none" }).length === 0, "글자 몰라요 drops Animal Crossing");
assert(matchGames(crossing, { ...readAnswers, reading: "parent" }).length === 1, "부모가 읽어줘요 keeps Animal Crossing");

const zelda = games.filter((game) => game.id === "zelda_echoes");
assert(matchGames(zelda, { ...base, violence: "strict", session_shape: "open_ended" }).length === 0, "strict violence drops Zelda");
assert(matchGames(zelda, { ...base, violence: "cartoon", session_shape: "open_ended" }).length === 0, "cartoon violence drops Zelda");
assert(matchGames(zelda, { ...base, violence: "action", session_shape: "open_ended", play_style: ["puzzle"] }).length === 1, "weapon-ok keeps Zelda");

const reasons = matchGames(games, wide).flatMap((row) => row.reasons);
assert(!reasons.includes("폭력 수준 안전"), "generic violence-safe reason is not emitted");

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("smoke matching passed");
