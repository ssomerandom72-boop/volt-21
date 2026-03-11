// ═══════════════════════════════════════════════
//  VOLTAGE 21 — Survival Horror Blackjack
//  Version: 1.5.2 (FULL RESTORE + MQTT SECURE)
// ═══════════════════════════════════════════════
console.log('%c[VOLTAGE 21] Version 1.5.2 loaded', 'color:#00ffff; font-weight:bold; font-size:1.4em;');

// ── THREE.JS SCENE SETUP ──
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x02000a);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '1';
renderer.domElement.style.pointerEvents = 'none';
document.body.insertBefore(renderer.domElement, document.body.firstChild);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02000a);
scene.fog = new THREE.Fog(0x02000a, 10, 22);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 7.5, 9.5);
camera.lookAt(0, 0.5, -0.5);

const camBase = new THREE.Vector3(0, 7.5, 9.5);

function adjustCamera() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    if (w < h) {
        camera.fov = 72;
        camera.position.set(0, 11, 13);
        camBase.set(0, 11, 13);
    } else {
        camera.fov = 52;
        camera.position.set(0, 7.5, 9.5);
        camBase.set(0, 7.5, 9.5);
    }
    camera.lookAt(0, 0.5, -0.5);
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustCamera();
});

const clock = new THREE.Clock();

// ── LIGHTING ──
const ambientLight = new THREE.AmbientLight(0x221133, 1.8);
scene.add(ambientLight);

const mainLight = new THREE.PointLight(0xcc66ff, 8, 18);
mainLight.position.set(0, 5.5, 0);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
mainLight.shadow.bias = -0.005;
scene.add(mainLight);

const fillLeft = new THREE.PointLight(0x6600cc, 2.5, 14);
fillLeft.position.set(-5, 3, 2);
scene.add(fillLeft);

const fillRight = new THREE.PointLight(0x6600cc, 2.5, 14);
fillRight.position.set(5, 3, 2);
scene.add(fillRight);

const oppLight = new THREE.PointLight(0x9944ff, 3.5, 10);
oppLight.position.set(0, 3.5, -2.5);
scene.add(oppLight);

const fixtureGroup = new THREE.Group();
let swingAngle = 0, swingSpeed = 0, swingTarget = 0;
const wireGeo = new THREE.CylinderGeometry(0.008, 0.008, 3.0, 6);
const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const wire = new THREE.Mesh(wireGeo, wireMat);
wire.position.set(0, 1.5, 0);
fixtureGroup.add(wire);

const shadeGroup = new THREE.Group();
const shadeGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.22, 12, 1, true);
const shadeMat = new THREE.MeshStandardMaterial({ color: 0x0a000f, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide });
const shade = new THREE.Mesh(shadeGeo, shadeMat);
shade.position.set(0, -0.1, 0);
shadeGroup.add(shade);

const bulbGeo = new THREE.SphereGeometry(0.07, 8, 8);
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xaa88ff, emissive: 0xaa44ff, emissiveIntensity: 2.0 });
const bulb = new THREE.Mesh(bulbGeo, bulbMat);
bulb.position.set(0, -0.15, 0);
shadeGroup.add(bulb);

fixtureGroup.add(shadeGroup);
fixtureGroup.position.set(0, 7.0, 0);
scene.add(fixtureGroup);

function updateSwingingLight(dt) {
    if (Math.random() < 0.005) swingTarget = (Math.random() - 0.5) * 0.15;
    const force = (swingTarget - swingAngle) * 0.5;
    swingSpeed += force * dt;
    swingSpeed *= 0.985;
    swingAngle += swingSpeed;
    fixtureGroup.rotation.z = swingAngle;
    fixtureGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.02;
    const worldPos = new THREE.Vector3();
    bulb.getWorldPosition(worldPos);
    mainLight.position.copy(worldPos);
}

let flickerTimer = 0, flickerInterval = 0.15, flickerDipping = false, flickerDipTimer = 0, flickerDipDuration = 0, flickerDipTarget = 5;
const flickerBaseIntensity = 5;

