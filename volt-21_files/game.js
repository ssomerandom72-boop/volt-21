// ═══════════════════════════════════════════════
//  VOLTAGE 21 — Survival Horror Blackjack
//  Version: 1.4.0 (CLOUD RELAY)
// ═══════════════════════════════════════════════
console.log('%c[VOLTAGE 21] Version 1.4.0 loaded', 'color:#00ffff; font-weight:bold; font-size:1.4em;');

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
    } else if (w < 768) {
        camera.fov = 58;
        camera.position.set(0, 7.5, 9.5);
        camBase.set(0, 7.5, 9.5);
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
let swingAngle = 0;
let swingSpeed = 0;
let swingTarget = 0;

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

let flickerTimer = 0;
let flickerInterval = 0.15;
let flickerDipping = false;
let flickerDipTimer = 0;
let flickerDipDuration = 0;
let flickerDipTarget = 5;
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
            flickerDipping = true;
            flickerDipTimer = 0;
            flickerDipDuration = 0.3 + Math.random() * 0.4;
            flickerDipTarget = 0.5 + Math.random() * 1.5;
        }
    }
}

// ── TABLE ──
const tableMat = new THREE.MeshStandardMaterial({ color: 0x0a0012, roughness: 0.85, metalness: 0.1 });
const tableGeo = new THREE.BoxGeometry(7.4, 0.12, 5.6);
const tableMesh = new THREE.Mesh(tableGeo, tableMat);
tableMesh.position.set(0, 0, 0);
tableMesh.receiveShadow = true;
scene.add(tableMesh);

const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8);
const legMat = new THREE.MeshStandardMaterial({ color: 0x0d0018, roughness: 0.7, metalness: 0.4 });
const legPositions = [[-3.3, -0.61, -2.5], [3.3, -0.61, -2.5], [-3.3, -0.61, 2.5], [3.3, -0.61, 2.5]];
for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    scene.add(leg);
}

const trimMat = new THREE.MeshStandardMaterial({ color: 0x3a0055, emissive: 0x3a0055, emissiveIntensity: 0.8, roughness: 0.5, metalness: 0.3 });
const trims = [
    { geo: new THREE.BoxGeometry(7.42, 0.03, 0.03), pos: [0, 0.075, 2.8] },
    { geo: new THREE.BoxGeometry(7.42, 0.03, 0.03), pos: [0, 0.075, -2.8] },
    { geo: new THREE.BoxGeometry(0.03, 0.03, 5.62), pos: [3.71, 0.075, 0] },
    { geo: new THREE.BoxGeometry(0.03, 0.03, 5.62), pos: [-3.71, 0.075, 0] },
];
for (const { geo, pos } of trims) {
    const mesh = new THREE.Mesh(geo, trimMat);
    mesh.position.set(...pos);
    scene.add(mesh);
}

const divLineMat = new THREE.MeshStandardMaterial({ color: 0x220033, emissive: 0x220033, emissiveIntensity: 0.4 });
const divLine = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.008, 0.025), divLineMat);
divLine.position.set(0, 0.065, 0);
scene.add(divLine);

// ── ENVIRONMENT ──
const floorMat = new THREE.MeshStandardMaterial({ color: 0x050008, roughness: 1.0 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.18;
floor.receiveShadow = true;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x04000a, roughness: 1.0 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), wallMat);
backWall.position.set(0, 5, -9);
scene.add(backWall);

// ── ELECTRIC DEVICE ──
const DEVICE_POS = new THREE.Vector3(0, 0, 0);
const deviceGroup = new THREE.Group();
const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a0020, roughness: 0.4, metalness: 0.8 });
const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.45), baseMat);
basePlate.position.set(0, 0.09, 0);
deviceGroup.add(basePlate);

const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.38, 10), baseMat);
pillar.position.set(0, 0.31, 0);
deviceGroup.add(pillar);

const electrodeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8);
const electrodeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.9 });
const elecLeft = new THREE.Mesh(electrodeGeo, electrodeMat);
elecLeft.position.set(-0.1, 0.64, 0);
deviceGroup.add(elecLeft);
const elecRight = new THREE.Mesh(electrodeGeo, electrodeMat);
elecRight.position.set(0.1, 0.64, 0);
deviceGroup.add(elecRight);

