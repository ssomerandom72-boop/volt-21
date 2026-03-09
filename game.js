// ═══════════════════════════════════════════════
//  VOLTAGE 21 — Survival Horror Blackjack
// ═══════════════════════════════════════════════

// ── CANVAS BACKGROUND ──
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

function resizeBg() {
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
resizeBg();
window.addEventListener('resize', resizeBg);

function drawBg() {
    const w = bgCanvas.width, h = bgCanvas.height;
    bgCtx.fillStyle = '#02000a';
    bgCtx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const grad = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
    grad.addColorStop(0, 'rgba(12,0,22,0.9)');
    grad.addColorStop(0.6, 'rgba(6,0,12,0.95)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, w, h);

    bgCtx.beginPath();
    bgCtx.ellipse(cx, cy, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
    bgCtx.strokeStyle = 'rgba(80,0,120,0.18)';
    bgCtx.lineWidth = 2;
    bgCtx.stroke();

    bgCtx.strokeStyle = 'rgba(60,0,100,0.12)';
    bgCtx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        bgCtx.beginPath(); bgCtx.moveTo(40 + i * 8, 0); bgCtx.lineTo(40 + i * 8, h); bgCtx.stroke();
        bgCtx.beginPath(); bgCtx.moveTo(w - 40 - i * 8, 0); bgCtx.lineTo(w - 40 - i * 8, h); bgCtx.stroke();
    }

    if (Math.random() < 0.008) {
        bgCtx.strokeStyle = `rgba(120,0,255,${Math.random() * 0.4})`;
        bgCtx.lineWidth = 1;
        bgCtx.beginPath();
        const sx = Math.random() < 0.5 ? 50 : w - 50;
        bgCtx.moveTo(sx, Math.random() * h);
        for (let i = 0; i < 6; i++) bgCtx.lineTo(sx + (Math.random() - 0.5) * 30, Math.random() * h);
        bgCtx.stroke();
    }

    requestAnimationFrame(drawBg);
}
drawBg();

// ── AUDIO ──
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playShock() {
    if (!audioCtx) return;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / audioCtx.sampleRate, env = Math.exp(-t * 5);
        data[i] = (Math.random() * 2 - 1) * env * 0.8 + Math.sin(t * 800 * Math.PI * 2) * env * 0.3;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain(); gain.gain.value = 0.7;
    src.connect(gain); gain.connect(audioCtx.destination);
    src.start();
}

function playBigShock() {
    if (!audioCtx) return;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.0, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / audioCtx.sampleRate, env = Math.exp(-t * 3);
        data[i] = (Math.random() * 2 - 1) * env * 1.0 + Math.sin(t * 400 * Math.PI * 2) * env * 0.5;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain(); gain.gain.value = 0.9;
    src.connect(gain); gain.connect(audioCtx.destination);
    src.start();
}

function playCardFlip() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
}

function playBluffSound() {
    if (!audioCtx) return;
    [300, 400, 600].forEach((freq, i) => {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        const t = audioCtx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(0.08, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
    });
}

function playReveal() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.start(); osc.stop(audioCtx.currentTime + 0.35);
}

function playBonusSound() {
    if (!audioCtx) return;
    [440, 554, 659].forEach((freq, i) => {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        const t = audioCtx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.2);
    });
}

// ── CARDS ──
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const HIGH_RANKS = ['9','10','J','Q','K','10','J','Q','K','10']; // weighted high
const LOW_RANKS  = ['2','3','4','2','3','4','2','3','A','5'];     // weighted low

function makeDeck() { return shuffle(SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r })))); }
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function cardValue(c) {
    if (['J','Q','K'].includes(c.rank)) return 10;
    if (c.rank === 'A') return 11;
    return parseInt(c.rank);
}