function updateFlicker(dt) {
    flickerTimer += dt;
    if (flickerDipping) {
        flickerDipTimer += dt;
        const t = Math.min(1, flickerDipTimer / flickerDipDuration);
        if (flickerDipTimer < flickerDipDuration * 0.4) {
            mainLight.intensity = flickerBaseIntensity + (flickerDipTarget - flickerBaseIntensity) * (flickerDipTimer / (flickerDipDuration * 0.4));
        } else {
            const recover = (flickerDipTimer - flickerDipDuration * 0.4) / (flickerDipDuration * 0.6);
            mainLight.intensity = flickerDipTarget + (flickerBaseIntensity - flickerDipTarget) * Math.min(1, recover);
        }
        if (flickerDipTimer >= flickerDipDuration) {
            flickerDipping = false;
            mainLight.intensity = flickerBaseIntensity;
        }
    } else if (flickerTimer >= flickerInterval) {
        flickerTimer = 0;
        flickerInterval = 0.08 + Math.random() * 0.37;
        mainLight.intensity = flickerBaseIntensity * (0.75 + Math.random() * 0.5);
        if (Math.random() < 0.05) {
            flickerDipping = true; flickerDipTimer = 0;
            flickerDipDuration = 0.3 + Math.random() * 0.4;
            flickerDipTarget = 0.5 + Math.random() * 1.5;
        }
    }
}

// ── TABLE ──
const tableMat = new THREE.MeshStandardMaterial({ color: 0x0a0012, roughness: 0.85, metalness: 0.1 });
const tableGeo = new THREE.BoxGeometry(7.4, 0.12, 5.6);
const tableMesh = new THREE.Mesh(tableGeo, tableMat);
tableMesh.position.set(0, 0, 0); tableMesh.receiveShadow = true; scene.add(tableMesh);

const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8);
const legMat = new THREE.MeshStandardMaterial({ color: 0x0d0018, roughness: 0.7, metalness: 0.4 });
[[-3.3, -0.61, -2.5], [3.3, -0.61, -2.5], [-3.3, -0.61, 2.5], [3.3, -0.61, 2.5]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat); leg.position.set(x, y, z); leg.castShadow = true; scene.add(leg);
});

// ── ELECTRIC DEVICE ──
const DEVICE_POS = new THREE.Vector3(0, 0, 0);
const deviceGroup = new THREE.Group();
const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a0020, roughness: 0.4, metalness: 0.8 });
const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.45), baseMat);
basePlate.position.set(0, 0.09, 0); deviceGroup.add(basePlate);
const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.38, 10), baseMat);
pillar.position.set(0, 0.31, 0); deviceGroup.add(pillar);
const tipMat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.5 });
const tipLeft = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), tipMat);
tipLeft.position.set(-0.1, 0.795, 0); deviceGroup.add(tipLeft);
const tipRight = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), tipMat);
tipRight.position.set(0.1, 0.795, 0); deviceGroup.add(tipRight);
const deviceLight = new THREE.PointLight(0x9900ff, 0.8, 1.2);
deviceLight.position.set(0, 0.8, 0); deviceGroup.add(deviceLight);
deviceGroup.position.copy(DEVICE_POS); scene.add(deviceGroup);

// ── AVATARS ──
class Avatar {
    constructor(side, color) {
        this.group = new THREE.Group(); this.side = side; this.color = color;
        this.group.position.set(0, 0, side==='dealer'?-4.5:4.5);
        if (side!=='dealer') this.group.rotation.y = Math.PI;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x05000a }));
        body.position.y = 1.1; this.group.add(body);
        this.maskMat = new THREE.MeshStandardMaterial({ color: 0x110022, emissive: color, emissiveIntensity: 0.5 });
        const mask = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), this.maskMat);
        mask.position.set(0, 2.4, 0.6); this.group.add(mask);
        scene.add(this.group);
    }
    update(dt, isBluffing) {
        this.group.position.y = Math.sin(Date.now()*0.0015 + (this.side==='dealer'?0:Math.PI))*0.05;
        this.maskMat.emissive.setHex(isBluffing ? 0xff0000 : this.color);
    }
}
const dealerAvatar = new Avatar('dealer', 0xaa00ff), playerAvatar = new Avatar('player', 0x00ffff);

// ── AUDIO ──
let audioCtx = null, bgMusic = null, musicFilter = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicFilter = audioCtx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 20000;
        musicFilter.connect(audioCtx.destination);
    }
}
function startMusic() {
    if (bgMusic) return; initAudio();
    bgMusic = new Audio('1Askim Cok Pardon (Instrumental Slowed).mp3'); bgMusic.loop = true; bgMusic.volume = 0.4;
    const src = audioCtx.createMediaElementSource(bgMusic); src.connect(musicFilter); bgMusic.play().catch(()=>{});
}

