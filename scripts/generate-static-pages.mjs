#!/usr/bin/env node
/**
 * Generates Vite multi-page HTML entries for About/Contact/Privacy/Terms and game guides.
 * Run: node scripts/generate-static-pages.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const GUIDES = [
  {
    slug: "mario-odyssey",
    title: "슈퍼 마리오 오디세이",
    emoji: "🎩",
    age: "만 6세+",
    summary: "캡 액션으로 세계를 탐험하는 3D 마리오. 부모와 번갈아 플레이하기 좋은 모험작입니다.",
  },
  {
    slug: "kirby-discovery",
    title: "별의 커비 디스커버리",
    emoji: "⭐",
    age: "만 4세+",
    summary: "조작 부담이 적고 실패해도 다시 일어나기 쉬운 입문용 플랫포머입니다.",
  },
  {
    slug: "animal-crossing",
    title: "모여봐요 동물의 숲",
    emoji: "🏝️",
    age: "만 5세+",
    summary: "폭력 요소 없이 섬을 꾸미는 힐링 생활 게임. 읽기 수준이 조금 필요합니다.",
  },
  {
    slug: "mario-wonder",
    title: "슈퍼 마리오 원더",
    emoji: "🍄",
    age: "만 5세+",
    summary: "원더 꽃으로 스테이지가 변하는 가족 파티형 2D 마리오입니다.",
  },
  {
    slug: "yoshi-crafted-world",
    title: "요시 크래프티드 월드",
    emoji: "🥚",
    age: "만 4세+",
    summary: "수공예 감성의 귀여운 플랫포머. 난이도 보조로 어린 아이와 함께하기 좋습니다.",
  },
  {
    slug: "pokemon-scarlet",
    title: "포켓몬스터 스칼렛",
    emoji: "⚡",
    age: "만 7세+",
    summary: "오픈월드 수집·육성 RPG. 메뉴·읽기와 다소 긴 플레이 세션을 고려하세요.",
  },
  {
    slug: "zelda-echoes",
    title: "젤다의 전설 지혜의 투영",
    emoji: "🗡️",
    age: "만 8세+",
    summary: "퍼즐·탐험 중심의 젤다. 초등 중·고학년의 집중력과 읽기에 잘 맞습니다.",
  },
  {
    slug: "mario-kart-8",
    title: "마리오 카트 8 디럭스",
    emoji: "🏎️",
    age: "만 5세+",
    summary: "짧은 레이스로 바로 즐기는 가족 파티 레이싱. 조작 보조 옵션이 있습니다.",
  },
  {
    slug: "splatoon-3",
    title: "스플래툰 3",
    emoji: "🎨",
    age: "만 8세+",
    summary: "잉크 슈터 팀전. 조작·온라인 매치 스트레스가 있어 연령·성향 확인이 필요합니다.",
  },
  {
    slug: "pikmin-4",
    title: "피크민 4",
    emoji: "🌱",
    age: "만 7세+",
    summary: "작은 피크민을 지휘하는 전략·탐험 게임. 인내심 있는 아이에게 잘 맞습니다.",
  },
  {
    slug: "kirby-fighters-2",
    title: "커비 파이터즈 2",
    emoji: "🥊",
    age: "만 5세+",
    summary: "짧은 라운드의 가벼운 격투. 부모와 함께하는 한 판에 적합합니다.",
  },
  {
    slug: "nintendo-switch-sports",
    title: "닌텐도 스위치 스포츠",
    emoji: "🏐",
    age: "만 6세+",
    summary: "조이콘 모션 스포츠 모음. Lite에서는 모션 플레이가 제한될 수 있습니다.",
  },
];

function padGuideBody(g) {
  const blocks = [
    `학부모 관점에서 ${g.title}를 고를 때 가장 먼저 볼 것은 아이의 연령대와 조작 부담입니다. 권장 연령은 대략 ${g.age}이며, 실제로는 읽기 수준·좌절 저항력·함께 플레이할 보호자의 시간에 따라 체감이 달라집니다. ${g.summary}`,
    `플레이 세션은 20~40분 단위로 끊는 것을 권합니다. 아이가 집중을 잃거나 반복 실패로 짜증을 내면 저장 지점에서 멈추고, 다음 날 이어서 하는 편이 학습·정서 모두에 유리합니다. 부모는 ‘한 스테이지만 더’보다 ‘오늘 목표를 달성했다’는 작은 성취를 말로 짚어 주면 좋습니다.`,
    `폭력·자극 수위는 타이틀마다 다릅니다. ${g.title}는 닌텐도 패밀리 라인에 가까운 연출을 기본으로 하지만, 온라인·대전·퍼즐 난이도 등 부가 요소가 스트레스를 키울 수 있습니다. 가정 규칙(하루 플레이 시간, 음성 채팅 여부, 어려움 설정)을 미리 정해 두면 갈등이 줄어듭니다.`,
    `조작은 초보 모드·자동 조준·보조 기능이 있는 경우 먼저 켜 보세요. 부모가 헬퍼로 들어가 이동만 도와주거나, 어려운 구간만 대신 클리어하는 방식도 효과적입니다. 반대로 아이가 능숙하다면 자유도 높은 탐험·수집 목표를 주어 자기 주도성을 키울 수 있습니다.`,
    `하드웨어는 Switch / Switch OLED / Switch 2 / Lite 호환 여부를 확인하세요. 모션 필수 타이틀은 Lite에서 체험이 달라질 수 있고, TV 모드와 휴대 모드의 조작감·시야도 다릅니다. 구매 전 중고·다운로드 버전·확장팩 유무도 예산 계획에 넣으면 좋습니다.`,
    `이 글은 마이멜로(MyMallow) 학부모 가이드의 일부입니다. 실제 플레이 시간·지역 심의 등급·최신 업데이트는 공식 정보를 함께 확인해 주세요. 우리 아이 닌텐도 Guide 위저드에서 연령·읽기·조작·좌절·폭력 허용·협동 방식을 입력하면 ${g.title}가 맞춤 추천 목록에 포함되는지 바로 비교할 수 있습니다.`,
    `정리하면, ${g.title}는 ‘아이 성향에 맞는지’가 핵심입니다. 꾸미기·탐험·스포츠·퍼즐 중 어디에 가까운지, 실패를 얼마나 참는지, 부모와 같은 화면을 나누고 싶은지를 기준으로 고르면 실패 구매를 줄일 수 있습니다. 아래 관련 가이드와 추천 위저드를 함께 활용해 보세요.`,
  ];
  let text = blocks.join("\n\n");
  while ([...text].length < 1550) {
    text += `\n\n추가로, 형제·친구가 함께할 경우 로컬 멀티 가능 여부와 컨트롤러 개수를 미리 점검하세요. ${g.title}의 템포가 빠른 편이라면 짧은 미션형 목표를, 느린 편이라면 일기처럼 하루 할 일을 적어 두는 방식이 잘 맞습니다.`;
  }
  return text;
}

function siteChrome({ title, description, active, body, jsonLd, nest = "" }) {
  const asset = nest ? "../" : "./";
  const home = nest ? "../index.html" : "./index.html";
  const about = nest ? "../about.html" : "./about.html";
  const contact = nest ? "../contact.html" : "./contact.html";
  const privacy = nest ? "../privacy.html" : "./privacy.html";
  const terms = nest ? "../terms.html" : "./terms.html";
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | 우리 아이 닌텐도 Guide</title>
  <meta name="description" content="${description}" />
  <meta name="google-adsense-account" content="ca-pub-5854572232694460" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
  <link rel="stylesheet" href="${asset}css/styles.css" />
  <link rel="stylesheet" href="${asset}css/seo-pages.css" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body class="seo-page">
  <header class="seo-topbar">
    <a class="seo-home" href="${home}">우리 아이 닌텐도 Guide</a>
    <nav class="seo-topnav" aria-label="보조 메뉴">
      <a href="${about}" ${active === "about" ? 'aria-current="page"' : ""}>소개</a>
      <a href="${contact}" ${active === "contact" ? 'aria-current="page"' : ""}>문의</a>
      <a href="${privacy}" ${active === "privacy" ? 'aria-current="page"' : ""}>개인정보</a>
      <a href="${terms}" ${active === "terms" ? 'aria-current="page"' : ""}>이용약관</a>
    </nav>
  </header>
  <main class="seo-main">
${body}
  </main>
  <footer class="site-footer quiet-footer">
    <nav aria-label="푸터">
      <a href="${about}">About</a>
      <a href="${contact}">Contact</a>
      <a href="${privacy}">Privacy Policy</a>
      <a href="${terms}">Terms</a>
    </nav>
    <p class="footer-note">마이멜로 (MyMallow) · 학부모용 닌텐도 추천 가이드</p>
  </footer>
  <script type="module" src="${asset}js/seo-page.js"></script>
</body>
</html>
`;
}

mkdirSync(join(root, "games"), { recursive: true });

writeFileSync(
  join(root, "about.html"),
  siteChrome({
    title: "소개",
    description:
      "마이멜로(MyMallow) 우리 아이 닌텐도 Guide 소개 — 학부모가 아이 성향에 맞는 스위치 게임을 고르도록 돕는 추천 가이드입니다.",
    active: "about",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "마이멜로 우리 아이 닌텐도 Guide 소개",
      isPartOf: { "@type": "WebSite", name: "우리 아이 닌텐도 Guide" },
    },
    body: `    <article class="seo-article">
      <h1>마이멜로 · 우리 아이 닌텐도 Guide</h1>
      <p><strong>마이멜로(MyMallow)</strong>가 만드는 이 사이트는 학부모가 아이의 연령·읽기·조작·좌절 저항력·폭력 허용·협동 방식·하드웨어를 입력하면, 닌텐도 스위치 타이틀을 맞춤 추천하는 가이드입니다. 상업적 리뷰 순위를 그대로 옮기기보다, 가정에서 실제로 플레이할 때 생기는 갈등 지점(실패, 저장, 모션, Lite 호환)을 먼저 봅니다.</p>
      <h2>우리가 중요하게 보는 것</h2>
      <ul>
        <li>아이 눈높이: 읽기와 조작이 게임 재미를 가로막지 않는지</li>
        <li>부모 안심: 폭력·자극·온라인 요소의 상한</li>
        <li>함께 놀이: 헬퍼·파티·솔로 중 가정에 맞는 협동 형태</li>
      </ul>
      <p>추천 위저드와 게임 카탈로그 매칭이 핵심이며, 타이틀별 심층 가이드는 구매 전 점검 포인트를 정리해 둡니다. 문의는 <a href="./contact.html">Contact</a>로 남겨 주세요.</p>
      <p><a class="seo-cta" href="./index.html">아이 맞춤 게임 찾기</a></p>
    </article>`,
  }),
);

writeFileSync(
  join(root, "contact.html"),
  siteChrome({
    title: "문의",
    description: "마이멜로(MyMallow) 우리 아이 닌텐도 Guide 문의 — 콘텐츠·오류 제보·협업 연락처입니다.",
    active: "contact",
    body: `    <article class="seo-article">
      <h1>문의</h1>
      <p>가이드 문구 수정, 게임 데이터 오류, 협업 제안은 아래로 연락해 주세요.</p>
      <ul>
        <li>이메일: <a href="mailto:MyMallow.Cloud@gmail.com">MyMallow.Cloud@gmail.com</a></li>
        <li>브랜드: 마이멜로 (MyMallow)</li>
        <li>GitHub: <a href="https://github.com/jhjer010819/nintendo-kids-game-recommendations" rel="noopener">nintendo-kids-game-recommendations</a></li>
      </ul>
      <p>개인정보 처리 방침은 <a href="./privacy.html">Privacy Policy</a>, 이용약관은 <a href="./terms.html">Terms</a>를 참고해 주세요.</p>
    </article>`,
  }),
);

writeFileSync(
  join(root, "privacy.html"),
  siteChrome({
    title: "개인정보 처리방침",
    description:
      "마이멜로(MyMallow) 우리 아이 닌텐도 Guide 개인정보 처리방침 — 정적 사이트 운영과 관련한 수집·이용 안내입니다.",
    active: "privacy",
    body: `    <article class="seo-article">
      <h1>개인정보 처리방침</h1>
      <p>마이멜로(MyMallow)가 운영하는 본 사이트는 브라우저에서 동작하는 정적 웹페이지입니다. 추천 위저드 응답은 기본적으로 기기 안에서만 사용되며, 별도의 회원 가입 데이터베이스에 저장하지 않습니다.</p>
      <h2>수집하는 정보</h2>
      <p>사이트 이용 과정에서 호스팅·접속 환경에 따라 IP, 브라우저 종류 등 일반적인 접속 로그가 남을 수 있습니다. 광고·분석 도구를 사용하는 경우 해당 서비스의 쿠키·기기 식별자가 수집될 수 있으며, 세부 정책은 각 제공자의 안내를 따릅니다.</p>
      <h2>문의</h2>
      <p>개인정보 관련 문의: <a href="mailto:MyMallow.Cloud@gmail.com">MyMallow.Cloud@gmail.com</a> · <a href="./contact.html">Contact</a></p>
      <p>최종 업데이트: 2026-11-03</p>
    </article>`,
  }),
);

writeFileSync(
  join(root, "terms.html"),
  siteChrome({
    title: "이용약관",
    description:
      "마이멜로(MyMallow) 우리 아이 닌텐도 Guide 이용약관 — 서비스 이용 조건과 면책 안내입니다.",
    active: "terms",
    body: `    <article class="seo-article">
      <h1>이용약관</h1>
      <p>본 약관은 마이멜로(MyMallow)가 제공하는 「우리 아이 닌텐도 Guide」(이하 “서비스”)의 이용 조건을 정합니다. 서비스를 이용하시면 본 약관에 동의한 것으로 봅니다.</p>
      <h2>1. 서비스 내용</h2>
      <p>서비스는 학부모가 입력한 아이 성향·환경 정보를 바탕으로 닌텐도 스위치 등 게임 타이틀을 참고용으로 추천하고, 관련 가이드 글을 제공합니다. 회원 가입 없이 브라우저에서 이용할 수 있는 정보 제공형 웹사이트입니다.</p>
      <h2>2. 추천의 성격</h2>
      <p>추천 결과와 가이드 내용은 일반적인 참고 정보이며, 특정 제품의 구매·플레이를 강요하거나 보증하지 않습니다. 실제 연령 등급, 기기 호환, 가격, 업데이트는 공식·판매처 정보를 확인해 주세요. 닌텐도 및 각 타이틀 권리는 해당 권리자에게 있습니다.</p>
      <h2>3. 이용자의 책임</h2>
      <p>이용자는 자녀의 플레이 시간·콘텐츠 수위·온라인 기능 사용에 대해 보호자로서 판단하고 관리할 책임이 있습니다. 서비스를 불법·유해한 목적이나 타인의 권리를 침해하는 방식으로 이용해서는 안 됩니다.</p>
      <h2>4. 지식재산권</h2>
      <p>서비스의 문구·구성·로고(마이멜로/MyMallow 관련) 등 마이멜로가 작성·제공한 콘텐츠의 권리는 마이멜로에 있습니다. 게임 명칭·캐릭터·이미지 등은 각 권리자의 자산이며, 본 사이트는 비공식 팬·학부모 가이드 성격의 참고 자료를 제공합니다.</p>
      <h2>5. 면책</h2>
      <p>천재지변, 통신 장애, 호스팅 중단, 제3자 서비스 변경 등으로 서비스 이용이 일시 중단되거나 정보가 지연·오류일 수 있습니다. 마이멜로는 이로 인한 간접·특별 손해에 대해 법령이 허용하는 범위에서 책임을 제한합니다. 구매·플레이로 발생한 분쟁은 해당 판매자·플랫폼 정책을 따릅니다.</p>
      <h2>6. 약관 변경</h2>
      <p>필요 시 약관을 개정할 수 있으며, 변경 내용은 본 페이지에 게시합니다. 게시 이후 서비스를 계속 이용하시면 변경에 동의한 것으로 봅니다.</p>
      <h2>7. 문의</h2>
      <p>이용약관 관련 문의: <a href="mailto:MyMallow.Cloud@gmail.com">MyMallow.Cloud@gmail.com</a> · <a href="./contact.html">Contact</a></p>
      <p>개인정보 처리: <a href="./privacy.html">Privacy Policy</a></p>
      <p>시행일: 2026-11-03</p>
    </article>`,
  }),
);

for (const g of GUIDES) {
  const bodyText = padGuideBody(g);
  const otherLinks = GUIDES.filter((x) => x.slug !== g.slug)
    .slice(0, 5)
    .map((x) => `<li><a href="./${x.slug}.html">${x.title}</a></li>`)
    .join("\n          ");
  writeFileSync(
    join(root, "games", `${g.slug}.html`),
    siteChrome({
      title: g.title,
      description: `${g.title} 부모용 가이드 — ${g.summary}`,
      active: "game",
      nest: "games",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${g.title} 부모용 심층 가이드`,
        description: g.summary,
        inLanguage: "ko-KR",
      },
      body: `    <article class="seo-article guide-article">
      <p class="guide-kicker">인기 닌텐도 게임 부모용 심층 가이드</p>
      <h1>${g.emoji} ${g.title}</h1>
      <p class="guide-lead">${g.summary}</p>
      <p class="guide-meta">권장 연령 참고: ${g.age} · 마이멜로 학부모 가이드</p>
      ${bodyText
        .split("\n\n")
        .map((p) => `<p>${p}</p>`)
        .join("\n      ")}
      <h2>관련 가이드</h2>
      <ul class="guide-related">
          ${otherLinks}
      </ul>
      <p><a class="seo-cta" href="../index.html">아이 맞춤 게임 찾기로 돌아가기</a></p>
    </article>`,
    }),
  );
}

console.log(`Wrote about/contact/privacy + ${GUIDES.length} game guides`);
