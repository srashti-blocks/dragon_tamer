/* ---------- Data ---------- */

const weapons = [
    { key: "stick", name: "Stick", icon: "\ud83e\udea8", power: 8, price: 0 },
    { key: "dagger", name: "Dagger", icon: "\ud83d\udde1\ufe0f", power: 18, price: 30 },
    { key: "hammer", name: "Claw Hammer", icon: "\ud83d\udd28", power: 35, price: 70 },
    { key: "warhammer", name: "War Hammer", icon: "\u2694\ufe0f", power: 65, price: 150 }
];

const monsters = [
    { key: "slime", name: "Slime", icon: "\ud83d\udfe2", level: 4, minPlayerLevel: 1, health: 45, loot: "gel", lootRange: [1, 2], goldRange: [8, 14] },
    { key: "beast", name: "Fanged Beast", icon: "\ud83d\udc3a", level: 9, minPlayerLevel: 3, health: 95, loot: "fang", lootRange: [1, 2], goldRange: [20, 32] },
    { key: "dragon", name: "Dragon", icon: "\ud83d\udc09", level: 20, minPlayerLevel: 6, health: 320, loot: "scale", lootRange: [2, 3], goldRange: [80, 120] }
];

const lootMeta = {
    gel: { name: "Slime Gel", icon: "\ud83e\udea3", price: 5 },
    fang: { name: "Beast Fang", icon: "\ud83e\uddb7", price: 15 },
    scale: { name: "Dragon Scale", icon: "\ud83d\udd36", price: 50 }
};

/* ---------- State ---------- */

let state;

function freshState() {
    return {
        xp: 0,
        level: 1,
        gold: 50,
        health: 100,
        maxHealth: 100,
        ownedWeapons: ["stick"],
        equipped: "stick",
        loot: { gel: 0, fang: 0, scale: 0 },
        screen: "town",
        fightMonsterKey: null,
        monsterHealth: 0,
        inFightAction: false
    };
}

state = freshState();

/* ---------- DOM refs ---------- */

const screenEl = document.querySelector("#screen");
const logEl = document.querySelector("#log");
const levelText = document.querySelector("#levelText");
const xpBar = document.querySelector("#xpBar");
const healthText = document.querySelector("#healthText");
const maxHealthText = document.querySelector("#maxHealthText");
const healthBar = document.querySelector("#healthBar");
const goldText = document.querySelector("#goldText");

/* ---------- Helpers ---------- */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function xpForLevel(level) {
    return (level - 1) * 30;
}

function levelFromXp(xp) {
    return 1 + Math.floor(xp / 30);
}

function maxHealthForLevel(level) {
    return 100 + (level - 1) * 15;
}

function currentWeapon() {
    return weapons.find(w => w.key === state.equipped);
}

function addLog(message) {
    const entry = document.createElement("div");
    entry.innerText = message;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild);
}

function refreshTopBar() {
    levelText.innerText = state.level;
    const curFloor = xpForLevel(state.level);
    const nextFloor = xpForLevel(state.level + 1);
    const pct = Math.min(100, ((state.xp - curFloor) / (nextFloor - curFloor)) * 100);
    xpBar.style.width = pct + "%";
    healthText.innerText = Math.max(state.health, 0);
    maxHealthText.innerText = state.maxHealth;
    healthBar.style.width = (Math.max(state.health, 0) / state.maxHealth * 100) + "%";
    goldText.innerText = state.gold;
}

function gainXp(amount) {
    state.xp += amount;
    const newLevel = levelFromXp(state.xp);
    if (newLevel > state.level) {
        state.level = newLevel;
        state.maxHealth = maxHealthForLevel(newLevel);
        state.health = state.maxHealth;
        addLog("Level up! You are now level " + newLevel + ".");
    }
}

function showDamagePopup(fighterEl, text, variant) {
    const popup = document.createElement("span");
    popup.className = "dmg-popup" + (variant ? " " + variant : "");
    popup.innerText = text;
    fighterEl.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
}

async function playAnim(el, className, duration) {
    el.classList.add(className);
    await wait(duration);
    el.classList.remove(className);
}

/* ---------- Rendering ---------- */

function render() {
    refreshTopBar();
    if (state.screen === "town") renderTown();
    else if (state.screen === "store") renderStore();
    else if (state.screen === "cave") renderCave();
    else if (state.screen === "battle") renderBattle();
    else if (state.screen === "gameover") renderGameOver();
}