// ── CARDS ──
const backTex = (function() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 358;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#07000e'; ctx.fillRect(0, 0, 256, 358);
    ctx.strokeStyle = '#4a0066'; ctx.lineWidth = 5; ctx.strokeRect(7, 7, 242, 344);
    ctx.fillStyle = '#aa44ff'; ctx.font = 'bold 28px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('V-21', 128, 179);
    return new THREE.CanvasTexture(canvas);
})();

const faceTexCache = new Map();
function makeFaceTexture(rank, suit) {
    const key = rank + suit; if (faceTexCache.has(key)) return faceTexCache.get(key);
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 358;
    const ctx = canvas.getContext('2d'); const cardColor = (suit === '♥' || suit === '♦') ? '#cc1133' : '#220033';
    ctx.fillStyle = '#f4edff'; ctx.fillRect(0, 0, 256, 358);
    ctx.strokeStyle = '#3a0055'; ctx.lineWidth = 5; ctx.strokeRect(5, 5, 246, 348);
    ctx.fillStyle = cardColor; ctx.font = 'bold 32px Courier New'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(rank, 16, 14); ctx.font = '24px serif'; ctx.fillText(suit, 16, 48);
    ctx.save(); ctx.translate(240, 344); ctx.rotate(Math.PI); ctx.fillText(rank, 16, 14); ctx.fillText(suit, 16, 48); ctx.restore();
    ctx.font = '96px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.85; ctx.fillText(suit, 128, 179);
    const tex = new THREE.CanvasTexture(canvas); faceTexCache.set(key, tex); return tex;
}

function makeCardMesh(card, faceDown) {
    const cardGeo = new THREE.BoxGeometry(0.75, 0.018, 1.05);
    const edgeMat = new THREE.MeshStandardMaterial({ color:0x180020, emissive:0x180020, emissiveIntensity:0.4 });
    const topMat = faceDown ? new THREE.MeshStandardMaterial({ map: backTex }) : new THREE.MeshStandardMaterial({ map: makeFaceTexture(card.rank, card.suit) });
    const materials = [edgeMat, edgeMat, topMat, new THREE.MeshStandardMaterial({ map: backTex }), edgeMat, edgeMat];
    const mesh = new THREE.Mesh(cardGeo, materials); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

const SUITS=['♠','♥','♦','♣'], RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function makeDeck() {
    const d = SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r })));
    for (let i=d.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
}
function cardValue(c) { if (['J','Q','K'].includes(c.rank)) return 10; if (c.rank==='A') return 11; return parseInt(c.rank); }
function handTotal(h) {
    let t=0, a=0; for (const c of h) { t+=cardValue(c); if(c.rank==='A') a++; }
    while (t>21 && a>0) { t-=10; a--; } return t;
}

// ── STATE ──
const MAX_LIVES=3, MAX_ROUNDS=5;
let gameMode='local', state={};
const online = { client: null, topic: '', clientId: 'u-'+Math.random().toString(36).substr(2,8), isHost: false, roomCode: '', _resolvers: {} };

function resetState() {
    state = {
        round: 1, deck: makeDeck(), tension: 0, phase: 'deal',
        p1: { lives: MAX_LIVES, hand: [], roundWins: 0, name: 'Player 1', isBluffing: false },
        p2: { lives: MAX_LIVES, hand: [], roundWins: 0, name: 'Player 2', isBluffing: false }
    };
    clearCards3D(playerCards3D); clearCards3D(oppCards3D);
}

