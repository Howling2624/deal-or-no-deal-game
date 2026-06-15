"use strict";

const STORAGE_KEY = "box_acquisition_save_v2";
const ENTRY_FEE = 50000;
const TARGET_MONEY = 10000000;
const AMOUNTS = [
  1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000,
  25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000,
  1000000, 1500000, 2000000,
];

const BUYER_LINES = {
  early: [
    "别急着证明自己，第一口价通常最诚实。",
    "你手里的箱子可能很大，也可能只值一顿饭钱。",
    "现在卖掉不丢人，真正难的是知道什么时候停手。",
  ],
  lowRun: [
    "你运气不错，但好运最喜欢在别人相信它的时候转身。",
    "低额已经出去不少了，我得认真一点了。",
    "你现在看起来像赢家，但箱子还没说话。",
  ],
  highHit: [
    "这一下很疼。现在卖，至少还能把局面稳住。",
    "大奖少了一个，你手里的想象空间也少了一块。",
    "我不会假装没看见刚才那个数字。",
  ],
  highRemain: [
    "大钱还在场上，所以这不是一个轻松的报价。",
    "你可能拿着大奖，也可能正在替大奖挡枪。",
    "我愿意加价，但不会替你承担所有风险。",
  ],
  late: [
    "现在已经不是运气游戏了，是胆量游戏。",
    "每一个没开的箱子都在抬价，也都在威胁你。",
    "这是我最接近真心的一次报价。",
  ],
  down: [
    "局势变了，价格也变了。",
    "刚才不卖，现在就只能谈这个价。",
    "我没有压价，是你刚刚打开了答案的一部分。",
  ],
  up: [
    "你撑过了一轮，所以这个价格配得上你的胆子。",
    "我承认，局面对你更好了一点。",
    "这个数字不是礼物，是我对风险的重新估价。",
  ],
};

const ACHIEVEMENTS = [
  { id: "steady", name: "稳健谈判家", desc: "累计接受报价 10 次" },
  { id: "all_in", name: "孤注一掷", desc: "连续 5 局拒绝所有报价" },
  { id: "million", name: "百万赢家", desc: "单局获得 1,000,000 以上" },
  { id: "chosen", name: "天选之箱", desc: "持有 2,000,000 并坚持到底" },
  { id: "missed", name: "错失良机", desc: "拒绝 500,000 以上报价，最终低于 50,000" },
  { id: "timely", name: "及时收手", desc: "接受报价且高于持有箱真实金额" },
  { id: "comeback", name: "极限翻盘", desc: "开掉百万大奖后仍获得 500,000 以上" },
];

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

let profile = loadProfile();
let activeTab = "leader";
let game = null;
let toastTimer = null;