function renderTown() {
    screenEl.innerHTML = `
        <div class="panel-text">You stand in the town square. Smoke curls from the northern mountain where the dragon nests.</div>
        <div class="nav-grid">
            <div class="card">
                <div class="card-row"><span class="card-icon">\ud83c\udfea</span><span class="card-title">Store</span></div>
                <div class="card-sub">Buy gear, sell loot</div>
                <button class="btn" id="toStore">Enter</button>
            </div>
            <div class="card">
                <div class="card-row"><span class="card-icon">\ud83c\udf32</span><span class="card-title">Cave</span></div>
                <div class="card-sub">Monsters lurk within</div>
                <button class="btn" id="toCave">Enter</button>
            </div>
        </div>
    `;
    document.querySelector("#toStore").onclick = () => { state.screen = "store"; render(); };
    document.querySelector("#toCave").onclick = () => { state.screen = "cave"; render(); };
}

function renderStore() {
    const weaponCards = weapons.map(w => {
        const owned = state.ownedWeapons.includes(w.key);
        const equipped = state.equipped === w.key;
        let actionHtml;
        if (equipped) {
            actionHtml = `<span class="equipped-tag">Equipped</span>`;
        } else if (owned) {
            actionHtml = `<button class="btn" data-equip="${w.key}">Equip</button>`;
        } else {
            const afford = state.gold >= w.price;
            actionHtml = `<button class="btn" data-buy="${w.key}" ${afford ? "" : "disabled"}>Buy (${w.price}g)</button>`;
        }
        return `
            <div class="card">
                <div class="card-row">
                    <span class="card-icon">${w.icon}</span>
                    <div>
                        <div class="card-title">${w.name}</div>
                        <div class="card-sub">Power ${w.power}</div>
                    </div>
                </div>
                ${actionHtml}
            </div>`;
    }).join("");

    const totalLootValue = Object.keys(state.loot).reduce((sum, key) => sum + state.loot[key] * lootMeta[key].price, 0);
    const lootLine = Object.keys(state.loot)
        .filter(key => state.loot[key] > 0)
        .map(key => `${lootMeta[key].icon} ${lootMeta[key].name} x${state.loot[key]}`)
        .join(", ") || "No loot to sell.";

    screenEl.innerHTML = `
        <div class="panel-text">The merchant looks you over. "Gear or gold, adventurer?"</div>
        <div class="card" style="margin-bottom:10px;">
            <div class="card-row"><span class="card-icon">\u2764\ufe0f</span><div><div class="card-title">Health Potion</div><div class="card-sub">Restore 30 health &mdash; 15g</div></div></div>
            <button class="btn" id="buyPotion" ${state.gold >= 15 ? "" : "disabled"}>Buy</button>
        </div>
        <div class="item-grid">${weaponCards}</div>
        <div class="card" style="margin-bottom:12px;">
            <div class="card-title">Sell Loot</div>
            <div class="card-sub">${lootLine}</div>
            <button class="btn" id="sellLoot" ${totalLootValue > 0 ? "" : "disabled"}>Sell all (${totalLootValue}g)</button>
        </div>
        <button class="btn btn-back" id="backTown">\u2190 Back to town</button>
    `;

    const potionBtn = document.querySelector("#buyPotion");
    if (potionBtn) potionBtn.onclick = () => {
        state.gold -= 15;
        state.health = Math.min(state.health + 30, state.maxHealth);
        addLog("Bought a health potion. +30 health.");
        render();
    };

    document.querySelectorAll("[data-buy]").forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute("data-buy");
            const w = weapons.find(x => x.key === key);
            state.gold -= w.price;
            state.ownedWeapons.push(key);
            state.equipped = key;
            addLog("Bought and equipped the " + w.name + ".");
            render();
        };
    });

    document.querySelectorAll("[data-equip]").forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute("data-equip");
            state.equipped = key;
            addLog("Equipped the " + weapons.find(x => x.key === key).name + ".");
            render();
        };
    });

    const sellBtn = document.querySelector("#sellLoot");
    if (sellBtn) sellBtn.onclick = () => {
        let total = 0;
        Object.keys(state.loot).forEach(key => {
            total += state.loot[key] * lootMeta[key].price;
            state.loot[key] = 0;
        });
        state.gold += total;
        addLog("Sold loot for " + total + " gold.");
        render();
    };

    document.querySelector("#backTown").onclick = () => { state.screen = "town"; render(); };
}