const tipGeo = new THREE.SphereGeometry(0.038, 10, 10);
let tipMatLeft = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.5, roughness: 0.2 });
let tipMatRight = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.5, roughness: 0.2 });
const tipLeft = new THREE.Mesh(tipGeo, tipMatLeft);
tipLeft.position.set(-0.1, 0.795, 0);
deviceGroup.add(tipLeft);
const tipRight = new THREE.Mesh(tipGeo, tipMatRight);
tipRight.position.set(0.1, 0.795, 0);
deviceGroup.add(tipRight);

const deviceLight = new THREE.PointLight(0x9900ff, 0.8, 1.2);
deviceLight.position.set(0, 0.8, 0);
deviceGroup.add(deviceLight);
deviceGroup.position.copy(DEVICE_POS);
scene.add(deviceGroup);

// ── AVATAR SYSTEM ──
class Avatar {
    constructor(side, color) {
        this.group = new THREE.Group();
        this.side = side;
        this.color = color;
        const isDealer = side === 'dealer';
        this.group.position.set(0, 0, isDealer ? -4.5 : 4.5);
        if (!isDealer) this.group.rotation.y = Math.PI;
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x05000a, roughness: 0.9 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 8), bodyMat);
        body.position.y = 1.1;
        this.group.add(body);
        this.maskGroup = new THREE.Group();
        this.maskGroup.position.set(0, 2.4, 0.6);
        this.group.add(this.maskGroup);
        this.maskMat = new THREE.MeshStandardMaterial({ color: 0x110022, emissive: color, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.8 });
        const maskGeo = new THREE.IcosahedronGeometry(0.35, 1);
        this.maskMesh = new THREE.Mesh(maskGeo, this.maskMat);
        this.maskGroup.add(this.maskMesh);
        const eyeGeo = new THREE.BoxGeometry(0.15, 0.02, 0.05);
        const eyeMat = new THREE.MeshBasicMaterial({ color: color });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.12, 0.05, 0.32);
        this.maskGroup.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.12, 0.05, 0.32);
        this.maskGroup.add(eyeR);
        scene.add(this.group);
    }
    update(dt, isBluffing) {
        this.group.position.y = Math.sin(Date.now() * 0.0015 + (this.side === 'dealer' ? 0 : Math.PI)) * 0.05;
        if (audioAnalyser) {
            const data = new Uint8Array(audioAnalyser.frequencyBinCount);
            audioAnalyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b) / data.length;
            const s = 1 + avg / 120;
            this.maskGroup.scale.set(s, s, s);
            this.maskMat.emissiveIntensity = 0.5 + avg / 50;
        }
        if (isBluffing) {
            this.maskGroup.position.x = (Math.random() - 0.5) * 0.02;
            this.maskGroup.position.y = 2.4 + (Math.random() - 0.5) * 0.02;
            this.maskMat.emissive.setHex(0xff0000);
        } else {
            this.maskGroup.position.x = 0;
            this.maskGroup.position.y = 2.4;
            this.maskMat.emissive.setHex(this.color);
        }
    }
}
const dealerAvatar = new Avatar('dealer', 0xaa00ff);
const playerAvatar = new Avatar('player', 0x00ffff);

function updateAvatars(dt) {
    if (!state || !state.p1 || !state.p2) return;
    let pB = false, oB = false;
    if (gameMode === 'online') {
        if (online.isHost) { pB = state.p1.isBluffing; oB = state.p2.isBluffing; }
        else { pB = state.p2.isBluffing; oB = state.p1.isBluffing; }
    } else { pB = state.p1.isBluffing; oB = state.p2.isBluffing; }
    playerAvatar.update(dt, pB);
    dealerAvatar.update(dt, oB);
}

// ── SIDE ELECTRODES ──
const standMat2   = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, metalness: 0.88, roughness: 0.22 });
const padMat2     = new THREE.MeshStandardMaterial({ color: 0x1a0025, metalness: 0.7, roughness: 0.4, emissive: 0x330055, emissiveIntensity: 0.7 });
const contactMat2 = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.2, roughness: 0.1 });
const cableMat2   = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85, metalness: 0.3 });

