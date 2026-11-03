/** Shared base-aware path helper for landing + static pages. */
export function withBase(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const clean = String(path).replace(/^\//, "");
  return `${base}${clean}`;
}

export const GUIDE_LINKS = [
  { slug: "mario-odyssey", title: "슈퍼 마리오 오디세이" },
  { slug: "kirby-discovery", title: "별의 커비 디스커버리" },
  { slug: "animal-crossing", title: "모여봐요 동물의 숲" },
  { slug: "mario-wonder", title: "슈퍼 마리오 원더" },
  { slug: "yoshi-crafted-world", title: "요시 크래프티드 월드" },
  { slug: "pokemon-scarlet", title: "포켓몬스터 스칼렛" },
  { slug: "zelda-echoes", title: "젤다의 전설 지혜의 투영" },
  { slug: "mario-kart-8", title: "마리오 카트 8 디럭스" },
  { slug: "splatoon-3", title: "스플래툰 3" },
  { slug: "pikmin-4", title: "피크민 4" },
  { slug: "kirby-fighters-2", title: "커비 파이터즈 2" },
  { slug: "nintendo-switch-sports", title: "닌텐도 스위치 스포츠" },
];