function renderCave() {
    const cards = monsters.map(m => {
        const locked = state.level < m.minPlayerLevel;
        return `
            <div class="card ${locked ? "locked" : ""}">
                <div class="card-row"><span class="card-icon">${m.icon}</span><div><div class="card-title">${m.name}</div><div class="card-sub">Lv ${m.minPlayerLevel}+ \u00b7 HP ${m.health}</div></div></div>
                ${locked
                    ? `<div class="card-sub">Reach level ${m.minPlayerLevel} to challenge</div>`
                    : `<button class="btn btn-danger" data-fight="${m.key}">Fight</button>`}
            </div>`;
    }).join("");

    screenEl.innerHTML = `
        <div class="panel-text">Something shifts in the dark. Choose your fight wisely &mdash; tougher foes need a higher level.</div>
        <div class="item-grid">${cards}</div>
        <button class="btn btn-back" id="backTown">\u2190 Back to town</button>
    `;

    document.querySelectorAll("[data-fight]").forEach(btn => {
        btn.onclick = () => startFight(btn.getAttribute("data-fight"));
    });
    document.querySelector("#backTown").onclick = () => { state.screen = "town"; render(); };
}

function startFight(monsterKey) {
    const monster = monsters.find(m => m.key === monsterKey);
    state.fightMonsterKey = monsterKey;
    state.monsterHealth = monster.health;
    state.screen = "battle";
    render();
    addLog("A " + monster.name + " blocks your path.");
    telegraphTurn();
}

function renderBattle() {
    const monster = monsters.find(m => m.key === state.fightMonsterKey);
    const weapon = currentWeapon();
    const monsterPct = Math.max(state.monsterHealth, 0) / monster.health * 100;

    screenEl.innerHTML = `
        <div class="panel-text" id="battleText">The ${monster.name} sizes you up.</div>
        <div class="battle-stage">
            <div class="fighter player" id="playerFighter">
                <span class="sprite">\ud83e\uddd1\u200d\ud83d\udcbc</span>
                <div class="fighter-name">You (${weapon.name})</div>
                <div class="bar bar-health"><div class="bar-fill" style="width:${Math.max(state.health,0) / state.maxHealth * 100}%"></div></div>
            </div>
            <span class="vs-label">VS</span>
            <div class="fighter monster" id="monsterFighter">
                <span class="sprite">${monster.icon}</span>
                <div class="fighter-name">${monster.name}</div>
                <div class="bar bar-monster"><div class="bar-fill" id="monsterBarFill" style="width:${monsterPct}%"></div></div>
            </div>
        </div>
        <div class="action-row">
            <button class="btn btn-danger" id="actAttack">Attack</button>
            <button class="btn" id="actDodge">Dodge</button>
            <button class="btn" id="actRun">Run</button>
        </div>
    `;

    document.querySelector("#actAttack").onclick = () => resolveTurn("attack");
    document.querySelector("#actDodge").onclick = () => resolveTurn("dodge");
    document.querySelector("#actRun").onclick = () => resolveTurn("run");
    setActionButtonsEnabled(true);
}

function setActionButtonsEnabled(enabled) {
    ["#actAttack", "#actDodge", "#actRun"].forEach(sel => {
        const btn = document.querySelector(sel);
        if (btn) btn.disabled = !enabled;
    });
}

function telegraphTurn() {
    const monsterEl = document.querySelector("#monsterFighter");
    const monster = monsters.find(m => m.key === state.fightMonsterKey);
    const battleText = document.querySelector("#battleText");
    if (monsterEl) monsterEl.classList.add("telegraph");
    if (battleText) battleText.innerText = "The " + monster.name + " winds up an attack! Attack, dodge, or run?";
}