function handTotal(hand) {
    let total = 0, aces = 0;
    for (const c of hand) { total += cardValue(c); if (c.rank === 'A') aces++; }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function isBust(hand)       { return handTotal(hand) > 21; }
function isBlackjack(hand)  { return hand.length === 2 && handTotal(hand) === 21; }
function isRedSuit(suit)    { return suit === '♥' || suit === '♦'; }

function riggableCard(rankPool) {
    const rank = rankPool[Math.floor(Math.random() * rankPool.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return { suit, rank };
}

// ── BONUS CARDS ──
const BONUS_DEFS = {
    double_shock: {
        name: 'OVERLOAD',
        icon: '⚡⚡',
        desc: 'Next shock you deal costs 2 lives',
    },
    loaded_high: {
        name: 'RIGGED HIGH',
        icon: '🂱',
        desc: "Opponent's next hand is dangerously high",
    },
    loaded_low: {
        name: 'RIGGED LOW',
        icon: '🂢',
        desc: "Opponent's next hand is pathetically low",
    },
    insulate: {
        name: 'INSULATOR',
        icon: '🛡',
        desc: 'Block the next shock you receive',
    },
    surge: {
        name: 'SURGE',
        icon: '⚡',
        desc: 'Instantly deal 1 shock to opponent',
    },
};

const BONUS_POOL = ['double_shock','loaded_high','loaded_low','insulate','surge'];

function randomBonus() {
    return BONUS_POOL[Math.floor(Math.random() * BONUS_POOL.length)];
}

// ── STATE ──
const MAX_LIVES  = 3;
const MAX_ROUNDS = 5;
let gameMode = 'local';
const online = { peer: null, conn: null, isHost: false, roomCode: '', _resolvers: {} };
let state = {};

function resetState() {
    state = {
        round: 1,
        deck: makeDeck(),
        p1: {
            lives: MAX_LIVES, hand: [], roundWins: 0,
            bonusCards: [], name: 'Player 1',
            nextHandRig: null, // 'high' | 'low'
            shieldNext: false,
        },
        p2: {
            lives: MAX_LIVES, hand: [], roundWins: 0,
            bonusCards: [], name: 'Player 2',
            nextHandRig: null,
            shieldNext: false,
        },
        tension: 0,
        phase: 'deal',
        isAnimating: false,
    };
}

// ── UI ELEMENTS ──
const ui = {
    p1Lives:      document.getElementById('p1-lives'),
    p2Lives:      document.getElementById('p2-lives'),
    p1Name:       document.getElementById('p1-name-label'),
    p2Name:       document.getElementById('p2-name-label'),
    roundDisplay: document.getElementById('round-display'),
    tensionBar:   document.getElementById('tension-bar'),
    bluffFill:    document.getElementById('bluff-fill'),
    messageBox:   document.getElementById('message-box'),
    handArea:     document.getElementById('hand-area'),
    cardsRow:     document.getElementById('cards-row'),
    handValue:    document.getElementById('hand-value'),
    oppArea:      document.getElementById('opponent-area'),
    oppCardsRow:  document.getElementById('opp-cards-row'),
    oppStatus:    document.getElementById('opp-status'),
    actionArea:   document.getElementById('action-area'),
    actionLabel:  document.getElementById('action-label'),
    bluffRow:     document.getElementById('bluff-row'),
    drawRow:      document.getElementById('draw-row'),
    gameOver:     document.getElementById('game-over-screen'),
    gameOverTitle:document.getElementById('game-over-title'),
    shockOverlay: document.getElementById('shock-overlay'),
    turnBanner:   document.getElementById('turn-banner'),
};

// ── BONUS CARD UI ──
// Inject bonus card panels into the info-bar panels
function injectBonusUI() {
    const p1Panel = document.getElementById('p1-panel');
    const p2Panel = document.getElementById('p2-panel');

    const p1Bonus = document.createElement('div');
    p1Bonus.id = 'p1-bonus-row';
    p1Bonus.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;justify-content:center;min-height:20px;margin-top:4px;';
    p1Panel.appendChild(p1Bonus);

    const p2Bonus = document.createElement('div');
    p2Bonus.id = 'p2-bonus-row';
    p2Bonus.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;justify-content:center;min-height:20px;margin-top:4px;';
    p2Panel.appendChild(p2Bonus);

    // Round win tracker
    const centerInfo = document.getElementById('center-info');
    const winRow = document.createElement('div');
    winRow.id = 'win-row';
    winRow.style.cssText = 'display:flex;gap:6px;align-items:center;font-size:0.5em;letter-spacing:4px;color:#440055;';
    winRow.innerHTML = '<span id="p1-wins">P1: 0</span><span style="color:#220033">|</span><span id="p2-wins">P2: 0</span>';
    centerInfo.appendChild(winRow);
}

function renderBonusCards(who) {
    const el = document.getElementById(`${who}-bonus-row`);
    if (!el) return;
    el.innerHTML = '';
    for (const card of state[who].bonusCards) {
        const def = BONUS_DEFS[card];
        const chip = document.createElement('span');
        chip.title = def.desc;
        chip.textContent = def.icon;
        chip.style.cssText = 'font-size:1.1em;cursor:default;filter:drop-shadow(0 0 4px rgba(180,0,255,0.6));';
        el.appendChild(chip);
    }
}

// ── HELPERS ──
const wait = ms => new Promise(r => setTimeout(r, ms));

async function showMessage(text, duration = 2000) {
    ui.messageBox.textContent = text;
    ui.messageBox.classList.remove('hidden');
    if (gameMode === 'online' && online.isHost && online.conn?.open)
        online.conn.send({ type: 'message', text, duration });
    await wait(duration);
    ui.messageBox.classList.add('hidden');
}

function renderLives(el, lives) {
    el.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
        const span = document.createElement('span');
        span.textContent = '♥';
        span.className = i < lives ? 'life-on' : 'life-off';
        el.appendChild(span);
    }
}

function renderCard(card, faceDown = false) {
    const el = document.createElement('div');
    el.className = 'card';
    if (faceDown) { el.classList.add('face-down'); el.textContent = '?'; }
    else {
        if (isRedSuit(card.suit)) el.classList.add('red-suit');
        el.textContent = card.rank + card.suit;
    }
    return el;
}

function updateUI() {
    renderLives(ui.p1Lives, state.p1.lives);
    renderLives(ui.p2Lives, state.p2.lives);
    ui.p1Name.textContent = state.p1.name;
    ui.p2Name.textContent = state.p2.name;
    ui.roundDisplay.textContent = `ROUND ${state.round} / ${MAX_ROUNDS}`;
    ui.tensionBar.style.width = `${Math.min(100, state.tension)}%`;

    const p1Wins = document.getElementById('p1-wins');
    const p2Wins = document.getElementById('p2-wins');
    if (p1Wins) p1Wins.textContent = `${state.p1.name.split(' ')[0]}: ${state.p1.roundWins}`;
    if (p2Wins) p2Wins.textContent = `${state.p2.name.split(' ')[0]}: ${state.p2.roundWins}`;

    // Bluff fill = tension normalized
    ui.bluffFill.style.height = `${Math.min(100, state.tension)}%`;

    renderBonusCards('p1');
    renderBonusCards('p2');
}

function renderHand(hand, showAll = true) {
    ui.cardsRow.innerHTML = '';
    for (let i = 0; i < hand.length; i++)
        ui.cardsRow.appendChild(renderCard(hand[i], !showAll && i > 0));
    const total = handTotal(hand);
    ui.handValue.textContent = showAll
        ? `Total: ${total}${isBust(hand) ? ' — BUST' : isBlackjack(hand) ? ' — BLACKJACK!' : ''}`
        : `Showing: ${cardValue(hand[0])}`;
    ui.handArea.classList.remove('hidden');
}

function renderOppHand(hand, showAll = false, statusText = '') {
    ui.oppCardsRow.innerHTML = '';
    for (const card of hand)
        ui.oppCardsRow.appendChild(renderCard(card, !showAll));
    ui.oppStatus.textContent = statusText;
    ui.oppArea.classList.remove('hidden');
}

// ── SHOCK ──
async function doShock(who, double = false) {
    initAudio();
    const lives = double ? 2 : 1;

    // Check shield
    if (state[who].shieldNext) {
        state[who].shieldNext = false;
        const shieldIdx = state[who].bonusCards.indexOf('insulate');
        if (shieldIdx !== -1) state[who].bonusCards.splice(shieldIdx, 1);
        await showMessage(`${state[who].name}'s INSULATOR absorbs the shock!`, 1800);
        updateUI();
        return;
    }

    double ? playBigShock() : playShock();
    ui.shockOverlay.classList.remove('shocking');
    void ui.shockOverlay.offsetWidth;
    ui.shockOverlay.classList.add('shocking');

    const panel = document.getElementById(`${who}-panel`);
    panel.style.boxShadow = double
        ? '0 0 60px rgba(80,200,255,1), 0 0 100px rgba(255,255,255,0.5)'
        : '0 0 40px rgba(80,200,255,0.9)';
    await wait(double ? 500 : 300);
    panel.style.boxShadow = '';

    state[who].lives = Math.max(0, state[who].lives - lives);
    updateUI();
    await wait(200);
}

// ── DEAL ──
function drawCard() {
    if (state.deck.length < 8) state.deck = [...state.deck, ...makeDeck()];
    return state.deck.pop();
}

function dealHand(who) {
    const rig = state[who].nextHandRig;
    state[who].nextHandRig = null;
    if (rig === 'high') {
        return [riggableCard(HIGH_RANKS), riggableCard(HIGH_RANKS)];
    } else if (rig === 'low') {
        return [riggableCard(LOW_RANKS), riggableCard(LOW_RANKS)];
    }
    return [drawCard(), drawCard()];
}

async function dealRound() {
    state.p1.hand = dealHand('p1');
    state.p2.hand = dealHand('p2');
    playCardFlip();
    await wait(200);
    playCardFlip();
    updateUI();
}

// ── BONUS CARD AWARD ──
async function awardBonus(who) {
    const card = randomBonus();
    playBonusSound();

    // Surge activates immediately
    if (card === 'surge') {
        const opp = who === 'p1' ? 'p2' : 'p1';
        await showMessage(`${state[who].name} draws SURGE — instant shock!`, 2000);
        const useDouble = consumeDoubleShock(who);
        await doShock(opp, useDouble);
        return;
    }

    // Insulate activates passively
    if (card === 'insulate') {
        state[who].shieldNext = true;
    }

    // Rigged hands apply to opponent
    if (card === 'loaded_high') {
        const opp = who === 'p1' ? 'p2' : 'p1';
        state[opp].nextHandRig = 'high';
    }
    if (card === 'loaded_low') {
        const opp = who === 'p1' ? 'p2' : 'p1';
        state[opp].nextHandRig = 'low';
    }

    state[who].bonusCards.push(card);
    updateUI();
    const def = BONUS_DEFS[card];
    await showMessage(`${state[who].name} earns ${def.icon} ${def.name}!`, 2200);
}

function consumeDoubleShock(who) {
    const idx = state[who].bonusCards.indexOf('double_shock');
    if (idx !== -1) { state[who].bonusCards.splice(idx, 1); return true; }
    return false;
}

// ── ACTION WAITING ──
let _actionResolve = null;

function waitForAction(who, busted = false) {
    return new Promise(resolve => {
        _actionResolve = resolve;
        ui.actionLabel.textContent = busted
            ? `${state[who].name} — BUSTED. Bluff or fold?`
            : `${state[who].name}'s Turn`;
        document.getElementById('btn-hit').disabled   = busted;
        document.getElementById('btn-stand').disabled = busted;
        ui.drawRow.classList.remove('hidden');
        resetBluffRow();
        ui.actionArea.classList.remove('hidden');
    });
}

function waitForBluffResponse(who) {
    return new Promise(resolve => {
        _actionResolve = null;
        ui.actionLabel.textContent = `${state[who].name}: Call or Fold?`;
        ui.drawRow.classList.add('hidden');
        ui.bluffRow.innerHTML = `
            <button id="btn-call" class="danger">⚡ Call Bluff</button>
            <button id="btn-fold-bluff" class="safe">Fold</button>`;
        document.getElementById('btn-call').onclick      = () => { resetBluffRow(); ui.drawRow.classList.remove('hidden'); resolve('call'); };
        document.getElementById('btn-fold-bluff').onclick = () => { resetBluffRow(); ui.drawRow.classList.remove('hidden'); resolve('fold'); };
        ui.bluffRow.classList.remove('hidden');
        ui.actionArea.classList.remove('hidden');
    });
}

function resetBluffRow() {
    ui.bluffRow.innerHTML = `
        <button id="btn-bluff" class="danger">⚡ Bluff</button>
        <button id="btn-fold"  class="safe">Fold</button>`;
    document.getElementById('btn-bluff').onclick = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('bluff'); } };
    document.getElementById('btn-fold').onclick  = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('fold'); } };
    ui.bluffRow.classList.remove('hidden');
}