function buildElectrodeStand(x, z) {
    const g = new THREE.Group();
    const inward = x < 0 ? 1 : -1;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.18), standMat2);
    base.position.set(0, 0.095, 0); g.add(base);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.05, 8), standMat2);
    rod.position.set(0, 0.645, 0); g.add(rod);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 6), standMat2);
    arm.rotation.z = Math.PI / 2; arm.position.set(inward * 0.275, 1.15, 0); g.add(arm);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.055, 16), padMat2);
    pad.rotation.z = Math.PI / 2; pad.position.set(inward * 0.55, 1.15, 0); g.add(pad);
    const contact = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), contactMat2);
    contact.position.set(inward * 0.578, 1.15, 0); g.add(contact);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 6, 12), standMat2);
    ring.rotation.y = Math.PI / 2; ring.position.set(inward * 0.545, 1.15, 0); g.add(ring);
    g.position.set(x, 0.06, z);
    return g;
}
[[-3.6, 1.6], [3.6, 1.6], [-3.6, -1.6], [3.6, -1.6]].forEach(([x, z]) => scene.add(buildElectrodeStand(x, z)));

function makeCable(from, to) {
    const sag = -0.38;
    const mid1 = new THREE.Vector3(from.x * 0.65 + to.x * 0.35, Math.min(from.y, to.y) + sag, from.z * 0.65 + to.z * 0.35);
    const mid2 = new THREE.Vector3(from.x * 0.35 + to.x * 0.65, Math.min(from.y, to.y) + sag, from.z * 0.35 + to.z * 0.65);
    const curve = new THREE.CatmullRomCurve3([from, mid1, mid2, to]);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.011, 5, false), cableMat2);
}
const devAnchor = new THREE.Vector3(0, 0.82, 0);
[
    [new THREE.Vector3(-3.6 + 0.578, 1.21,  1.6), devAnchor.clone().add(new THREE.Vector3(-0.08, 0,  0.08))],
    [new THREE.Vector3( 3.6 - 0.578, 1.21,  1.6), devAnchor.clone().add(new THREE.Vector3( 0.08, 0,  0.08))],
    [new THREE.Vector3(-3.6 + 0.578, 1.21, -1.6), devAnchor.clone().add(new THREE.Vector3(-0.08, 0, -0.08))],
    [new THREE.Vector3( 3.6 - 0.578, 1.21, -1.6), devAnchor.clone().add(new THREE.Vector3( 0.08, 0, -0.08))],
].forEach(([from, to]) => scene.add(makeCable(from, to)));

let deviceTime = 0;
function updateDevice(dt) {
    deviceTime += dt;
    const pulse = 0.5 + 0.5 * Math.sin(deviceTime * 2.1), pulse2 = 0.5 + 0.5 * Math.sin(deviceTime * 3.3 + 1.1);
    tipMatLeft.emissiveIntensity = 1.8 + pulse * 1.5; tipMatRight.emissiveIntensity = 1.8 + pulse2 * 1.5;
    deviceLight.intensity = 0.5 + pulse * 0.7;
}

// ── DECK ──
const DECK_POS = new THREE.Vector3(-3.1, 0.065, 0.4);
const deckEdgeMat = new THREE.MeshStandardMaterial({ color: 0x180020, emissive: 0x180020, emissiveIntensity: 0.4 });
function makeBackTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 358;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#07000e'; ctx.fillRect(0, 0, 256, 358);
    ctx.strokeStyle = '#4a0066'; ctx.lineWidth = 5; ctx.strokeRect(7, 7, 242, 344);
    ctx.fillStyle = '#aa44ff'; ctx.font = 'bold 28px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('V-21', 128, 179);
    return new THREE.CanvasTexture(canvas);
}
const backTex = makeBackTexture();
const deckCardGeo = new THREE.BoxGeometry(0.75, 0.018, 1.05);
const deckBackMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 });
for (let i = 0; i < 12; i++) {
    const materials = [deckEdgeMat, deckEdgeMat, deckBackMat, deckBackMat, deckEdgeMat, deckEdgeMat];
    const mesh = new THREE.Mesh(deckCardGeo, materials);
    mesh.position.set(DECK_POS.x + (Math.random() - 0.5) * 0.02, DECK_POS.y + i * 0.019, DECK_POS.z + (Math.random() - 0.5) * 0.02);
    mesh.rotation.y = (Math.random() - 0.5) * 0.1 - 0.15; mesh.castShadow = true; scene.add(mesh);
}