const icon = (name) => {
  const paths = {
    vault:
      '<path d="M5 7h14v12H5z"/><path d="M8 7V5h8v2"/><path d="M9 12h6"/><path d="M12 9v6"/>',
    play:
      '<path d="M8 5v14l11-7z"/>',
    user:
      '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    chart:
      '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/>',
    trophy:
      '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 7H4a3 3 0 0 0 3 3"/><path d="M17 7h3a3 3 0 0 1-3 3"/>',
    spark:
      '<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    deal:
      '<path d="M8 12l3 3 6-7"/><path d="M21 12a9 9 0 1 1-4-7.5"/>',
    arrow:
      '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    x:
      '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    box:
      '<path d="M4 8h16v11H4z"/><path d="M7 8V5h10v3"/><path d="M4 12h16"/><path d="M12 8v11"/>',
    reset:
      '<path d="M4 12a8 8 0 1 0 2.34-5.66"/><path d="M4 4v6h6"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function normalizeProfile(saved) {
  return {
    playerName: saved.playerName || "",
    totalMoney: Number(saved.totalMoney || 0),
    gamesPlayed: Number(saved.gamesPlayed || 0),
    currentWinStreak: Number(saved.currentWinStreak || 0),
    currentLoseStreak: Number(saved.currentLoseStreak || 0),
    bestWinStreak: Number(saved.bestWinStreak || 0),
    bestLoseStreak: Number(saved.bestLoseStreak || 0),
    achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
    fastestToTenMillionGames: saved.fastestToTenMillionGames || null,
    gameHistory: Array.isArray(saved.gameHistory) ? saved.gameHistory : [],
    leaderboards: saved.leaderboards || { money: [], fastest: [] },
    settings: saved.settings || {},
    acceptedOffers: Number(saved.acceptedOffers || 0),
    refuseAllOffersStreak: Number(saved.refuseAllOffersStreak || 0),
  };
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function formatMoney(value, signed = false) {
  const rounded = Math.round(value);
  const sign = signed && rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}￥${Math.abs(rounded).toLocaleString("zh-CN")}`;
}

function formatCaseMoney(value) {
  if (value < 10000) return `￥${value.toLocaleString("zh-CN")}`;
  const wan = value / 10000;
  const text = Number.isInteger(wan) ? String(wan) : wan.toFixed(1).replace(/\.0$/, "");
  return `￥${text}万`;
}

function randomPick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function createProfile(name) {
  profile = normalizeProfile({ playerName: name });
  saveProfile();
  showToast("本地存档已创建");
  render();
}

function startGame() {
  const shuffled = shuffle(AMOUNTS);
  game = {
    phase: "pick",
    boxes: shuffled.map((amount, index) => ({
      id: index + 1,
      amount,
      status: "closed",
    })),
    heldId: null,
    openMode: "steady",
    openCount: 1,
    selected: [],
    openedLog: [],
    offer: null,
    buyerLine: "",
    offerHistory: [],
    lastOpenedRound: [],
    result: null,
    rejectedOffers: 0,
    openedMillion: false,
  };
  render();
}

function selectHeld(id) {
  if (!game || game.phase !== "pick") return;
  game.heldId = id;
  game.boxes = game.boxes.map((box) =>
    box.id === id ? { ...box, status: "held" } : box,
  );
  game.phase = "choose";
  game.openCount = getModeCount("steady");
  showToast(`你留下了 ${id} 号箱`);
  render();
}

function availableBoxes() {
  if (!game) return [];
  return game.boxes.filter((box) => box.status === "closed");
}

function unknownBoxes() {
  if (!game) return [];
  return game.boxes.filter((box) => box.status !== "opened");
}

function getModeCount(mode) {
  const available = availableBoxes().length;
  if (available <= 0) return 0;
  if (mode === "standard") return clamp(Math.ceil(available * 0.25), 1, available);
  if (mode === "bold") return clamp(Math.ceil(available * 0.5), 1, available);
  return 1;
}

function setOpenMode(mode) {
  if (!game || game.phase !== "choose") return;
  game.openMode = mode;
  game.openCount = mode === "custom" ? clamp(game.openCount, 1, availableBoxes().length) : getModeCount(mode);
  game.selected = game.selected.slice(0, game.openCount);
  render();
}

function setCustomCount(value) {
  if (!game || game.phase !== "choose") return;
  const max = availableBoxes().length;
  game.openMode = "custom";
  game.openCount = clamp(Number(value) || 1, 1, max);
  game.selected = game.selected.slice(0, game.openCount);
  render();
}

function toggleBox(id) {
  if (!game || game.phase !== "choose") return;
  const box = game.boxes.find((item) => item.id === id);
  if (!box || box.status !== "closed") return;
  if (game.selected.includes(id)) {
    game.selected = game.selected.filter((item) => item !== id);
  } else if (game.selected.length < game.openCount) {
    game.selected = [...game.selected, id];
  } else {
    showToast(`本轮只需要选择 ${game.openCount} 个箱子`);
  }
  render();
}

async function openSelectedBoxes() {
  if (!game || game.phase !== "choose") return;
  if (game.selected.length !== game.openCount) {
    showToast(`还需要选择 ${game.openCount - game.selected.length} 个箱子`);
    return;
  }
  if (game.openCount === availableBoxes().length) {
    const ok = window.confirm("你选择打开所有剩余箱子，本局将直接进入最终结算，确认继续吗？");
    if (!ok) return;
  }

  const toOpen = [...game.selected];
  game.phase = "opening";
  game.lastOpenedRound = [];
  render();

  for (const id of toOpen) {
    const box = game.boxes.find((item) => item.id === id);
    if (!box) continue;
    box.status = "opening";
    render();
    await wait(620);
    box.status = "opened";
    game.lastOpenedRound.push(box.amount);
    game.openedLog.unshift({ id: box.id, amount: box.amount });
    if (box.amount >= 1000000) game.openedMillion = true;
    render();
    await wait(260);
  }

  game.selected = [];
  const remaining = availableBoxes().length;
  if (remaining === 0) {
    finishGame("final");
    return;
  }
  makeOffer();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function makeOffer() {
  const unknown = unknownBoxes();
  if (unknown.length <= 1) {
    finishGame("final");
    return;
  }
  const expected = unknown.reduce((sum, box) => sum + box.amount, 0) / unknown.length;
  const discount = randomDiscount(unknown.length);
  const highRemaining = unknown.filter((box) => box.amount >= 300000).length;
  const highFactor = 0.9 + (highRemaining / 7) * 0.2;
  const wave = 0.96 + Math.random() * 0.08;
  const raw = expected * discount * highFactor * wave;
  const quote = roundOffer(Math.min(raw, expected * 0.96));
  const previous = game.offerHistory.at(-1)?.amount || 0;

  game.offer = quote;
  game.offerHistory.push({ amount: quote, unknown: unknown.length });
  game.buyerLine = chooseBuyerLine(quote, previous, highRemaining, unknown.length);
  game.phase = "offer";
  render();
}

function randomDiscount(count) {
  const [min, max] =
    count >= 22 ? [0.52, 0.62] :
    count >= 16 ? [0.58, 0.7] :
    count >= 10 ? [0.66, 0.8] :
    count >= 5 ? [0.74, 0.88] :
    [0.82, 0.94];
  return min + Math.random() * (max - min);
}

function roundOffer(value) {
  const unit = value < 1000 ? 10 : value < 100000 ? 100 : value < 1000000 ? 1000 : 10000;
  return Math.max(unit, Math.round(value / unit) * unit);
}

function chooseBuyerLine(quote, previous, highRemaining, unknownCount) {
  const highHit = game.lastOpenedRound.some((amount) => amount >= 300000);
  const lowRun = game.lastOpenedRound.length > 0 && game.lastOpenedRound.every((amount) => amount < 10000);
  if (previous && quote < previous) return randomPick(BUYER_LINES.down);
  if (previous && quote > previous) return randomPick(BUYER_LINES.up);
  if (unknownCount <= 5) return randomPick(BUYER_LINES.late);
  if (highHit) return randomPick(BUYER_LINES.highHit);
  if (lowRun) return randomPick(BUYER_LINES.lowRun);
  if (highRemaining >= 4) return randomPick(BUYER_LINES.highRemain);
  return randomPick(BUYER_LINES.early);
}

function acceptOffer() {
  if (!game || game.phase !== "offer") return;
  finishGame("accepted");
}

function rejectOffer() {
  if (!game || game.phase !== "offer") return;
  game.rejectedOffers += 1;
  game.offer = null;
  game.buyerLine = "";
  game.phase = "choose";
  game.openCount = getModeCount(game.openMode === "custom" ? "steady" : game.openMode);
  game.openMode = game.openMode === "custom" ? "steady" : game.openMode;
  render();
}

function finishGame(kind) {
  const heldBox = game.boxes.find((box) => box.id === game.heldId);
  const heldAmount = heldBox.amount;
  const prize = kind === "accepted" ? game.offer : heldAmount;
  const net = prize - ENTRY_FEE;
  const maxOffer = game.offerHistory.reduce((max, item) => Math.max(max, item.amount), 0);
  const rating = getRating(kind, prize, heldAmount, net, maxOffer);
  const unlocked = updateProfileAfterGame({ kind, prize, heldAmount, net, maxOffer });

  heldBox.status = "revealed-held";
  game.result = {
    kind,
    prize,
    net,
    heldAmount,
    maxOffer,
    missedBest: maxOffer > prize,
    rating,
    unlocked,
  };
  game.phase = "result";
  saveProfile();
  render();
  if (unlocked.length) showToast(`新成就：${unlocked.map((item) => item.name).join("、")}`);
}

function getRating(kind, prize, heldAmount, net, maxOffer) {
  if (kind === "final" && heldAmount === 2000000) return "神之一手";
  if (kind === "accepted" && prize > heldAmount) return "稳健赢家";
  if (kind === "final" && heldAmount > 500000) return "大胆赢家";
  if (maxOffer >= 500000 && prize < 50000) return "错失良机";
  if (kind === "accepted" && heldAmount < 50000) return "及时止损";
  if (net > 0 && net <= 30000) return "险些翻车";
  if (net < 0) return "血亏出局";
  return net > 0 ? "判断在线" : "擦肩而过";
}

function updateProfileAfterGame(result) {
  const success = result.net > 0;
  profile.gamesPlayed += 1;
  profile.totalMoney += result.net;
  if (success) {
    profile.currentWinStreak += 1;
    profile.currentLoseStreak = 0;
  } else {
    profile.currentLoseStreak += 1;
    profile.currentWinStreak = 0;
  }
  profile.bestWinStreak = Math.max(profile.bestWinStreak, profile.currentWinStreak);
  profile.bestLoseStreak = Math.max(profile.bestLoseStreak, profile.currentLoseStreak);

  if (result.kind === "accepted") {
    profile.acceptedOffers += 1;
    profile.refuseAllOffersStreak = 0;
  } else {
    profile.refuseAllOffersStreak += 1;
  }

  if (!profile.fastestToTenMillionGames && profile.totalMoney >= TARGET_MONEY) {
    profile.fastestToTenMillionGames = profile.gamesPlayed;
  }

  const record = {
    date: new Date().toLocaleString("zh-CN"),
    result: result.kind,
    prize: result.prize,
    net: result.net,
    heldAmount: result.heldAmount,
    maxOffer: result.maxOffer,
  };
  profile.gameHistory = [record, ...profile.gameHistory].slice(0, 18);
  updateLeaderboards();
  return unlockAchievements(result);
}

function updateLeaderboards() {
  const moneyRows = profile.leaderboards.money || [];
  const withoutCurrent = moneyRows.filter((row) => row.name !== profile.playerName);
  profile.leaderboards.money = [
    ...withoutCurrent,
    {
      name: profile.playerName,
      totalMoney: profile.totalMoney,
      gamesPlayed: profile.gamesPlayed,
      date: new Date().toLocaleDateString("zh-CN"),
    },
  ]
    .sort((a, b) => b.totalMoney - a.totalMoney)
    .slice(0, 10);

  if (profile.fastestToTenMillionGames) {
    const fastestRows = profile.leaderboards.fastest || [];
    const next = fastestRows.filter((row) => row.name !== profile.playerName);
    profile.leaderboards.fastest = [
      ...next,
      {
        name: profile.playerName,
        games: profile.fastestToTenMillionGames,
        totalMoney: profile.totalMoney,
      },
    ]
      .sort((a, b) => a.games - b.games || b.totalMoney - a.totalMoney)
      .slice(0, 10);
  }
}

function unlockAchievements(result) {
  const earned = new Set(profile.achievements);
  const checks = {
    steady: profile.acceptedOffers >= 10,
    all_in: profile.refuseAllOffersStreak >= 5,
    million: result.prize >= 1000000,
    chosen: result.kind === "final" && result.heldAmount === 2000000,
    missed: result.maxOffer >= 500000 && result.prize < 50000,
    timely: result.kind === "accepted" && result.prize > result.heldAmount,
    comeback: game.openedMillion && result.prize > 500000,
  };
  const unlocked = [];
  ACHIEVEMENTS.forEach((achievement) => {
    if (checks[achievement.id] && !earned.has(achievement.id)) {
      earned.add(achievement.id);
      unlocked.push(achievement);
    }
  });
  profile.achievements = [...earned];
  return unlocked;
}

function resetSave() {
  const ok = window.confirm("确定清空本地存档吗？当前成绩、榜单和历史记录都会删除。");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  profile = null;
  game = null;
  render();
}

function render() {
  if (!profile) {
    app.innerHTML = renderShell(renderNameScreen(), false);
    return;
  }
  if (game?.phase === "result") {
    app.innerHTML = renderShell(renderResultScreen(), true);
    return;
  }
  if (game) {
    app.innerHTML = renderShell(renderGameScreen(), true);
    return;
  }
  app.innerHTML = renderShell(renderLobby(), true);
}

function renderShell(content, showStats) {
  const stats = showStats
    ? `<div class="top-stats">
        ${renderStat("累计净收益", formatMoney(profile.totalMoney, true))}
        ${renderStat("总局数", `${profile.gamesPlayed}`)}
        ${renderStat("连胜 / 连亏", `${profile.currentWinStreak} / ${profile.currentLoseStreak}`)}
      </div>`
    : "";
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">${icon("vault")}</div>
          <div>
            <h1>Deal or No Deal</h1>
            <p>一只箱子，一口出价，一次停手的判断。</p>
          </div>
        </div>
        ${stats}
      </header>
      <main class="screen">${content}</main>
    </div>
  `;
}

function renderStat(label, value) {
  return `<div class="stat-pill"><small>${label}</small><strong>${value}</strong></div>`;
}

function renderNameScreen() {
  return `
    <section class="name-screen">
      <div class="hero-stage">
        <div class="showcase-cases">
          <span class="showcase-case"></span>
          <span class="showcase-case"></span>
          <span class="showcase-case"></span>
        </div>
        <div class="hero-copy">
          <h2>敢不敢留下那只箱子</h2>
          <p>交易人会不断抬价或压价，你要决定什么时候收手，什么时候把命运留到最后一格。</p>
        </div>
      </div>
      <form class="name-card" data-form="name">
        <h2>创建本地档案</h2>
        <p>名字会用于结算、历史记录和本地榜单。存档保存在当前浏览器。</p>
        <label class="field">
          <span>玩家名</span>
          <input name="playerName" maxlength="12" minlength="2" autocomplete="off" placeholder="2-12 个中文、英文或数字" required />
        </label>
        <button class="btn btn-primary" type="submit">${icon("arrow")}进入拍卖厅</button>
      </form>
    </section>
  `;
}

function renderLobby() {
  return `
    <section class="lobby-grid">
      <div class="panel profile-panel">
        <div class="profile-head">
          <div class="avatar-mark">${icon("user")}</div>
          <div>
            <h2>${escapeHtml(profile.playerName)}</h2>
            <p>门槛费 ${formatMoney(ENTRY_FEE)}，净收益计入长期成绩。</p>
          </div>
        </div>
        <div class="metric-grid">
          ${renderMetric("累计净收益", formatMoney(profile.totalMoney, true))}
          ${renderMetric("总局数", profile.gamesPlayed)}
          ${renderMetric("历史最高连胜", profile.bestWinStreak)}
          ${renderMetric("历史最高连亏", profile.bestLoseStreak)}
        </div>
        <div class="button-row">
          <button class="btn btn-primary" data-action="start">${icon("play")}开始新局</button>
          <button class="btn btn-quiet" data-action="reset">${icon("reset")}重置存档</button>
        </div>
      </div>
      <div class="panel leader-panel">
        ${renderTabs()}
        ${renderLobbyTab()}
      </div>
    </section>
  `;
}

function renderMetric(label, value) {
  return `<div class="metric"><small>${label}</small><strong>${value}</strong></div>`;
}

function renderTabs() {
  const tabs = [
    ["leader", "榜单", "chart"],
    ["achievements", "成就", "trophy"],
    ["history", "历史", "box"],
  ];
  return `<div class="tabs">${tabs
    .map(
      ([id, label, iconName]) =>
        `<button class="tab ${activeTab === id ? "active" : ""}" data-tab="${id}">${icon(iconName)}${label}</button>`,
    )
    .join("")}</div>`;
}

function renderLobbyTab() {
  if (activeTab === "achievements") return renderAchievements();
  if (activeTab === "history") return renderHistory();
  return renderLeaderboards();
}

function renderLeaderboards() {
  const money = profile.leaderboards.money || [];
  const fastest = profile.leaderboards.fastest || [];
  return `
    <div class="list">
      <div class="panel-title"><h3>累计金额榜</h3></div>
      ${money.length ? money.map((row, index) => renderMoneyRow(row, index)).join("") : `<p class="empty-note">完成一局后生成本地排名。</p>`}
      <div class="panel-title" style="margin-top:14px"><h3>最快达到 1000w</h3></div>
      ${fastest.length ? fastest.map((row, index) => renderFastestRow(row, index)).join("") : `<p class="empty-note">累计净收益达到 10,000,000 后记录。</p>`}
    </div>
  `;
}

function renderMoneyRow(row, index) {
  return `<div class="list-row"><b>#${index + 1}</b><span>${escapeHtml(row.name)} · ${row.gamesPlayed} 局</span><strong>${formatMoney(row.totalMoney, true)}</strong></div>`;
}

function renderFastestRow(row, index) {
  return `<div class="list-row"><b>#${index + 1}</b><span>${escapeHtml(row.name)}</span><strong>${row.games} 局</strong></div>`;
}

function renderAchievements() {
  return `<div class="list">${ACHIEVEMENTS.map((achievement) => {
    const unlocked = profile.achievements.includes(achievement.id);
    return `
      <div class="achievement ${unlocked ? "" : "locked"}">
        <div class="achievement-mark">${icon(unlocked ? "spark" : "box")}</div>
        <div><strong>${achievement.name}</strong><div class="meta">${achievement.desc}</div></div>
      </div>`;
  }).join("")}</div>`;
}

function renderHistory() {
  if (!profile.gameHistory.length) return `<p class="empty-note">还没有对局记录。</p>`;
  return `<div class="list">${profile.gameHistory
    .map(
      (row) => `<div class="list-row">
        <b>${row.result === "accepted" ? "成交" : "到底"}</b>
        <span>${row.date} · 持有箱 ${formatMoney(row.heldAmount)}</span>
        <strong class="${row.net > 0 ? "net good" : "net bad"}">${formatMoney(row.net, true)}</strong>
      </div>`,
    )
    .join("")}</div>`;
}

function renderGameScreen() {
  return `
    <section class="game-grid">
      <aside class="side-panel">
        <div class="panel-title"><h2>金额池</h2><span class="phase-badge">${unknownBoxes().length} 未知</span></div>
        <div class="amount-wall">${renderAmountWall()}</div>
      </aside>
      <section class="board-wrap">
        <div class="board-head">
          <div>
            <div class="panel-title" style="margin:0"><h2>${phaseTitle()}</h2></div>
            <p class="board-subtitle">${phaseHint()}</p>
          </div>
          <button class="btn btn-quiet" data-action="back-lobby">${icon("x")}离开本局</button>
        </div>
        <div class="case-grid">${game.boxes.map(renderCase).join("")}</div>
      </section>
      <aside class="side-panel">
        ${renderControls()}
      </aside>
    </section>
  `;
}

function renderAmountWall() {
  const openedAmounts = new Set(game.boxes.filter((box) => box.status === "opened").map((box) => box.amount));
  return AMOUNTS.map((amount) => {
    const opened = openedAmounts.has(amount);
    return `<div class="amount-chip ${amount >= 300000 ? "big" : ""} ${opened ? "opened" : ""}">${formatMoney(amount)}</div>`;
  }).join("");
}

function phaseTitle() {
  const titles = {
    pick: "选择你的持有箱",
    choose: "选择本轮要打开的箱子",
    opening: "箱子正在打开",
    offer: "交易人报价",
  };
  return titles[game.phase] || "本局进行中";
}

function phaseHint() {
  if (game.phase === "pick") return "选中后金额仍然保密，直到成交或坚持到底。";
  if (game.phase === "choose") return `本轮需要选择 ${game.openCount} 个箱子，已选 ${game.selected.length} 个。`;
  if (game.phase === "opening") return "每个箱子的金额会逐个揭晓。";
  if (game.phase === "offer") return "Deal 会立即结算，No Deal 则进入下一轮。";
  return "";
}

function renderCase(box) {
  const selected = game.selected.includes(box.id);
  const disabled =
    game.phase === "opening" ||
    game.phase === "offer" ||
    (game.phase === "pick" ? false : box.status !== "closed");
  const classes = [
    "case",
    box.status,
    selected ? "selected" : "",
    box.status === "opened" && box.amount >= 300000 ? "high" : "",
    box.status === "opened" && box.amount < 10000 ? "low" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const valueVisible = box.status === "opened" || box.status === "revealed-held";
  return `
    <button class="${classes}" data-box-id="${box.id}" ${disabled ? "disabled" : ""} aria-label="${box.id}号箱">
      <span class="case-handle"></span>
      <span class="case-shell">
        <span class="case-lid"></span>
        <span class="case-lock"></span>
        <span class="case-number">${box.id}</span>
        <span class="case-value">${valueVisible ? formatCaseMoney(box.amount) : ""}</span>
        <span class="case-held-label">我的箱</span>
      </span>
    </button>
  `;
}

function renderControls() {
  if (game.phase === "pick") {
    return `
      <div class="control-stack">
        <div class="panel-title"><h2>本局入场</h2>${icon("box")}</div>
        <div class="metric">${renderSmall("门槛费", formatMoney(ENTRY_FEE))}</div>
        <p class="hint">先留下一个箱子。你不会知道里面的金额，之后交易人的出价都会围绕未知金额变化。</p>
      </div>`;
  }
  if (game.phase === "choose" || game.phase === "opening") {
    return renderOpenControls();
  }
  if (game.phase === "offer") {
    return renderOfferControls();
  }
  return "";
}

function renderSmall(label, value) {
  return `<small>${label}</small><strong>${value}</strong>`;
}

function renderOpenControls() {
  const available = availableBoxes().length;
  const disabled = game.phase === "opening";
  return `
    <div class="control-stack">
      <div class="panel-title"><h2>开箱策略</h2><span class="phase-badge">剩余 ${available}</span></div>
      <div class="round-options">
        ${renderOption("steady", "稳健", getModeCount("steady"))}
        ${renderOption("standard", "标准", getModeCount("standard"))}
        ${renderOption("bold", "激进", getModeCount("bold"))}
      </div>
      <label class="field" style="margin:0">
        <span>自定义数量</span>
        <input class="number-input" data-input="custom-count" type="number" min="1" max="${available}" value="${game.openMode === "custom" ? game.openCount : ""}" placeholder="1-${available}" ${disabled ? "disabled" : ""} />
      </label>
      <button class="btn btn-primary" data-action="open-selected" ${disabled || game.selected.length !== game.openCount ? "disabled" : ""}>${icon("spark")}打开选中箱子</button>
      <p class="hint">${game.selected.length === game.openCount ? "选好了。开箱后会进入交易人出价或最终结算。" : `还需选择 ${game.openCount - game.selected.length} 个箱子。`}</p>
      <div>
        <div class="panel-title"><h3>最近开出</h3></div>
        <div class="open-log">${renderOpenLog()}</div>
      </div>
    </div>
  `;
}

function renderOption(mode, label, count) {
  return `<button class="option ${game.openMode === mode ? "active" : ""}" data-mode="${mode}" ${game.phase === "opening" ? "disabled" : ""}><strong>${label}</strong><small>${count} 个</small></button>`;
}

function renderOpenLog() {
  if (!game.openedLog.length) return `<p class="empty-note">尚未打开箱子。</p>`;
  return game.openedLog
    .slice(0, 8)
    .map(
      (item) =>
        `<div class="log-item"><span>${item.id} 号箱</span><strong class="${item.amount >= 300000 ? "high" : item.amount < 10000 ? "low" : ""}">${formatMoney(item.amount)}</strong></div>`,
    )
    .join("");
}

function renderOfferControls() {
  return `
    <div class="control-stack">
      <div class="offer-card">
        <div class="meta">交易人出价</div>
        <div class="offer-amount">${formatMoney(game.offer)}</div>
        <div class="buyer-line">${game.buyerLine}</div>
      </div>
      <div class="button-row">
        <button class="btn btn-primary" data-action="accept">${icon("deal")}Deal</button>
        <button class="btn" data-action="reject">${icon("arrow")}No Deal</button>
      </div>
      <div>
        <div class="panel-title"><h3>出价记录</h3></div>
        <div class="open-log">${game.offerHistory
          .slice()
          .reverse()
          .map((item) => `<div class="log-item"><span>${item.unknown} 个未知箱</span><strong>${formatMoney(item.amount)}</strong></div>`)
          .join("")}</div>
      </div>
    </div>
  `;
}

function renderResultScreen() {
  const result = game.result;
  return `
    <section class="result-grid">
      <div class="panel result-hero">
        <div class="phase-badge">${result.kind === "accepted" ? "Deal" : "No Deal 到底"}</div>
        <h2 style="margin-top:16px">${result.rating}</h2>
        <div class="result-amount">${formatMoney(result.prize)}</div>
        <p class="net ${result.net > 0 ? "good" : "bad"}">本局净收益 ${formatMoney(result.net, true)}</p>
        <div class="button-row">
          <button class="btn btn-primary" data-action="start">${icon("play")}再来一局</button>
          <button class="btn" data-action="end-to-lobby">${icon("chart")}回到大厅</button>
        </div>
      </div>
      <div class="panel result-detail">
        <div class="summary-grid">
          ${renderSummary("门槛费", formatMoney(ENTRY_FEE))}
          ${renderSummary("持有箱真实金额", formatMoney(result.heldAmount))}
          ${renderSummary("最高交易出价", result.maxOffer ? formatMoney(result.maxOffer) : "无出价")}
          ${renderSummary("是否错过最高出价", result.missedBest ? "是" : "否")}
          ${renderSummary("当前累计金额", formatMoney(profile.totalMoney, true))}
          ${renderSummary("距离 1000w", profile.totalMoney >= TARGET_MONEY ? "已达成" : formatMoney(TARGET_MONEY - profile.totalMoney))}
          ${renderSummary("当前连胜", profile.currentWinStreak)}
          ${renderSummary("当前连亏", profile.currentLoseStreak)}
        </div>
        <div class="panel-title" style="margin-top:18px"><h3>本局打开记录</h3></div>
        <div class="open-log">${renderOpenLog()}</div>
        <div class="panel-title" style="margin-top:18px"><h3>新解锁成就</h3></div>
        ${
          result.unlocked.length
            ? `<div class="list">${result.unlocked
                .map((item) => `<div class="achievement"><div class="achievement-mark">${icon("spark")}</div><div><strong>${item.name}</strong><div class="meta">${item.desc}</div></div></div>`)
                .join("")}</div>`
            : `<p class="empty-note">本局没有新成就。</p>`
        }
      </div>
    </section>
  `;
}

function renderSummary(label, value) {
  return `<div class="summary-item"><small>${label}</small><strong>${value}</strong></div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form='name']");
  if (!form) return;
  event.preventDefault();
  const name = new FormData(form).get("playerName").trim();
  if (!/^[\u4e00-\u9fa5A-Za-z0-9]{2,12}$/.test(name)) {
    showToast("名字需要 2-12 个中文、英文或数字");
    return;
  }
  createProfile(name);
});

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) {
    activeTab = tab.dataset.tab;
    render();
    return;
  }

  const mode = event.target.closest("[data-mode]");
  if (mode) {
    setOpenMode(mode.dataset.mode);
    return;
  }

  const box = event.target.closest("[data-box-id]");
  if (box) {
    const id = Number(box.dataset.boxId);
    if (game?.phase === "pick") selectHeld(id);
    else toggleBox(id);
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const actions = {
    start: startGame,
    reset: resetSave,
    "open-selected": openSelectedBoxes,
    accept: acceptOffer,
    reject: rejectOffer,
    "back-lobby": () => {
      const ok = window.confirm("离开会放弃当前这一局，确认返回大厅吗？");
      if (ok) {
        game = null;
        render();
      }
    },
    "end-to-lobby": () => {
      game = null;
      render();
    },
  };
  actions[action]?.();
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-input='custom-count']");
  if (!input) return;
  setCustomCount(input.value);
});

render();