// Button wiring
document.getElementById('btn-hit').onclick   = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('hit'); } };
document.getElementById('btn-stand').onclick = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('stand'); } };
document.getElementById('btn-bluff').onclick = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('bluff'); } };
document.getElementById('btn-fold').onclick  = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('fold'); } };
document.getElementById('btn-restart').onclick = () => { document.getElementById('game-over-screen').classList.add('hidden'); startGame(); };

// ── PLAYER TURN (LOCAL) ──
async function localPlayerTurn(who) {
    const player = state[who];
    const opp    = who === 'p1' ? state.p2 : state.p1;
    const oppWho = who === 'p1' ? 'p2' : 'p1';

    // Hide everything, show turn banner
    ui.handArea.classList.add('hidden');
    ui.oppArea.classList.add('hidden');
    ui.actionArea.classList.add('hidden');
    ui.turnBanner.textContent = `${player.name}'s Turn — Look Away, ${opp.name}`;
    ui.turnBanner.classList.remove('hidden');
    await wait(1800);
    ui.turnBanner.classList.add('hidden');

    renderHand(player.hand, true);
    renderOppHand(opp.hand, false, '');

    while (true) {
        const busted = isBust(player.hand);
        const action = await waitForAction(who, busted);
        initAudio();
        ui.actionArea.classList.add('hidden');
        document.getElementById('btn-hit').disabled   = false;
        document.getElementById('btn-stand').disabled = false;

        if (action === 'hit') {
            player.hand.push(drawCard());
            playCardFlip();
            renderHand(player.hand, true);

        } else if (action === 'stand') {
            if (busted) {
                await showMessage(`${player.name} busts!`, 1400);
                return { result: 'bust', who };
            }
            return { result: 'stand', who };

        } else if (action === 'bluff') {
            playBluffSound();
            state.tension = Math.min(100, state.tension + 15);
            updateUI();
            await showMessage(`${player.name} raises the stakes!`, 1400);

            // Opponent responds
            ui.turnBanner.textContent = `${opp.name} — Call the Bluff or Fold?`;
            ui.turnBanner.classList.remove('hidden');
            await wait(1400);
            ui.turnBanner.classList.add('hidden');
            renderOppHand(opp.hand, true, '');

            const response = await waitForBluffResponse(oppWho);
            ui.actionArea.classList.add('hidden');

            if (response === 'fold') {
                await showMessage(`${opp.name} folds — coward.`, 1600);
                const useDouble = consumeDoubleShock(who);
                opp.lives = Math.max(0, opp.lives - (useDouble ? 2 : 1));
                updateUI();
                await doShock(oppWho, useDouble);
                return { result: 'bluff-win', who };
            } else {
                // Call — reveal and compare
                playReveal();
                renderHand(player.hand, true);
                renderOppHand(opp.hand, true, '');
                await showMessage('Cards on the table.', 1400);

                const pt = handTotal(player.hand), ot = handTotal(opp.hand);
                const blufferWins = !isBust(player.hand) && (isBust(opp.hand) || pt >= ot);

                if (blufferWins) {
                    await showMessage(`${player.name}'s bluff holds! ${opp.name} pays!`, 2000);
                    const useDouble = consumeDoubleShock(who);
                    await doShock(oppWho, useDouble);
                    return { result: 'bluff-win', who };
                } else {
                    await showMessage(`Bluff called! ${player.name} pays!`, 2000);
                    const useDouble = consumeDoubleShock(oppWho);
                    await doShock(who, useDouble);
                    return { result: 'bluff-loss', who };
                }
            }

        } else if (action === 'fold') {
            await showMessage(`${player.name} folds.`, 1400);
            const useDouble = consumeDoubleShock(oppWho);
            await doShock(who, useDouble);
            return { result: 'fold', who };
        }
    }
}