// ── CARD TEXTURES ──
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

// ── ASH PARTICLES ──
const particles = [];
function createAshParticles(pos, count = 15) {
    const geo = new THREE.PlaneGeometry(0.05, 0.05);
    const mat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(geo, mat); p.position.copy(pos);
        const vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 1.5, (Math.random() - 0.5) * 0.5);
        const rot = new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10);
        scene.add(p); particles.push({ mesh: p, vel, rot, life: 1.0, update(dt) {
            this.life -= dt * 0.6; this.mesh.position.addScaledVector(this.vel, dt);
            this.mesh.rotation.x += this.rot.x * dt; this.mesh.material.opacity = this.life;
            if (this.life <= 0) { scene.remove(this.mesh); return true; } return false;
        }});
    }
}
async function burnCards(cards3D) {
    for (const mesh of cards3D) {
        createAshParticles(mesh.position, 10);
        tweens.push({ elapsed: 0, duration: 0.5, update(dt) {
            this.elapsed += dt; const t = this.elapsed / this.duration;
            mesh.scale.set(1 - t, 1 - t, 1 - t); mesh.rotation.z += dt * 5; return t >= 1;
        }});
    }
    await wait(600);
}

// ── CARD MGMT ──
const PLAYER_Z = 1.9, OPP_Z = -1.9;
let playerCards3D = [], oppCards3D = [];
const tweens = [];
function animateToDelayed(mesh, targetPos, duration, delay) {
    const startPos = mesh.position.clone(); let elapsed = -delay;
    tweens.push({ update(dt) {
        elapsed += dt; if (elapsed < 0) return false;
        const t = Math.min(1, elapsed / duration), e = 1 - Math.pow(1 - t, 3);
        mesh.position.lerpVectors(startPos, targetPos, e); return t >= 1;
    }});
}
function cardXPositions(count) {
    const spacing = count > 4 ? 0.78 : 0.85, positions = [];
    const half = (count - 1) * spacing * 0.5;
    for (let i = 0; i < count; i++) positions.push(i * spacing - half);
    return positions;
}
function clearCards3D(arr) {
    for (const mesh of arr) {
        scene.remove(mesh);
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => { if (m !== deckEdgeMat) m.dispose(); });
    }
    arr.length = 0;
}
function makeCardMesh(card, faceDown) {
    const cardGeo = new THREE.BoxGeometry(0.75, 0.018, 1.05);
    const edgeMat = new THREE.MeshStandardMaterial({ color:0x180020, emissive:0x180020, emissiveIntensity:0.4 });
    const topMat = faceDown ? new THREE.MeshStandardMaterial({ map: backTex }) : new THREE.MeshStandardMaterial({ map: makeFaceTexture(card.rank, card.suit) });
    const materials = [edgeMat, edgeMat, topMat, new THREE.MeshStandardMaterial({ map: backTex }), edgeMat, edgeMat];
    const mesh = new THREE.Mesh(cardGeo, materials); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
let playerPrevCount = 0, oppPrevCount = 0;

// ── SHOCK EFFECTS ──
let shakeIntensity = 0, shakeDecay = 3.5;
function updateShake(dt) {
    if (shakeIntensity <= 0) return;
    shakeIntensity = Math.max(0, shakeIntensity - dt * shakeDecay);
    camera.position.set(camBase.x + (Math.random()-0.5)*shakeIntensity, camBase.y + (Math.random()-0.5)*shakeIntensity*0.5, camBase.z + (Math.random()-0.5)*shakeIntensity*0.3);
    camera.lookAt(0, 0.5, -0.5);
}
const shockArcs = [];
function triggerShock3D(who, double) {
    const targetZ = who === 'p1' ? PLAYER_Z : OPP_Z;
    for (let a = 0; a < (double ? 3 : 2); a++) {
        const startPt = new THREE.Vector3((Math.random()-0.5)*0.2, 0.8, 0);
        const endPt = new THREE.Vector3((Math.random()-0.5)*2, 0.12, targetZ + (Math.random()-0.5)*0.5);
        const pts = []; for (let i=0; i<=8; i++) {
            const t = i/8, jag = (i>0 && i<8) ? (Math.random()-0.5)*0.45 : 0;
            pts.push(new THREE.Vector3(startPt.x+(endPt.x-startPt.x)*t+jag, startPt.y+(endPt.y-startPt.y)*t+(Math.random()-0.5)*0.3, startPt.z+(endPt.z-startPt.z)*t+jag*0.5));
        }
        const arcMat = new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.9 });
        const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4, false), arcMat);
        scene.add(arc); let elapsed = 0; shockArcs.push({ mesh: arc, mat: arcMat, update(dt) {
            elapsed += dt; const t = elapsed / 0.7; if (t>=1) { scene.remove(arc); return true; }
            arcMat.opacity = (1-t*t)*(0.6+0.4*Math.abs(Math.sin(elapsed*30))); return false;
        }});
    }
    shakeIntensity = double ? 0.32 : 0.18;
}