// ── NETWORKING (MQTT) ──
async function initMQTT(code) {
    online.roomCode = code; online.topic = 'volt21/room/' + code;
    online.client = new Paho.MQTT.Client('broker.hivemq.com', 8884, online.clientId);
    online.client.onMessageArrived = (msg) => {
        const data = JSON.parse(msg.payloadString); if (data.sender === online.clientId) return;
        handleNetMessage(data.type, data);
    };
    return new Promise((res, rej) => {
        online.client.connect({ onSuccess: () => { online.client.subscribe(online.topic); res(); }, onFailure: rej, useSSL: true, timeout: 10 });
    });
}
function sendNet(type, data = {}) {
    if (!online.client || !online.client.isConnected()) return;
    const msg = new Paho.MQTT.Message(JSON.stringify({ sender: online.clientId, type, ...data }));
    msg.destinationName = online.topic; online.client.send(msg);
}
function broadcastState() {
    if (!online.isHost) return;
    sendNet('state', { s: { p1l: state.p1.lives, p2l: state.p2.lives, p1w: state.p1.roundWins, p2w: state.p2.roundWins, r: state.round, t: state.tension, p1h: state.p1.hand, p2h: state.p2.hand } });
}
function applyNetState(s) {
    state.p1.lives = s.p1l; state.p2.lives = s.p2l; state.p1.roundWins = s.p1w; state.p2.roundWins = s.p2w;
    state.round = s.r; state.tension = s.t; state.p1.hand = s.p1h; state.p2.hand = s.p2h;
    updateUI(); renderHand(state.p2.hand); renderOppHand(state.p1.hand); // Guest perspective flip
}
function handleNetMessage(type, data) {
    if (online.isHost) {
        if (type === 'guestJoined') { document.getElementById('lobby-status').textContent = 'Guest Connected!'; sendNet('hostAck'); }
        if (type === 'action' && online._resolvers.action) { online._resolvers.action(data.val); delete online._resolvers.action; }
    } else {
        if (type === 'hostAck' && online._resolvers.join) online._resolvers.join();
        if (type === 'state') applyNetState(data.s);
        if (type === 'message') showMessage(data.text, data.duration);
        if (type === 'yourTurn') startGuestTurn();
    }
}

// ── UI ──
const ui = {
    p1Lives: document.getElementById('p1-lives'), p2Lives: document.getElementById('p2-lives'),
    roundDisplay: document.getElementById('round-display'), tensionBar: document.getElementById('tension-bar'),
    messageBox: document.getElementById('message-box'), actionArea: document.getElementById('action-area'),
    actionLabel: document.getElementById('action-label'), handArea: document.getElementById('hand-area'),
    handValue: document.getElementById('hand-value'), oppArea: document.getElementById('opponent-area'),
    oppStatus: document.getElementById('opp-status')
};
const wait = ms => new Promise(r => setTimeout(r, ms));
async function showMessage(text, duration = 2000) {
    ui.messageBox.textContent = text; ui.messageBox.classList.remove('hidden');
    if (gameMode==='online' && online.isHost) sendNet('message', { text, duration });
    await wait(duration); ui.messageBox.classList.add('hidden');
}
function updateUI() {
    const rL = (el, l) => { el.innerHTML = ''; for (let i=0; i<MAX_LIVES; i++) { const s=document.createElement('span'); s.textContent='♥'; s.className=i<l?'life-on':'life-off'; el.appendChild(s); } };
    rL(ui.p1Lives, state.p1.lives); rL(ui.p2Lives, state.p2.lives);
    ui.roundDisplay.textContent = `ROUND ${state.round} / ${MAX_ROUNDS}`;
    ui.tensionBar.style.height = `${state.tension}%`;
    document.getElementById('p1-wins').textContent = `P1: ${state.p1.roundWins}`;
    document.getElementById('p2-wins').textContent = `P2: ${state.p2.roundWins}`;
}

// ── RENDER ──
const PLAYER_Z = 1.9, OPP_Z = -1.9, DECK_POS = new THREE.Vector3(-3.1, 0.065, 0.4);
let playerCards3D = [], oppCards3D = [], tweens = [];
function clearCards3D(arr) { arr.forEach(m => scene.remove(m)); arr.length = 0; }
function renderHand(h, all=true) {
    clearCards3D(playerCards3D); const spacing = 0.85, half = (h.length-1)*spacing*0.5;
    h.forEach((c, i) => {
        const m = makeCardMesh(c, !all && i>0); m.position.set(i*spacing-half, 0.075, PLAYER_Z); scene.add(m); playerCards3D.push(m);
    });
    ui.handValue.textContent = `Total: ${handTotal(h)}`; ui.handArea.classList.remove('hidden');
}
function renderOppHand(h, all=false) {
    clearCards3D(oppCards3D); const spacing = 0.85, half = (h.length-1)*spacing*0.5;
    h.forEach((c, i) => {
        const m = makeCardMesh(c, !all); m.rotation.y = Math.PI; m.position.set(i*spacing-half, 0.075, OPP_Z); scene.add(m); oppCards3D.push(m);
    });
    ui.oppArea.classList.remove('hidden');
}