// ── RESOLVE ROUND (LOCAL) ──
async function resolveRound(r1, r2) {
    // r1/r2 = { result, who } from each player's turn
    // Bluff/fold results are already settled inline, just need to track round wins
    const p1Done = r1.result;
    const p2Done = r2 ? r2.result : null;

    // If a player already won via bluff, count that as their round win
    if (p1Done === 'bluff-win') { state.p1.roundWins++; updateUI(); return; }
    if (p1Done === 'bluff-loss' && r2 === null) { state.p2.roundWins++; updateUI(); return; }
    if (p1Done === 'fold') { state.p2.roundWins++; updateUI(); return; }
    if (p2Done === 'bluff-win') { state.p2.roundWins++; updateUI(); return; }
    if (p2Done === 'fold') { state.p1.roundWins++; updateUI(); return; }

    // Standard showdown
    playReveal();
    renderHand(state.p1.hand, true);
    renderOppHand(state.p2.hand, true, `${state.p2.name}: ${handTotal(state.p2.hand)}`);
    await showMessage('Showdown.', 1200);

    const t1 = handTotal(state.p1.hand), bust1 = isBust(state.p1.hand);
    const t2 = handTotal(state.p2.hand), bust2 = isBust(state.p2.hand);
    const bj1 = isBlackjack(state.p1.hand), bj2 = isBlackjack(state.p2.hand);

    if (bust1 && bust2) {
        await showMessage('Both bust. Neither wins the round.', 2000);
        return;
    }

    let winner = null;
    if (bust1) winner = 'p2';
    else if (bust2) winner = 'p1';
    else if (t1 > t2) winner = 'p1';
    else if (t2 > t1) winner = 'p2';
    else { await showMessage('Tie. Round is a draw.', 1800); return; }

    const loser = winner === 'p1' ? 'p2' : 'p1';
    const winName = state[winner].name;
    const bjWin = winner === 'p1' ? bj1 : bj2;

    state[winner].roundWins++;
    updateUI();

    if (bjWin) {
        await showMessage(`${winName} hits BLACKJACK! Shock!`, 2000);
        const useDouble = consumeDoubleShock(winner);
        await doShock(loser, useDouble);
    } else {
        await showMessage(`${winName} wins the round!`, 1800);
        await awardBonus(winner);
    }
}