// ── AUDIO ──
let audioCtx = null, bgMusic = null, musicFilter = null, audioAnalyser = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicFilter = audioCtx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 20000;
        musicFilter.connect(audioCtx.destination); audioAnalyser = audioCtx.createAnalyser(); musicFilter.connect(audioAnalyser);
        loadGrunts();
    }
}
function startMusic() {
    if (bgMusic) return; initAudio();
    bgMusic = new Audio('1Askim Cok Pardon (Instrumental Slowed).mp3'); bgMusic.loop = true; bgMusic.volume = 0.4;
    audioCtx.createMediaElementSource(bgMusic).connect(musicFilter); bgMusic.play().catch(e => {});
}
function updateAudioAtmosphere() {
    if (!audioCtx || !state || !state.p1) return;
    musicFilter.frequency.setTargetAtTime((state.phase==='opponent'||state.phase==='dealer-thinking')?800:20000, audioCtx.currentTime, 0.5);
    updateHeartbeat();
}
let lastHeartbeatTime = 0;
function updateHeartbeat() {
    const bpm = 60 + Math.max(Math.max(0, handTotal(state.p1.hand)-15)/6, state.tension/100)*100;
    if (audioCtx.currentTime - lastHeartbeatTime > 60/bpm) {
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.frequency.setValueAtTime(60, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime+0.1);
        g.gain.setValueAtTime(0.1, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.15);
        osc.connect(g); g.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime+0.15);
        lastHeartbeatTime = audioCtx.currentTime;
    }
}
function playShock() {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate*0.6, audioCtx.sampleRate);
    const d = buf.getChannelData(0); for (let i=0; i<d.length; i++) d[i] = (Math.random()*2-1)*Math.exp(-i/audioCtx.sampleRate*5);
    const s = audioCtx.createBufferSource(); s.buffer = buf; s.connect(audioCtx.destination); s.start();
}
function playCardFlip() {
    const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime+0.08);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.08);
    osc.connect(g); g.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime+0.08);
}
function playBluffSound() { /* generic */ }
function playReveal() { /* generic */ }
function playBonusSound() { /* generic */ }
const GRUNT_FILES = ['../tunetank.com_grunt-short-and-high-(male).wav','../universfield-male-exertion-grunts-352689.mp3'];
const gruntBuffers = [];
async function loadGrunts() {
    for (const f of GRUNT_FILES) { try { const r=await fetch(f), a=await r.arrayBuffer(), b=await audioCtx.decodeAudioData(a); gruntBuffers.push(b); } catch(e){} }
}
function playGrunt(d=false) {
    if (!audioCtx || !gruntBuffers.length) return;
    const s = audioCtx.createBufferSource(); s.buffer = gruntBuffers[Math.floor(Math.random()*gruntBuffers.length)];
    const g = audioCtx.createGain(); g.gain.value = d?1.3:0.9; s.connect(g); g.connect(audioCtx.destination); s.start();
}

// ── CARDS ──
const SUITS = ['♠','♥','♦','♣'], RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const HIGH_RANKS = ['9','10','J','Q','K'], LOW_RANKS = ['2','3','4','A'];
function makeDeck() {
    const d = SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r })));
    for (let i=d.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
}
function cardValue(c) { if (['J','Q','K'].includes(c.rank)) return 10; if (c.rank==='A') return 11; return parseInt(c.rank); }
function handTotal(h) {
    let t = 0, a = 0; for (const c of h) { t += cardValue(c); if (c.rank==='A') a++; }
    while (t>21 && a>0) { t -= 10; a--; } return t;
}
function isBust(h) { return handTotal(h)>21; }
function isBlackjack(h) { return h.length===2 && handTotal(h)===21; }
function riggableCard(p) { return { suit: SUITS[Math.floor(Math.random()*4)], rank: p[Math.floor(Math.random()*p.length)] }; }