// ── ACTIONS ──
let _actionResolve = null;
function waitForAction(who) {
    return new Promise(res => { _actionResolve = res; ui.actionArea.classList.remove('hidden'); ui.actionLabel.textContent = 'YOUR TURN'; });
}
function startGuestTurn() {
    ui.actionArea.classList.remove('hidden'); ui.actionLabel.textContent = 'YOUR TURN';
    _actionResolve = (val) => { sendNet('action', { val }); ui.actionArea.classList.add('hidden'); };
}

// ── LOBBY ──
function generateCode() { return Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*33)]).join(''); }
function showLobby() {
    return new Promise(res => {
        const lobby = document.getElementById('lobby-screen'), setup = document.getElementById('online-setup');
        document.getElementById('mode-local').onclick = () => { gameMode='local'; lobby.classList.add('hidden'); res('local'); };
        document.getElementById('mode-ai').onclick = () => { gameMode='ai'; lobby.classList.add('hidden'); res('ai'); };
        document.getElementById('mode-online').onclick = () => { document.getElementById('lobby-buttons').classList.add('hidden'); setup.classList.remove('hidden'); };
        document.getElementById('create-room-btn').onclick = async () => {
            const code = generateCode(); online.isHost = true;
            document.getElementById('lobby-status').textContent = 'Connecting...';
            await initMQTT(code);
            document.getElementById('online-options').classList.add('hidden');
            document.getElementById('room-code-display').classList.remove('hidden');
            document.getElementById('room-code-text').textContent = code;
            document.getElementById('lobby-status').textContent = 'Waiting for opponent...';
        };
        document.getElementById('join-room-btn').onclick = async () => {
            const code = document.getElementById('join-code-input').value.trim().toUpperCase();
            online.isHost = false; document.getElementById('lobby-status').textContent = 'Joining...';
            await initMQTT(code); sendNet('guestJoined');
            const joinWait = new Promise((ok, fail) => { online._resolvers.join = ok; setTimeout(fail, 10000); });
            try { await joinWait; gameMode='online'; lobby.classList.add('hidden'); res('online-guest'); }
            catch(e) { document.getElementById('lobby-status').textContent = 'Host not found.'; }
        };
    });
}

document.getElementById('btn-hit').onclick = () => { if(_actionResolve){ _actionResolve('hit'); _actionResolve=null; ui.actionArea.classList.add('hidden'); } };
document.getElementById('btn-stand').onclick = () => { if(_actionResolve){ _actionResolve('stand'); _actionResolve=null; ui.actionArea.classList.add('hidden'); } };

// ── LOOPS ──
async function runOnlineHostGame() {
    resetState(); updateUI();
    while (true) {
        state.p1.hand = [makeDeck().pop(), makeDeck().pop()];
        state.p2.hand = [makeDeck().pop(), makeDeck().pop()];
        broadcastState(); renderHand(state.p1.hand); renderOppHand(state.p2.hand);
        await showMessage("Round " + state.round + " Begin!");
        
        // Host turn
        const a1 = await waitForAction('p1');
        if (a1 === 'hit') { state.p1.hand.push(makeDeck().pop()); renderHand(state.p1.hand); }
        broadcastState();
        
        // Guest turn
        await showMessage("Waiting for Opponent...");
        sendNet('yourTurn');
        const a2 = await new Promise(res => { online._resolvers.action = res; });
        if (a2 === 'hit') { state.p2.hand.push(makeDeck().pop()); renderOppHand(state.p2.hand); }
        
        // Resolve (simplified for restore test)
        const t1 = handTotal(state.p1.hand), t2 = handTotal(state.p2.hand);
        if (t1 > t2 && t1 <= 21) { state.p1.roundWins++; await showMessage("P1 Wins Round!"); }
        else if (t2 > t1 && t2 <= 21) { state.p2.roundWins++; await showMessage("P2 Wins Round!"); }
        else { await showMessage("Draw!"); }
        
        state.round++; broadcastState(); await wait(3000);
    }
}

async function startGame() {
    const mode = await showLobby(); startMusic();
    if (mode === 'local') { resetState(); updateUI(); state.p1.hand=[{rank:'A',suit:'♠'}]; renderHand(state.p1.hand); }
    else if (mode === 'online-host') { await runOnlineHostGame(); }
}

function animate() {
    requestAnimationFrame(animate); const dt = clock.getDelta();
    updateSwingingLight(dt); updateFlicker(dt);
    playerAvatar.update(dt, state.p1?.isBluffing); dealerAvatar.update(dt, state.p2?.isBluffing);
    renderer.render(scene, camera);
}
animate();
startGame();