// ── GAME OVER CHECK ──
function checkGameOver() {
    if (state.p1.lives <= 0) return { over: true, winner: 'p2' };
    if (state.p2.lives <= 0) return { over: true, winner: 'p1' };
    if (state.round > MAX_ROUNDS) {
        if (state.p1.roundWins > state.p2.roundWins) return { over: true, winner: 'p1' };
        if (state.p2.roundWins > state.p1.roundWins) return { over: true, winner: 'p2' };
        return { over: true, winner: 'tie' };
    }
    return { over: false };
}

function showGameOver(winner) {
    const screen = document.getElementById('game-over-screen');
    const title  = document.getElementById('game-over-title');
    const sub    = document.getElementById('game-over-sub');

    if (winner === 'tie') {
        title.textContent = 'DEAD HEAT';
        title.style.color = '#888';
        sub.textContent   = 'Nobody walks away clean.';
    } else {
        title.textContent = 'FLATLINE';
        title.style.color = '#aa00ff';
        sub.textContent   = `${state[winner].name} survives. ${state[winner].roundWins} round wins.`;
    }
    screen.classList.remove('hidden');
}

// ── LOCAL GAME LOOP ──
async function runLocalGame() {
    while (true) {
        await dealRound();

        const r1 = await localPlayerTurn('p1');
        ui.handArea.classList.add('hidden');
        ui.oppArea.classList.add('hidden');

        let r2 = null;
        // Only play p2 turn if p1 didn't end round early (bluff/fold already settled)
        const p1EarlyEnd = ['bluff-win','bluff-loss','fold'].includes(r1.result);
        if (!p1EarlyEnd) {
            r2 = await localPlayerTurn('p2');
            ui.handArea.classList.add('hidden');
            ui.oppArea.classList.add('hidden');
        }

        await resolveRound(r1, r2);

        const check = checkGameOver();
        if (check.over) { showGameOver(check.winner); return; }

        state.round++;
        state.tension = Math.min(100, state.tension + 8);
        updateUI();
        await showMessage(`ROUND ${state.round}`, 1600);
    }
}

// ── ONLINE NETWORKING ──
function generateCode() {
    return Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 33)]).join('');
}

function sendToGuest(data) { if (online.conn?.open) online.conn.send(data); }
function sendToHost(data)  { if (online.conn?.open) online.conn.send(data); }

function broadcastState() {
    sendToGuest({
        type: 'state',
        s: {
            p1lives: state.p1.lives, p2lives: state.p2.lives,
            p1wins: state.p1.roundWins, p2wins: state.p2.roundWins,
            p1bonus: state.p1.bonusCards, p2bonus: state.p2.bonusCards,
            round: state.round, tension: state.tension,
        }
    });
}

function applyNetState(s) {
    state.p1.lives = s.p1lives; state.p2.lives = s.p2lives;
    state.p1.roundWins = s.p1wins; state.p2.roundWins = s.p2wins;
    state.p1.bonusCards = s.p1bonus || []; state.p2.bonusCards = s.p2bonus || [];
    state.round = s.round; state.tension = s.tension;
    updateUI();
}

function handleGuestMessage(data) {
    if (data.type === 'action' && online._resolvers.action) {
        online._resolvers.action(data.value);
        delete online._resolvers.action;
    }
}