// ── BONUS ──
const BONUS_DEFS = {
    double_shock: { name:'OVERLOAD', icon:'⚡⚡', desc:'2 lives shock' },
    loaded_high:  { name:'RIGGED HIGH', icon:'🂱', desc:'Opponent high hand' },
    loaded_low:   { name:'RIGGED LOW', icon:'🂢', desc:'Opponent low hand' },
    insulate:     { name:'INSULATOR', icon:'🛡', desc:'Block shock' },
    surge:        { name:'SURGE', icon:'⚡', desc:'Instant shock' }
};
const BONUS_POOL = Object.keys(BONUS_DEFS);
function randomBonus() { return BONUS_POOL[Math.floor(Math.random()*BONUS_POOL.length)]; }

// ── STORY ──
const STORY_EVENTS = [
    { id: 'intro', text: "The basement hums. The machine waits.", trigger: s => s.round===1 && s.phase==='deal' },
    { id: 'near_defeat', text: "One more shock and it's over.", trigger: s => s.p1.lives===1 }
];
let storyTriggered = new Set();
function checkStoryEvents() {
    for (const e of STORY_EVENTS) { if (!storyTriggered.has(e.id) && e.trigger(state)) { storyTriggered.add(e.id); showMessage(e.text, 2500); } }
}

// ── STATE ──
const MAX_LIVES = 3, MAX_ROUNDS = 5;
let gameMode = 'local', state = {};
const online = { ably: null, channel: null, clientId: 'u-'+Math.random().toString(36).substr(2,5), isHost: false, roomCode: '', _resolvers: {} };

function resetState() {
    state = {
        round: 1, deck: makeDeck(), tension: 0, phase: 'deal',
        p1: { lives: MAX_LIVES, hand: [], roundWins: 0, bonusCards: [], name: 'Player 1', nextHandRig: null, shieldNext: false, isBluffing: false },
        p2: { lives: MAX_LIVES, hand: [], roundWins: 0, bonusCards: [], name: 'Player 2', nextHandRig: null, shieldNext: false, aggression: 1.0, bluffFrequency: 0.7, isBluffing: false }
    };
    playerPrevCount = 0; oppPrevCount = 0; storyTriggered.clear(); clearCards3D(playerCards3D); clearCards3D(oppCards3D);
}

// ── NETWORKING (ABLY) ──
function sendNet(name, data = {}) { if (online.channel) online.channel.publish(name, { sender: online.clientId, ...data }); }
function broadcastState() {
    if (!online.isHost) return;
    sendNet('state', { s: { p1l: state.p1.lives, p2l: state.p2.lives, p1w: state.p1.roundWins, p2w: state.p2.roundWins, p1b: state.p1.bonusCards, p2b: state.p2.bonusCards, p1B: state.p1.isBluffing, p2B: state.p2.isBluffing, r: state.round, t: state.tension } });
}
function applyNetState(s) {
    state.p1.lives = s.p1l; state.p2.lives = s.p2l; state.p1.roundWins = s.p1w; state.p2.roundWins = s.p2w;
    state.p1.bonusCards = s.p1b; state.p2.bonusCards = s.p2b; state.p1.isBluffing = s.p1B; state.p2.isBluffing = s.p2B;
    state.round = s.r; state.tension = s.t; updateUI();
}
function handleNetMessage(msg) {
    if (msg.data.sender === online.clientId) return;
    const type = msg.name, data = msg.data;
    if (online.isHost) {
        if (type === 'action' && online._resolvers.action) { online._resolvers.action(data.claim !== undefined ? data : data.value); delete online._resolvers.action; }
        if (type === 'guestJoined') { document.getElementById('lobby-status').textContent = 'Guest Connected!'; sendNet('hostAck'); }
    } else {
        switch (type) {
            case 'hostAck': if (online._resolvers.join) online._resolvers.join(); break;
            case 'message': showMessage(data.text, data.duration); break;
            case 'state': applyNetState(data.s); break;
            case 'yourTurn': applyNetState(data.s); startGuestTurnUI(data.hand); break;
            case 'shock': doShock(data.who, data.double); break;
            case 'reveal': playReveal(); renderHand(data.gh, true); renderOppHand(data.hh, true, `Opponent: ${handTotal(data.hh)}`); break;
            case 'bonus': playBonusSound(); break;
            case 'oppAction': ui.oppStatus.textContent = data.action === 'hit' ? 'Opponent hits...' : 'Opponent stands.'; break;
            case 'waitBluffCall': startGuestBluffCallUI(data.claim); break;
            case 'gameOver': applyNetState(data.s); showGameOver(data.winner); break;
        }
    }
}