async function resolveTurn(action) {
    if (state.inFightAction) return;
    state.inFightAction = true;
    setActionButtonsEnabled(false);

    const monster = monsters.find(m => m.key === state.fightMonsterKey);
    const monsterEl = document.querySelector("#monsterFighter");
    const playerEl = document.querySelector("#playerFighter");
    const battleText = document.querySelector("#battleText");
    monsterEl.classList.remove("telegraph");

    if (action === "attack") {
        const weapon = currentWeapon();
        const dmg = weapon.power + randInt(0, Math.ceil(weapon.power * 0.25));
        await playAnim(playerEl, "lunge-right", 400);
        state.monsterHealth -= dmg;
        showDamagePopup(monsterEl, "-" + dmg);
        monsterEl.classList.add("hit");
        updateMonsterBar(monster);
        await wait(350);
        monsterEl.classList.remove("hit");

        if (state.monsterHealth <= 0) {
            await handleMonsterDefeat(monster, monsterEl);
            return;
        }

        battleText.innerText = "You strike the " + monster.name + " for " + dmg + " damage. It retaliates!";
        await wait(300);
        const retaliation = monster.level + randInt(0, Math.ceil(monster.level * 0.3));
        await playAnim(monsterEl, "lunge-left", 400);
        state.health -= retaliation;
        showDamagePopup(playerEl, "-" + retaliation);
        playerEl.classList.add("hit");
        refreshTopBar();
        await wait(350);
        playerEl.classList.remove("hit");
        addLog("Traded blows with the " + monster.name + ": dealt " + dmg + ", took " + retaliation + ".");

    } else if (action === "dodge") {
        const success = Math.random() < 0.65;
        if (success) {
            battleText.innerText = "You dodge clean out of the way!";
            await playAnim(playerEl, "dodge-move", 350);
            showDamagePopup(playerEl, "DODGED", "miss");
            addLog("Dodged the " + monster.name + "'s attack.");
        } else {
            const dmg = Math.ceil(monster.level * 0.5) + randInt(0, 2);
            battleText.innerText = "You try to dodge but it clips you anyway.";
            await playAnim(monsterEl, "lunge-left", 400);
            state.health -= dmg;
            showDamagePopup(playerEl, "-" + dmg);
            playerEl.classList.add("hit");
            refreshTopBar();
            await wait(350);
            playerEl.classList.remove("hit");
            addLog("Dodge failed, took " + dmg + " reduced damage.");
        }

    } else if (action === "run") {
        const success = Math.random() < 0.55;
        if (success) {
            addLog("Fled from the " + monster.name + ".");
            state.inFightAction = false;
            state.screen = "cave";
            render();
            return;
        } else {
            const dmg = monster.level + randInt(0, 3);
            battleText.innerText = "You can't get away!";
            await playAnim(monsterEl, "lunge-left", 400);
            state.health -= dmg;
            showDamagePopup(playerEl, "-" + dmg);
            playerEl.classList.add("hit");
            refreshTopBar();
            await wait(350);
            playerEl.classList.remove("hit");
            addLog("Failed to flee, took " + dmg + " damage.");
        }
    }

    refreshTopBar();

    if (state.health <= 0) {
        await handlePlayerDeath(monster);
        return;
    }

    state.inFightAction = false;
    setActionButtonsEnabled(true);
    telegraphTurn();
}

function updateMonsterBar(monster) {
    const fill = document.querySelector("#monsterBarFill");
    if (fill) fill.style.width = (Math.max(state.monsterHealth, 0) / monster.health * 100) + "%";
}

async function handleMonsterDefeat(monster, monsterEl) {
    const battleText = document.querySelector("#battleText");
    battleText.innerText = "The " + monster.name + " falls!";
    await playAnim(monsterEl, "death", 700);

    const goldReward = randInt(monster.goldRange[0], monster.goldRange[1]);
    const xpReward = monster.level * 2;
    const lootAmount = randInt(monster.lootRange[0], monster.lootRange[1]);
    state.gold += goldReward;
    state.loot[monster.loot] += lootAmount;
    gainXp(xpReward);
    addLog("Defeated the " + monster.name + "! +" + xpReward + " XP, +" + goldReward + " gold, +" + lootAmount + " " + lootMeta[monster.loot].name + ".");

    state.inFightAction = false;

    if (monster.key === "dragon") {
        state.screen = "gameover";
        state.outcome = "win";
        render();
        return;
    }

    state.screen = "cave";
    render();
}

async function handlePlayerDeath(monster) {
    addLog("You were defeated by the " + monster.name + ".");
    state.inFightAction = false;
    state.screen = "gameover";
    state.outcome = "lose";
    render();
}

function renderGameOver() {
    const win = state.outcome === "win";
    screenEl.innerHTML = `
        <div class="panel-text">
            ${win
                ? "The dragon lets out a final roar and collapses. The town is free \u2014 you are its hero, with " + state.xp + " XP and " + state.gold + " gold to your name."
                : "Your vision fades... you have fallen. The dragon remains undefeated."}
        </div>
        <button class="btn btn-restart" id="restartBtn">Play Again</button>
    `;
    document.querySelector("#restartBtn").onclick = () => {
        state = freshState();
        logEl.innerHTML = "";
        addLog("A new adventure begins.");
        render();
    };
}

/* ---------- Boot ---------- */

addLog("A new adventure begins.");
render();