function handleHostMessage(data) {
    switch (data.type) {
        case 'message': showMessage(data.text, data.duration); break;
        case 'state':   applyNetState(data.s); break;
        case 'yourTurn':
            applyNetState(data.s);
            startGuestTurnUI(data.hand);
            break;
        case 'shock':
            doShock(data.who, data.double);
            break;
        case 'reveal':
            playReveal();
            renderHand(data.guestHand, true);
            renderOppHand(data.hostHand, true, `Opponent: ${handTotal(data.hostHand)}`);
            break;
        case 'bonus':
            playBonusSound();
            // guest sees what bonus host got
            break;
        case 'oppAction':
            const opp = data.action;
            if (opp === 'hit') ui.oppStatus.textContent = 'Opponent hits...';
            if (opp === 'stand') ui.oppStatus.textContent = 'Opponent stands.';
            if (opp === 'bluff') { ui.oppStatus.textContent = '⚡ OPPONENT BLUFFS!'; playBluffSound(); }
            break;
        case 'waitBluffCall':
            startGuestBluffCallUI();
            break;
        case 'gameOver':
            applyNetState(data.s);
            showGameOver(data.winner);
            break;
    }
}

function startGuestTurnUI(hand) {
    state.p2.hand = hand;
    renderHand(hand, true);
    ui.actionLabel.textContent = 'Your Turn';
    ui.drawRow.classList.remove('hidden');
    resetBluffRow();
    ui.actionArea.classList.remove('hidden');

    const send = (v) => { ui.actionArea.classList.add('hidden'); sendToHost({ type: 'action', value: v }); };
    document.getElementById('btn-hit').onclick   = () => send('hit');
    document.getElementById('btn-stand').onclick = () => send('stand');
    document.getElementById('btn-bluff').onclick = () => send('bluff');
    document.getElementById('btn-fold').onclick  = () => send('fold');
}

function startGuestBluffCallUI() {
    waitForBluffResponse('p2').then(r => {
        ui.actionArea.classList.add('hidden');
        sendToHost({ type: 'action', value: r });
    });
}

// ── ONLINE HOST GAME LOOP ──
async function waitGuest() {
    return new Promise(r => { online._resolvers.action = r; });
}

async function onlineHostPlayerTurn() {
    renderHand(state.p1.hand, true);
    sendToGuest({ type: 'message', text: "Opponent's turn...", duration: 500 });

    while (true) {
        const busted = isBust(state.p1.hand);
        const action = await waitForAction('p1', busted);
        initAudio();
        ui.actionArea.classList.add('hidden');
        document.getElementById('btn-hit').disabled   = false;
        document.getElementById('btn-stand').disabled = false;

        if (action === 'hit') {
            state.p1.hand.push(drawCard());
            playCardFlip();
            renderHand(state.p1.hand, true);
            sendToGuest({ type: 'oppAction', action: 'hit' });

        } else if (action === 'stand') {
            if (busted) {
                await showMessage('You bust!', 1400);
                return { result: 'bust', who: 'p1' };
            }
            sendToGuest({ type: 'oppAction', action: 'stand' });
            return { result: 'stand', who: 'p1' };

        } else if (action === 'bluff') {
            playBluffSound();
            state.tension = Math.min(100, state.tension + 15);
            sendToGuest({ type: 'oppAction', action: 'bluff' });
            sendToGuest({ type: 'waitBluffCall' });
            await showMessage('You bluff. Waiting...', 800);

            const response = await waitGuest();
            broadcastState();

            if (response === 'fold') {
                await showMessage(`${state.p2.name} folds — coward.`, 1600);
                sendToGuest({ type: 'message', text: 'You folded.', duration: 1400 });
                const useDouble = consumeDoubleShock('p1');
                state.p2.lives = Math.max(0, state.p2.lives - (useDouble ? 2 : 1));
                broadcastState();
                sendToGuest({ type: 'shock', who: 'p2', double: useDouble });
                await doShock('p2', useDouble);
                return { result: 'bluff-win', who: 'p1' };
            } else {
                sendToGuest({ type: 'reveal', hostHand: state.p1.hand, guestHand: state.p2.hand });
                playReveal();
                renderOppHand(state.p2.hand, true, '');
                await showMessage('Cards revealed.', 1200);
                const pt = handTotal(state.p1.hand), gt = handTotal(state.p2.hand);
                const blufferWins = !isBust(state.p1.hand) && (isBust(state.p2.hand) || pt >= gt);
                if (blufferWins) {
                    await showMessage(`Your bluff holds! ${state.p2.name} pays!`, 2000);
                    const useDouble = consumeDoubleShock('p1');
                    broadcastState();
                    sendToGuest({ type: 'shock', who: 'p2', double: useDouble });
                    await doShock('p2', useDouble);
                    return { result: 'bluff-win', who: 'p1' };
                } else {
                    await showMessage(`Bluff called! You pay!`, 2000);
                    const useDouble = consumeDoubleShock('p2');
                    broadcastState();
                    sendToGuest({ type: 'shock', who: 'p1', double: useDouble });
                    await doShock('p1', useDouble);
                    return { result: 'bluff-loss', who: 'p1' };
                }
            }

        } else if (action === 'fold') {
            sendToGuest({ type: 'message', text: 'Opponent folded.', duration: 1400 });
            const useDouble = consumeDoubleShock('p2');
            state.p1.lives = Math.max(0, state.p1.lives - (useDouble ? 2 : 1));
            broadcastState();
            sendToGuest({ type: 'shock', who: 'p1', double: useDouble });
            await doShock('p1', useDouble);
            return { result: 'fold', who: 'p1' };
        }
    }
}