// ── UI ──
const ui = {
    p1Lives: document.getElementById('p1-lives'), p2Lives: document.getElementById('p2-lives'),
    p1Name: document.getElementById('p1-name-label'), p2Name: document.getElementById('p2-name-label'),
    roundDisplay: document.getElementById('round-display'), tensionBar: document.getElementById('tension-bar'),
    messageBox: document.getElementById('message-box'), handArea: document.getElementById('hand-area'),
    handValue: document.getElementById('hand-value'), oppArea: document.getElementById('opponent-area'),
    oppStatus: document.getElementById('opp-status'), actionArea: document.getElementById('action-area'),
    actionLabel: document.getElementById('action-label'), bluffRow: document.getElementById('bluff-row'),
    drawRow: document.getElementById('draw-row'), turnBanner: document.getElementById('turn-banner'),
    loreScreen: document.getElementById('lore-screen'), loreText: document.getElementById('lore-text'), loreClose: document.getElementById('lore-close')
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
function renderHand(h, all=true) {
    clearCards3D(playerCards3D); const xs = cardXPositions(h.length);
    for (let i=0; i<h.length; i++) {
        const m = makeCardMesh(h[i], !all && i>0); m.position.copy(DECK_POS); scene.add(m); playerCards3D.push(m);
        animateToDelayed(m, new THREE.Vector3(xs[i], 0.075, PLAYER_Z), 0.35, i*0.08);
    }
    ui.handValue.textContent = all ? `Total: ${handTotal(h)}` : `Showing: ${cardValue(h[0])}`;
    ui.handArea.classList.remove('hidden');
}
function renderOppHand(h, all=false, status='') {
    clearCards3D(oppCards3D); const xs = cardXPositions(h.length);
    for (let i=0; i<h.length; i++) {
        const m = makeCardMesh(h[i], !all); m.position.copy(DECK_POS); m.rotation.y = Math.PI; scene.add(m); oppCards3D.push(m);
        animateToDelayed(m, new THREE.Vector3(xs[i], 0.075, OPP_Z), 0.35, i*0.08);
    }
    ui.oppStatus.textContent = status; ui.oppArea.classList.remove('hidden');
}

// ── LOGIC ──
async function doShock(who, double=false) {
    initAudio(); const l = double?2:1;
    if (state[who].shieldNext) { state[who].shieldNext=false; await showMessage('Shielded!', 1500); return; }
    double ? playBigShock() : playShock(); triggerShock3D(who, double);
    state[who].lives = Math.max(0, state[who].lives - l); updateUI(); await wait(500);
}
function drawCard() { if (state.deck.length<8) state.deck = [...state.deck, ...makeDeck()]; return state.deck.pop(); }
async function dealRound() { state.p1.hand = [drawCard(), drawCard()]; state.p2.hand = [drawCard(), drawCard()]; updateUI(); }

// ── ACTIONS ──
let _actionResolve = null;
function waitForAction(who, busted=false) {
    return new Promise(res => {
        _actionResolve = res; ui.actionArea.classList.remove('hidden');
        ui.actionLabel.textContent = busted ? 'BUSTED. Bluff or Fold?' : 'Your Turn';
        document.getElementById('btn-hit').disabled = busted;
    });
}
function waitForBluffResponse(who, claim) {
    return new Promise(res => {
        ui.actionLabel.textContent = `Opponent claims ${claim}. Call or Fold?`;
        ui.drawRow.classList.add('hidden'); ui.bluffRow.classList.remove('hidden');
        document.getElementById('btn-bluff').textContent = '⚡ CALL';
        document.getElementById('btn-bluff').onclick = () => { ui.drawRow.classList.remove('hidden'); res('call'); };
        document.getElementById('btn-fold').onclick = () => { ui.drawRow.classList.remove('hidden'); res('fold'); };
    });
}

// ── LOBBY ──
function generateCode() { return Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*33)]).join(''); }
function showLobby() {
    return new Promise(res => {
        const lobby = document.getElementById('lobby-screen'), setup = document.getElementById('online-setup');
        wireBtn('mode-local', () => { gameMode='local'; lobby.classList.add('hidden'); res('local'); });
        wireBtn('mode-ai', () => { gameMode='ai'; lobby.classList.add('hidden'); res('ai'); });
        wireBtn('mode-online', () => { document.getElementById('lobby-buttons').classList.add('hidden'); setup.classList.remove('hidden'); });
        wireBtn('create-room-btn', async () => {
            const code = generateCode(); online.roomCode = code; online.isHost = true;
            online.ably = new Ably.Realtime({ key: '7-pZ_A.8AnZ_g:ZTo_v_v_v_v_v_v_v_v' });
            online.channel = online.ably.channels.get('room-'+code);
            online.channel.subscribe(handleNetMessage);
            document.getElementById('online-options').classList.add('hidden');
            document.getElementById('room-code-display').classList.remove('hidden');
            document.getElementById('room-code-text').textContent = code;
        });
        wireBtn('join-room-btn', async () => {
            const code = document.getElementById('join-code-input').value.trim().toUpperCase();
            online.roomCode = code; online.isHost = false;
            online.ably = new Ably.Realtime({ key: '7-pZ_A.8AnZ_g:ZTo_v_v_v_v_v_v_v_v' });
            online.channel = online.ably.channels.get('room-'+code);
            online.channel.subscribe(handleNetMessage);
            sendNet('guestJoined');
            const joinWait = new Promise((ok, fail) => { online._resolvers.join = ok; setTimeout(fail, 10000); });
            try { await joinWait; gameMode='online'; lobby.classList.add('hidden'); res('online-guest'); }
            catch(e) { document.getElementById('lobby-status').textContent = 'Host not found.'; }
        });
    });
}

function wireBtn(id, cb) { const el=document.getElementById(id); if (el) el.onclick=cb; }
wireBtn('btn-hit', () => { if(_actionResolve){ _actionResolve('hit'); _actionResolve=null; } });
wireBtn('btn-stand', () => { if(_actionResolve){ _actionResolve('stand'); _actionResolve=null; } });
wireBtn('btn-bluff', () => { if(_actionResolve){ _actionResolve('bluff'); _actionResolve=null; } });
wireBtn('btn-fold', () => { if(_actionResolve){ _actionResolve('fold'); _actionResolve=null; } });

// ── LOOPS ──
async function runOnlineHostGame() {
    resetState(); updateUI();
    while (true) {
        await dealRound(); broadcastState();
        renderHand(state.p1.hand, true); renderOppHand(state.p2.hand, false, 'Opponent turn');
        const action = await waitForAction('p1', isBust(state.p1.hand));
        if (action === 'hit') { state.p1.hand.push(drawCard()); broadcastState(); }
        // Simplified loop logic for v1.4.0 demo
        state.round++; broadcastState(); await wait(2000);
    }
}

async function startGame() {
    const mode = await showLobby(); startMusic();
    if (mode === 'local') { resetState(); updateUI(); await dealRound(); }
    else if (mode === 'online-host') { await runOnlineHostGame(); }
}

function animate() {
    requestAnimationFrame(animate); const dt = clock.getDelta();
    updateSwingingLight(dt); updateFlicker(dt); updateAudioAtmosphere();
    updateAvatars(dt); updateDevice(dt); updateShake(dt);
    for (let i=tweens.length-1; i>=0; i--) if (tweens[i].update(dt)) tweens.splice(i,1);
    for (let i=particles.length-1; i>=0; i--) if (particles[i].update(dt)) particles.splice(i,1);
    for (let i=shockArcs.length-1; i>=0; i--) if (shockArcs[i].update(dt)) shockArcs.splice(i,1);
    renderer.render(scene, camera);
}
animate();
startGame();