async function onlineGuestPlayerTurn() {
    sendToGuest({
        type: 'yourTurn',
        hand: state.p2.hand,
        s: { p1lives: state.p1.lives, p2lives: state.p2.lives, p1wins: state.p1.roundWins, p2wins: state.p2.roundWins, p1bonus: state.p1.bonusCards, p2bonus: state.p2.bonusCards, round: state.round, tension: state.tension }
    });

    while (true) {
        const action = await waitGuest();

        if (action === 'hit') {
            state.p2.hand.push(drawCard());
            sendToGuest({ type: 'yourTurn', hand: state.p2.hand, s: { p1lives: state.p1.lives, p2lives: state.p2.lives, p1wins: state.p1.roundWins, p2wins: state.p2.roundWins, p1bonus: state.p1.bonusCards, p2bonus: state.p2.bonusCards, round: state.round, tension: state.tension } });
            await showMessage('Opponent hits.', 700);
            if (isBust(state.p2.hand)) {
                state.p2.lives = Math.max(0, state.p2.lives - 1);
                broadcastState();
                sendToGuest({ type: 'shock', who: 'p2', double: false });
                sendToGuest({ type: 'message', text: 'You bust!', duration: 1400 });
                await doShock('p2');
                return { result: 'bust', who: 'p2' };
            }

        } else if (action === 'stand') {
            await showMessage('Opponent stands.', 700);
            return { result: 'stand', who: 'p2' };

        } else if (action === 'bluff') {
            playBluffSound();
            state.tension = Math.min(100, state.tension + 15);
            await showMessage(`${state.p2.name} bluffs!`, 1400);
            sendToGuest({ type: 'message', text: 'You bluffed! Waiting...', duration: 1000 });

            const response = await waitForBluffResponse('p1');
            ui.actionArea.classList.add('hidden');
            sendToGuest({ type: 'message', text: response === 'call' ? 'Called!' : 'Folded!', duration: 1000 });

            if (response === 'fold') {
                await showMessage(`You fold. ${state.p2.name} wins this one.`, 1600);
                const useDouble = consumeDoubleShock('p2');
                state.p1.lives = Math.max(0, state.p1.lives - (useDouble ? 2 : 1));
                broadcastState();
                sendToGuest({ type: 'shock', who: 'p1', double: useDouble });
                await doShock('p1', useDouble);
                return { result: 'bluff-win', who: 'p2' };
            } else {
                sendToGuest({ type: 'reveal', hostHand: state.p1.hand, guestHand: state.p2.hand });
                playReveal();
                renderOppHand(state.p2.hand, true, '');
                await showMessage('Cards revealed.', 1200);
                const pt = handTotal(state.p1.hand), gt = handTotal(state.p2.hand);
                const blufferWins = !isBust(state.p2.hand) && (isBust(state.p1.hand) || gt >= pt);
                if (blufferWins) {
                    await showMessage(`${state.p2.name}'s bluff holds! You pay!`, 2000);
                    const useDouble = consumeDoubleShock('p2');
                    broadcastState();
                    sendToGuest({ type: 'shock', who: 'p1', double: useDouble });
                    await doShock('p1', useDouble);
                    return { result: 'bluff-win', who: 'p2' };
                } else {
                    await showMessage(`Bluff called! ${state.p2.name} pays!`, 2000);
                    const useDouble = consumeDoubleShock('p1');
                    broadcastState();
                    sendToGuest({ type: 'shock', who: 'p2', double: useDouble });
                    await doShock('p2', useDouble);
                    return { result: 'bluff-loss', who: 'p2' };
                }
            }

        } else if (action === 'fold') {
            await showMessage(`${state.p2.name} folds.`, 1400);
            const useDouble = consumeDoubleShock('p1');
            state.p2.lives = Math.max(0, state.p2.lives - (useDouble ? 2 : 1));
            broadcastState();
            sendToGuest({ type: 'shock', who: 'p2', double: useDouble });
            sendToGuest({ type: 'message', text: 'You folded.', duration: 1400 });
            await doShock('p2', useDouble);
            return { result: 'fold', who: 'p2' };
        }
    }
}

async function onlineResolveRound(r1, r2) {
    const p1Early = ['bluff-win','bluff-loss','fold'].includes(r1.result);
    const p2Early = r2 && ['bluff-win','bluff-loss','fold'].includes(r2.result);

    if (p1Early || p2Early) {
        if (r1.result === 'bluff-win' || (r2?.result === 'fold')) state.p1.roundWins++;
        else if (r1.result === 'fold' || r2?.result === 'bluff-win') state.p2.roundWins++;
        else if (r1.result === 'bluff-loss') state.p2.roundWins++;
        broadcastState();
        return;
    }

    if (r1.result === 'bust') { state.p2.roundWins++; broadcastState(); return; }
    if (r2?.result === 'bust') { state.p1.roundWins++; broadcastState(); return; }

    const t1 = handTotal(state.p1.hand), bust1 = isBust(state.p1.hand);
    const t2 = handTotal(state.p2.hand), bust2 = isBust(state.p2.hand);
    const bj1 = isBlackjack(state.p1.hand), bj2 = isBlackjack(state.p2.hand);

    sendToGuest({ type: 'reveal', hostHand: state.p1.hand, guestHand: state.p2.hand });
    playReveal();
    renderOppHand(state.p2.hand, true, `Opponent: ${t2}`);
    await showMessage('Showdown.', 1200);

    if (bust1 && bust2) { await showMessage('Both bust. Draw.', 1800); broadcastState(); return; }

    let winner = null;
    if (bust1) winner = 'p2';
    else if (bust2) winner = 'p1';
    else if (t1 > t2) winner = 'p1';
    else if (t2 > t1) winner = 'p2';
    else { await showMessage('Tie. Draw.', 1800); broadcastState(); return; }

    const loser  = winner === 'p1' ? 'p2' : 'p1';
    const bjWin  = winner === 'p1' ? bj1 : bj2;
    state[winner].roundWins++;

    if (bjWin) {
        await showMessage(`${state[winner].name} — BLACKJACK! Shock!`, 2000);
        const useDouble = consumeDoubleShock(winner);
        broadcastState();
        sendToGuest({ type: 'shock', who: loser, double: useDouble });
        await doShock(loser, useDouble);
    } else {
        await showMessage(`${state[winner].name} wins the round!`, 1800);
        await awardBonus(winner);
        broadcastState();
        sendToGuest({ type: 'bonus', who: winner });
    }
    broadcastState();
}

async function runOnlineHostGame() {
    resetState();
    updateUI();

    while (true) {
        await dealRound();
        broadcastState();

        const r1 = await onlineHostPlayerTurn();
        ui.handArea.classList.add('hidden');
        ui.oppArea.classList.add('hidden');

        const p1EarlyEnd = ['bluff-win','bluff-loss','fold'].includes(r1.result);
        let r2 = null;
        if (!p1EarlyEnd) {
            r2 = await onlineGuestPlayerTurn();
        }

        await onlineResolveRound(r1, r2);

        const check = checkGameOver();
        if (check.over) {
            broadcastState();
            sendToGuest({ type: 'gameOver', winner: check.winner === 'p1' ? 'p2' : (check.winner === 'p2' ? 'p1' : 'tie'), s: { p1lives: state.p1.lives, p2lives: state.p2.lives, p1wins: state.p1.roundWins, p2wins: state.p2.roundWins, p1bonus: state.p1.bonusCards, p2bonus: state.p2.bonusCards, round: state.round, tension: state.tension } });
            showGameOver(check.winner);
            return;
        }

        state.round++;
        state.tension = Math.min(100, state.tension + 8);
        broadcastState();
        await showMessage(`ROUND ${state.round}`, 1600);
    }
}

// ── LOBBY ──
function showLobby() {
    return new Promise(resolve => {
        const lobby       = document.getElementById('lobby-screen');
        const lobbyBtns   = document.getElementById('lobby-buttons');
        const onlineSetup = document.getElementById('online-setup');
        const onlineOpts  = document.getElementById('online-options');
        const roomDisplay = document.getElementById('room-code-display');

        document.getElementById('mode-local').onclick = () => {
            gameMode = 'local'; lobby.classList.add('hidden'); resolve('local');
        };

        document.getElementById('mode-online').onclick = () => {
            lobbyBtns.classList.add('hidden'); onlineSetup.classList.remove('hidden');
        };

        document.getElementById('online-back-btn').onclick = () => {
            onlineSetup.classList.add('hidden'); lobbyBtns.classList.remove('hidden');
            roomDisplay.classList.add('hidden'); onlineOpts.classList.remove('hidden');
            if (online.peer) { online.peer.destroy(); online.peer = null; }
        };

        document.getElementById('create-room-btn').onclick = () => {
            const code = generateCode();
            online.roomCode = code; online.isHost = true;
            online.peer = new Peer(code);
            online.peer.on('open', () => {
                onlineOpts.classList.add('hidden'); roomDisplay.classList.remove('hidden');
                document.getElementById('room-code-text').textContent = code;
                document.getElementById('lobby-status').textContent = 'Waiting...';
            });
            online.peer.on('connection', conn => {
                online.conn = conn;
                conn.on('open', () => {
                    document.getElementById('lobby-status').textContent = 'Connected!';
                    gameMode = 'online';
                    conn.on('data', handleGuestMessage);
                    setTimeout(() => { lobby.classList.add('hidden'); resolve('online-host'); }, 700);
                });
            });
        };

        document.getElementById('join-room-btn').onclick = () => {
            const code = document.getElementById('join-code-input').value.trim().toUpperCase();
            if (!code) return;
            online.isHost = false;
            online.peer = new Peer();
            online.peer.on('open', () => {
                const conn = online.peer.connect(code, { reliable: true });
                online.conn = conn;
                conn.on('open', () => {
                    document.getElementById('lobby-status').textContent = 'Connected!';
                    gameMode = 'online';
                    conn.on('data', handleHostMessage);
                    setTimeout(() => { lobby.classList.add('hidden'); resolve('online-guest'); }, 700);
                });
                conn.on('error', () => {
                    document.getElementById('lobby-status').textContent = 'Could not connect.';
                });
            });
        };
    });
}

// ── START ──
async function startGame() {
    injectBonusUI();
    const mode = await showLobby();

    if (mode === 'local') {
        resetState(); updateUI();
        await showMessage('VOLTAGE 21', 1600);
        await runLocalGame();
    } else if (mode === 'online-host') {
        await runOnlineHostGame();
    } else {
        // Guest — wait for host messages
        resetState(); updateUI();
        renderOppHand([], false, '');
        await showMessage('Connected. Waiting for host...', 1800);
    }
}

startGame();
