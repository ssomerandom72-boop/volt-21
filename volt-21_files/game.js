// ═══════════════════════════════════════════════
//  VOLTAGE 21 — Survival Horror Blackjack
// ═══════════════════════════════════════════════

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
        // Portrait: pull back and go more overhead so cards are visible
        camera.fov = 72;
        camera.position.set(0, 11, 13);
        camBase.set(0, 11, 13);
    } else if (w < 768) {
        // Landscape mobile: slightly wider FOV
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
scene.add(mainLight);

const fillLeft = new THREE.PointLight(0x6600cc, 2.5, 14);
fillLeft.position.set(-5, 3, 2);
scene.add(fillLeft);

const fillRight = new THREE.PointLight(0x6600cc, 2.5, 14);
fillRight.position.set(5, 3, 2);
scene.add(fillRight);

// Extra light aimed at opponent card zone so their cards are readable
const oppLight = new THREE.PointLight(0x9944ff, 3.5, 10);
oppLight.position.set(0, 3.5, -2.5);
scene.add(oppLight);

// ── FLICKER STATE ──
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
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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

// Table legs
const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8);
const legMat = new THREE.MeshStandardMaterial({ color: 0x0d0018, roughness: 0.7, metalness: 0.4 });
const legPositions = [[-3.3, -0.61, -2.5], [3.3, -0.61, -2.5], [-3.3, -0.61, 2.5], [3.3, -0.61, 2.5]];
for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    scene.add(leg);
}

// Purple emissive trim strips
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

// Center dividing line
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

// Hanging light fixture
const fixtureGroup = new THREE.Group();

const wireGeo = new THREE.CylinderGeometry(0.008, 0.008, 3.0, 6);
const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const wire = new THREE.Mesh(wireGeo, wireMat);
wire.position.set(0, 1.0, 0);
fixtureGroup.add(wire);

const shadeGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.22, 12, 1, true);
const shadeMat = new THREE.MeshStandardMaterial({ color: 0x0a000f, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide });
const shade = new THREE.Mesh(shadeGeo, shadeMat);
shade.position.set(0, -0.55, 0);
fixtureGroup.add(shade);

const bulbGeo = new THREE.SphereGeometry(0.07, 8, 8);
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xaa88ff, emissive: 0xaa44ff, emissiveIntensity: 2.0 });
const bulb = new THREE.Mesh(bulbGeo, bulbMat);
bulb.position.set(0, -0.6, 0);
fixtureGroup.add(bulb);

fixtureGroup.position.set(0, 7.0, 0);
scene.add(fixtureGroup);

// ── ELECTRIC DEVICE (center of table) ──
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

// Glowing sphere tips
const tipGeo = new THREE.SphereGeometry(0.038, 10, 10);
let tipMatLeft = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.5, roughness: 0.2 });
let tipMatRight = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.5, roughness: 0.2 });

const tipLeft = new THREE.Mesh(tipGeo, tipMatLeft);
tipLeft.position.set(-0.1, 0.795, 0);
deviceGroup.add(tipLeft);

const tipRight = new THREE.Mesh(tipGeo, tipMatRight);
tipRight.position.set(0.1, 0.795, 0);
deviceGroup.add(tipRight);

// Device internal glow light
const deviceLight = new THREE.PointLight(0x9900ff, 0.8, 1.2);
deviceLight.position.set(0, 0.8, 0);
deviceGroup.add(deviceLight);

deviceGroup.position.copy(DEVICE_POS);
scene.add(deviceGroup);

// ── SIDE ELECTRODE STANDS + CABLES ──
const standMat2   = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, metalness: 0.88, roughness: 0.22 });
const padMat2     = new THREE.MeshStandardMaterial({ color: 0x1a0025, metalness: 0.7, roughness: 0.4, emissive: 0x330055, emissiveIntensity: 0.7 });
const contactMat2 = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 2.2, roughness: 0.1 });
const cableMat2   = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85, metalness: 0.3 });

function buildElectrodeStand(x, z) {
    const g = new THREE.Group();
    const inward = x < 0 ? 1 : -1;

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.18), standMat2);
    base.position.set(0, 0.095, 0);
    g.add(base);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.05, 8), standMat2);
    rod.position.set(0, 0.645, 0);
    g.add(rod);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 6), standMat2);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(inward * 0.275, 1.15, 0);
    g.add(arm);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.055, 16), padMat2);
    pad.rotation.z = Math.PI / 2;
    pad.position.set(inward * 0.55, 1.15, 0);
    g.add(pad);

    const contact = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), contactMat2);
    contact.position.set(inward * 0.578, 1.15, 0);
    g.add(contact);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 6, 12), standMat2);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(inward * 0.545, 1.15, 0);
    g.add(ring);

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
    const pulse = 0.5 + 0.5 * Math.sin(deviceTime * 2.1);
    const pulse2 = 0.5 + 0.5 * Math.sin(deviceTime * 3.3 + 1.1);
    tipMatLeft.emissiveIntensity = 1.8 + pulse * 1.5;
    tipMatRight.emissiveIntensity = 1.8 + pulse2 * 1.5;
    deviceLight.intensity = 0.5 + pulse * 0.7;
}

// ── DECK PILE ──
const DECK_POS = new THREE.Vector3(-3.1, 0.065, 0.4);
const deckEdgeMat = new THREE.MeshStandardMaterial({ color: 0x180020, emissive: 0x180020, emissiveIntensity: 0.4 });

function makeBackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 358;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#07000e';
    ctx.fillRect(0, 0, 256, 358);
    ctx.strokeStyle = '#4a0066';
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 7, 242, 344);
    ctx.strokeStyle = '#330044';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 228, 330);
    ctx.strokeStyle = 'rgba(60,0,90,0.35)';
    ctx.lineWidth = 1;
    const step = 16;
    for (let i = -358; i < 256 + 358; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 358, 358); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i, 358); ctx.lineTo(i + 358, 0); ctx.stroke();
    }
    ctx.fillStyle = '#aa44ff';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V-21', 128, 179);
    return new THREE.CanvasTexture(canvas);
}

const backTex = makeBackTexture();
const deckCardGeo = new THREE.BoxGeometry(0.75, 0.018, 1.05);
const deckBackMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 });

for (let i = 0; i < 12; i++) {
    const materials = [deckEdgeMat, deckEdgeMat, deckBackMat, deckBackMat, deckEdgeMat, deckEdgeMat];
    const mesh = new THREE.Mesh(deckCardGeo, materials);
    mesh.position.set(DECK_POS.x + (Math.random() - 0.5) * 0.02, DECK_POS.y + i * 0.019, DECK_POS.z + (Math.random() - 0.5) * 0.02);
    mesh.rotation.y = (Math.random() - 0.5) * 0.1 - 0.15;
    mesh.castShadow = true;
    scene.add(mesh);
}

// ── CARD TEXTURES ──
const faceTexCache = new Map();

function makeFaceTexture(rank, suit) {
    const key = rank + suit;
    if (faceTexCache.has(key)) return faceTexCache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 358;
    const ctx = canvas.getContext('2d');

    const red = suit === '♥' || suit === '♦';
    const cardColor = red ? '#cc1133' : '#220033';

    ctx.fillStyle = '#f4edff';
    ctx.fillRect(0, 0, 256, 358);

    ctx.strokeStyle = '#3a0055';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 246, 348);
    ctx.strokeStyle = '#5a0077';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, 236, 338);

    ctx.fillStyle = cardColor;
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, 16, 14);
    ctx.font = '24px serif';
    ctx.fillText(suit, 16, 48);

    ctx.save();
    ctx.translate(240, 344);
    ctx.rotate(Math.PI);
    ctx.fillStyle = cardColor;
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, 16, 14);
    ctx.font = '24px serif';
    ctx.fillText(suit, 16, 48);
    ctx.restore();

    ctx.font = '96px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = cardColor;
    ctx.globalAlpha = 0.85;
    ctx.fillText(suit, 128, 179);
    ctx.globalAlpha = 1.0;

    const tex = new THREE.CanvasTexture(canvas);
    faceTexCache.set(key, tex);
    return tex;
}

// ── 3D CARD MANAGEMENT ──
const PLAYER_Z = 1.9;
const OPP_Z = -1.9;

let playerCards3D = [];
let oppCards3D = [];

const tweens = [];

function animateToDelayed(mesh, targetPos, duration, delay) {
    const startPos = mesh.position.clone();
    let elapsed = -delay;
    tweens.push({
        update(dt) {
            elapsed += dt;
            if (elapsed < 0) return false;
            const t = Math.min(1, elapsed / duration);
            // ease out cubic
            const e = 1 - Math.pow(1 - t, 3);
            mesh.position.lerpVectors(startPos, targetPos, e);
            return t >= 1;
        }
    });
}

function cardXPositions(count) {
    const spacing = count > 4 ? 0.78 : 0.85;
    const positions = [];
    const half = (count - 1) * spacing * 0.5;
    for (let i = 0; i < count; i++) {
        positions.push(i * spacing - half);
    }
    return positions;
}

function layoutCards3D(cards3D, zRow) {
    const xs = cardXPositions(cards3D.length);
    for (let i = 0; i < cards3D.length; i++) {
        cards3D[i].userData.targetPos = new THREE.Vector3(xs[i], 0.075, zRow);
    }
}

function clearCards3D(arr) {
    for (const mesh of arr) {
        scene.remove(mesh);
        if (Array.isArray(mesh.material)) {
            for (const m of mesh.material) {
                if (m !== deckEdgeMat) m.dispose();
            }
        }
    }
    arr.length = 0;
}

function makeCardMesh(card, faceDown) {
    const cardGeo = new THREE.BoxGeometry(0.75, 0.018, 1.05);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x180020, emissive: 0x180020, emissiveIntensity: 0.4, roughness: 0.6 });
    let topMat;
    if (faceDown) {
        topMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 });
    } else {
        const faceTex = makeFaceTexture(card.rank, card.suit);
        topMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 });
    }
    const backFaceMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 });
    // [right, left, top, bottom, front, back]
    // material[2] = top face (visible from above camera)
    const materials = [edgeMat, edgeMat, topMat, backFaceMat, edgeMat, edgeMat];
    const mesh = new THREE.Mesh(cardGeo, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

let playerPrevCount = 0;
let oppPrevCount = 0;

// ── SHOCK 3D EFFECTS ──
let shakeIntensity = 0;
let shakeDecay = 3.5;

function updateShake(dt) {
    if (shakeIntensity <= 0) return;
    shakeIntensity = Math.max(0, shakeIntensity - dt * shakeDecay);
    const s = shakeIntensity;
    camera.position.set(
        camBase.x + (Math.random() - 0.5) * s,
        camBase.y + (Math.random() - 0.5) * s * 0.5,
        camBase.z + (Math.random() - 0.5) * s * 0.3
    );
    camera.lookAt(0, 0.5, -0.5);
}

const shockArcs = [];

function triggerShock3D(who, double) {
    const targetZ = who === 'p1' ? PLAYER_Z : OPP_Z;
    const arcCount = double ? 3 : 2;

    for (let a = 0; a < arcCount; a++) {
        const startPt = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            0.8,
            0.0
        );
        const endPt = new THREE.Vector3(
            (Math.random() - 0.5) * 2.0,
            0.12,
            targetZ + (Math.random() - 0.5) * 0.5
        );

        const pts = [];
        for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            const jag = (i > 0 && i < 8) ? (Math.random() - 0.5) * 0.45 : 0;
            pts.push(new THREE.Vector3(
                startPt.x + (endPt.x - startPt.x) * t + jag,
                startPt.y + (endPt.y - startPt.y) * t + (Math.random() - 0.5) * 0.3,
                startPt.z + (endPt.z - startPt.z) * t + jag * 0.5
            ));
        }

        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.012, 4, false);
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.9
        });
        const arc = new THREE.Mesh(tubeGeo, arcMat);
        scene.add(arc);

        const duration = 0.65 + Math.random() * 0.25;
        let elapsed = 0;
        let flickPhase = 0;

        shockArcs.push({
            mesh: arc,
            mat: arcMat,
            update(dt) {
                elapsed += dt;
                flickPhase += dt * 30;
                const t = elapsed / duration;
                if (t >= 1) {
                    scene.remove(arc);
                    tubeGeo.dispose();
                    arcMat.dispose();
                    return true;
                }
                const flick = 0.6 + 0.4 * Math.abs(Math.sin(flickPhase));
                arcMat.opacity = (1 - t * t) * flick;
                return false;
            }
        });
    }

    // Blue flash light
    const flashLight = new THREE.PointLight(0x44aaff, double ? 12 : 8, 6);
    flashLight.position.set(0, 2.0, targetZ * 0.5);
    scene.add(flashLight);
    let flashElapsed = 0;
    const flashDur = 0.4;
    shockArcs.push({
        mesh: null,
        update(dt) {
            flashElapsed += dt;
            const t = flashElapsed / flashDur;
            if (t >= 1) { scene.remove(flashLight); return true; }
            flashLight.intensity = (double ? 12 : 8) * (1 - t * t);
            return false;
        }
    });

    // Camera shake
    shakeIntensity = double ? 0.32 : 0.18;
}

// ── AUDIO ──
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        loadGrunts();
    }
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

const GRUNT_FILES = [
    '../tunetank.com_grunt-short-and-high-(male).wav',
    '../universfield-male-exertion-grunts-352689.mp3',
];
const gruntBuffers = [];
async function loadGrunts() {
    for (const file of GRUNT_FILES) {
        try {
            const res = await fetch(file);
            const arr = await res.arrayBuffer();
            const buf = await audioCtx.decodeAudioData(arr);
            gruntBuffers.push(buf);
        } catch (e) { /* file missing or decode failed, skip */ }
    }
}

function playGrunt(double = false) {
    if (!audioCtx || gruntBuffers.length === 0) return;
    const buf = gruntBuffers[Math.floor(Math.random() * gruntBuffers.length)];
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.value = double ? 1.3 : 0.9;
    src.connect(gain); gain.connect(audioCtx.destination);
    src.start();
}

// ── CARDS ──
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const HIGH_RANKS = ['9','10','J','Q','K','10','J','Q','K','10'];
const LOW_RANKS  = ['2','3','4','2','3','4','2','3','A','5'];

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

// ── STORY SYSTEM ──
const STORY_EVENTS = [
    {
        id: 'intro',
        text: "The basement hums with anticipation. The machine waits. Your pulse syncs with the failing lights.",
        trigger: (s) => s.round === 1 && s.phase === 'deal'
    },
    {
        id: 'first_shock',
        text: "The first jolt rattles your bones. You taste copper. The machine is hungry.",
        trigger: (s) => s.round === 1 && s.p1.lives < MAX_LIVES
    },
    {
        id: 'losing_streak',
        text: "Another failure. The walls seem to breathe. Something watches from the shadows.",
        trigger: (s) => s.round >= 2 && s.p1.roundWins === 0
    },
    {
        id: 'winning_streak',
        text: "Victory tastes like static. The machine growls. It doesn't like to lose.",
        trigger: (s) => s.round >= 2 && s.p1.roundWins >= 2
    },
    {
        id: 'final_round',
        text: "The final round. The air crackles. This isn't just a game anymore.",
        trigger: (s) => s.round === MAX_ROUNDS
    },
    {
        id: 'near_defeat',
        text: "One more shock and it's over. The lights flicker like a dying heartbeat.",
        trigger: (s) => s.p1.lives === 1
    },
    {
        id: 'blood_cards',
        text: "The cards feel warm. Are those... fingerprints? No, just the humidity.",
        trigger: (s) => s.round >= 3 && s.tension > 70
    },
    {
        id: 'whispers',
        text: "Did you hear that? Just the wind through the broken window. Probably.",
        trigger: (s) => s.round >= 4 && Math.random() < 0.3
    }
];

let storyTriggered = new Set();

function checkStoryEvents() {
    if (!state || !state.p1) return;
    for (const event of STORY_EVENTS) {
        if (storyTriggered.has(event.id)) continue;
        if (event.trigger(state)) {
            storyTriggered.add(event.id);
            triggerStoryEvent(event);
        }
    }
}

function triggerStoryEvent(event) {
    // Visual glitch
    state.glitchIntensity = 1.5;
    
    // Audio whisper
    playWhisper();
    
    // Text message
    showMessage(event.text, 2500);
    
    // Blood splatter effect on cards
    if (event.id === 'blood_cards') {
        addBloodSplatter();
    }
}

function playWhisper() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 2.0);
    g.gain.setValueAtTime(0.05, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.0);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 2.0);
}

function addBloodSplatter() {
    // Create blood texture
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 358;
    const ctx = canvas.getContext('2d');
    
    // Draw blood splatters
    ctx.fillStyle = 'rgba(100, 0, 0, 0.6)';
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 358, Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const bloodTex = new THREE.CanvasTexture(canvas);
    
    // Apply to all visible cards
    [...playerCards3D, ...oppCards3D].forEach(mesh => {
        if (Array.isArray(mesh.material)) {
            mesh.material[2].map = bloodTex;
            mesh.material[2].needsUpdate = true;
        }
    });
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
            nextHandRig: null,
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
        glitchIntensity: 0,
    };
    playerPrevCount = 0;
    oppPrevCount = 0;
    storyTriggered.clear();
    clearCards3D(playerCards3D);
    clearCards3D(oppCards3D);
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
    handValue:    document.getElementById('hand-value'),
    oppArea:      document.getElementById('opponent-area'),
    oppStatus:    document.getElementById('opp-status'),
    actionArea:   document.getElementById('action-area'),
    actionLabel:  document.getElementById('action-label'),
    bluffRow:     document.getElementById('bluff-row'),
    drawRow:      document.getElementById('draw-row'),
    gameOver:     document.getElementById('game-over-screen'),
    gameOverTitle:document.getElementById('game-over-title'),
    shockOverlay: document.getElementById('shock-overlay'),
    turnBanner:   document.getElementById('turn-banner'),
    storyScreen:  document.getElementById('story-screen'),
    storyText:    document.getElementById('story-text'),
    storyNext:    document.getElementById('story-continue'),
};

async function typeWriter(text, element, speed = 40) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        if (text[i] !== ' ') await wait(speed);
    }
}

// ── BONUS CARD UI ──
function injectBonusUI() {
    const p1Panel = document.getElementById('p1-panel');
    const p2Panel = document.getElementById('p2-panel');

    if (!document.getElementById('p1-bonus-row')) {
        const p1Bonus = document.createElement('div');
        p1Bonus.id = 'p1-bonus-row';
        p1Bonus.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;justify-content:center;min-height:20px;margin-top:4px;';
        p1Panel.appendChild(p1Bonus);
    }

    if (!document.getElementById('p2-bonus-row')) {
        const p2Bonus = document.createElement('div');
        p2Bonus.id = 'p2-bonus-row';
        p2Bonus.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;justify-content:center;min-height:20px;margin-top:4px;';
        p2Panel.appendChild(p2Bonus);
    }

    const centerInfo = document.getElementById('center-info');
    if (!document.getElementById('win-row')) {
        const winRow = document.createElement('div');
        winRow.id = 'win-row';
        winRow.style.cssText = 'display:flex;gap:6px;align-items:center;font-size:0.5em;letter-spacing:4px;color:#440055;';
        winRow.innerHTML = '<span id="p1-wins">P1: 0</span><span style="color:#220033">|</span><span id="p2-wins">P2: 0</span>';
        centerInfo.appendChild(winRow);
    }
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

    ui.bluffFill.style.height = `${Math.min(100, state.tension)}%`;

    renderBonusCards('p1');
    renderBonusCards('p2');
}

// ── 3D RENDER HAND ──
function renderHand(hand, showAll = true) {
    const prevCount = playerPrevCount;
    const freshDeal = prevCount === 0 || prevCount >= hand.length;

    clearCards3D(playerCards3D);

    const xs = cardXPositions(hand.length);
    for (let i = 0; i < hand.length; i++) {
        const faceDown = !showAll && i > 0;
        const mesh = makeCardMesh(hand[i], faceDown);
        // Start at deck position
        mesh.position.copy(DECK_POS);
        mesh.position.y = DECK_POS.y + 0.3 + i * 0.01;
        scene.add(mesh);
        playerCards3D.push(mesh);

        const targetPos = new THREE.Vector3(xs[i], 0.075, PLAYER_Z);
        const delay = freshDeal ? i * 0.08 : (i === hand.length - 1 ? 0 : -1);

        if (delay >= 0) {
            animateToDelayed(mesh, targetPos, 0.35, delay);
        } else {
            mesh.position.copy(targetPos);
        }
    }

    playerPrevCount = hand.length;

    const total = handTotal(hand);
    ui.handValue.textContent = showAll
        ? `Total: ${total}${isBust(hand) ? ' — BUST' : isBlackjack(hand) ? ' — BLACKJACK!' : ''}`
        : `Showing: ${cardValue(hand[0])}`;
    ui.handArea.classList.remove('hidden');

    // Live total badge
    const ptBadge = document.getElementById('player-total');
    if (ptBadge && showAll) {
        ptBadge.textContent = isBust(hand) ? `BUST` : isBlackjack(hand) ? `21 ⚡` : `${total}`;
        ptBadge.className = 'total-badge' + (isBust(hand) ? ' busted' : isBlackjack(hand) ? ' blackjack' : '');
        ptBadge.classList.remove('hidden');
    }
}

function renderOppHand(hand, showAll = false, statusText = '') {
    const prevCount = oppPrevCount;
    const freshDeal = prevCount === 0 || prevCount >= hand.length;

    clearCards3D(oppCards3D);

    const xs = cardXPositions(hand.length);
    for (let i = 0; i < hand.length; i++) {
        const faceDown = !showAll;
        const mesh = makeCardMesh(hand[i], faceDown);
        mesh.position.copy(DECK_POS);
        mesh.position.y = DECK_POS.y + 0.3 + i * 0.01;
        // Rotate 180 around Y so card faces away from camera (opponent's perspective)
        mesh.rotation.y = Math.PI;
        scene.add(mesh);
        oppCards3D.push(mesh);

        const targetPos = new THREE.Vector3(xs[i], 0.075, OPP_Z);
        const delay = freshDeal ? i * 0.08 : (i === hand.length - 1 ? 0 : -1);

        if (delay >= 0) {
            animateToDelayed(mesh, targetPos, 0.35, delay);
        } else {
            mesh.position.copy(targetPos);
        }
    }

    oppPrevCount = hand.length;

    // Opponent total badge — show count when hidden, total when revealed
    const otBadge = document.getElementById('opp-total');
    if (otBadge) {
        if (showAll && hand.length > 0) {
            const ot = handTotal(hand);
            otBadge.textContent = isBust(hand) ? `BUST` : isBlackjack(hand) ? `21 ⚡` : `${ot}`;
            otBadge.className = 'total-badge' + (isBust(hand) ? ' busted' : isBlackjack(hand) ? ' blackjack' : '');
        } else {
            otBadge.textContent = hand.length > 0 ? `${hand.length} cards` : '';
            otBadge.className = 'total-badge';
        }
        if (hand.length > 0) otBadge.classList.remove('hidden');
        else otBadge.classList.add('hidden');
    }

    ui.oppStatus.textContent = statusText;
    ui.oppArea.classList.remove('hidden');
}

// ── SHOCK ──
async function doShock(who, double = false) {
    initAudio();
    const lives = double ? 2 : 1;

    if (state[who].shieldNext) {
        state[who].shieldNext = false;
        const shieldIdx = state[who].bonusCards.indexOf('insulate');
        if (shieldIdx !== -1) state[who].bonusCards.splice(shieldIdx, 1);
        await showMessage(`${state[who].name}'s INSULATOR absorbs the shock!`, 1800);
        updateUI();
        return;
    }

    double ? playBigShock() : playShock();
    setTimeout(() => playGrunt(double), 80);
    ui.shockOverlay.classList.remove('shocking');
    void ui.shockOverlay.offsetWidth;
    ui.shockOverlay.classList.add('shocking');

    // 3D shock effects
    triggerShock3D(who, double);

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
    playerPrevCount = 0;
    oppPrevCount = 0;
    state.p1.hand = dealHand('p1');
    state.p2.hand = dealHand('p2');
    state.p1.claim = null;
    state.p2.claim = null;
    playCardFlip();
    await wait(200);
    playCardFlip();
    updateUI();
}

// ── BONUS CARD AWARD ──
async function awardBonus(who) {
    const card = randomBonus();
    playBonusSound();

    if (card === 'surge') {
        const opp = who === 'p1' ? 'p2' : 'p1';
        await showMessage(`${state[who].name} draws SURGE — instant shock!`, 2000);
        const useDouble = consumeDoubleShock(who);
        await doShock(opp, useDouble);
        return;
    }

    if (card === 'insulate') {
        state[who].shieldNext = true;
    }

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
        // Re-wire every time so local 2P works even if online mode overwrote these
        document.getElementById('btn-hit').onclick   = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('hit'); } };
        document.getElementById('btn-stand').onclick = () => { if (_actionResolve) { const r = _actionResolve; _actionResolve = null; r('stand'); } };
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

function waitForClaim() {
    return new Promise(resolve => {
        ui.actionLabel.textContent = 'Claim your hand value:';
        ui.drawRow.classList.add('hidden');
        ui.bluffRow.innerHTML = '';
        const claims = [15, 16, 17, 18, 19, 20, 21];
        for (const val of claims) {
            const btn = document.createElement('button');
            btn.textContent = val === 21 ? '21 (BJ)' : String(val);
            btn.style.padding = '10px 18px';
            btn.onclick = () => {
                ui.drawRow.classList.remove('hidden');
                resetBluffRow();
                resolve(val);
            };
            ui.bluffRow.appendChild(btn);
        }
        ui.bluffRow.classList.remove('hidden');
        ui.actionArea.classList.remove('hidden');
    });
}

function waitForShowdownChallenge(loserWho, winnerLabel) {
    return new Promise(resolve => {
        _actionResolve = null;
        ui.actionLabel.textContent = `${state[loserWho].name}: ${winnerLabel} — Call Bluff or Accept?`;
        ui.drawRow.classList.add('hidden');
        ui.bluffRow.innerHTML = `
            <button id="btn-do-challenge" class="danger">⚡ Call Bluff</button>
            <button id="btn-no-challenge" class="safe">Accept</button>`;
        document.getElementById('btn-do-challenge').onclick = () => { ui.bluffRow.innerHTML = ''; ui.drawRow.classList.remove('hidden'); ui.actionArea.classList.add('hidden'); resolve('call'); };
        document.getElementById('btn-no-challenge').onclick = () => { ui.bluffRow.innerHTML = ''; ui.drawRow.classList.remove('hidden'); ui.actionArea.classList.add('hidden'); resolve('accept'); };
        ui.bluffRow.classList.remove('hidden');
        ui.actionArea.classList.remove('hidden');
    });
}

function waitForBluffResponse(who, claim) {
    return new Promise(resolve => {
        _actionResolve = null;
        ui.actionLabel.textContent = `${state[who].name}: Opponent claims ${claim}. Call or fold?`;
        ui.drawRow.classList.add('hidden');
        ui.bluffRow.innerHTML = `
            <button id="btn-call" class="danger">⚡ Call</button>
            <button id="btn-fold-bluff" class="safe">Fold</button>`;
        document.getElementById('btn-call').onclick       = () => { resetBluffRow(); ui.drawRow.classList.remove('hidden'); resolve('call'); };
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

    ui.handArea.classList.add('hidden');
    ui.oppArea.classList.add('hidden');
    ui.actionArea.classList.add('hidden');
    document.getElementById('player-total')?.classList.add('hidden');
    document.getElementById('opp-total')?.classList.add('hidden');
    clearCards3D(playerCards3D);
    clearCards3D(oppCards3D);
    playerPrevCount = 0;
    oppPrevCount = 0;

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
            const claim = await waitForClaim();
            state[who].claim = claim;
            await showMessage(`${player.name} declares ${claim}.`, 1000);
            return { result: 'stand', who };

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
    const p1Done = r1.result;
    const p2Done = r2 ? r2.result : null;

    if (p1Done === 'fold') { state.p2.roundWins++; updateUI(); return; }
    if (p2Done === 'fold') { state.p1.roundWins++; updateUI(); return; }

    // Real totals (used if bluff is called)
    const t1 = handTotal(state.p1.hand), bust1 = isBust(state.p1.hand);
    const t2 = handTotal(state.p2.hand), bust2 = isBust(state.p2.hand);

    // Declared values: bluffed claim or real total
    const d1 = state.p1.claim ?? t1;
    const d2 = state.p2.claim ?? t2;

    // Determine declared winner/loser (treat claimed value as face-value, no bust on bluffed claims)
    const d1Bust = state.p1.claim ? false : bust1;
    const d2Bust = state.p2.claim ? false : bust2;

    playReveal();
    renderHand(state.p1.hand, true);
    renderOppHand(state.p2.hand, true, '');

    // Mask badges with declared values so bluffers don't leak their real total
    const p1Badge = document.getElementById('player-total');
    const p2Badge = document.getElementById('opp-total');
    if (state.p1.claim && p1Badge) { p1Badge.textContent = `${d1} (claimed)`; p1Badge.className = 'total-badge'; }
    if (state.p2.claim && p2Badge) { p2Badge.textContent = `${d2} (claimed)`; p2Badge.className = 'total-badge'; }

    await showMessage('Showdown.', 1200);

    let declaredWinner = null;
    if (d1Bust && d2Bust)     { /* both bust declared — fall through to real compare */ }
    else if (d1Bust)           declaredWinner = 'p2';
    else if (d2Bust)           declaredWinner = 'p1';
    else if (d1 > d2)          declaredWinner = 'p1';
    else if (d2 > d1)          declaredWinner = 'p2';
    // tie or both-declared-bust: skip challenge, go straight to real compare

    if (declaredWinner) {
        const declaredLoser = declaredWinner === 'p1' ? 'p2' : 'p1';
        const winnerDeclLabel = declaredWinner === 'p1' ? p1Label : p2Label;
        const choice = await waitForShowdownChallenge(declaredLoser, winnerDeclLabel);

        if (choice === 'accept') {
            // Loser accepts — winner takes round + bonus, no shock
            state[declaredWinner].roundWins++;
            updateUI();
            await showMessage(`${state[declaredLoser].name} accepts. ${state[declaredWinner].name} earns a bonus!`, 1800);
            await awardBonus(declaredWinner);
            return;
        }

        // Called bluff — reveal real totals in badges now
        renderHand(state.p1.hand, true);
        renderOppHand(state.p2.hand, true, '');
        await showMessage('Real hands revealed!', 1200);
        let realWinner = null;
        if (bust1 && bust2)  { /* draw */ }
        else if (bust1)       realWinner = 'p2';
        else if (bust2)       realWinner = 'p1';
        else if (t1 > t2)     realWinner = 'p1';
        else if (t2 > t1)     realWinner = 'p2';

        if (!realWinner) {
            await showMessage('Both hands tie on the reveal. Draw.', 2000);
            return;
        }

        if (realWinner === declaredWinner) {
            // Winner wasn't bluffing — wrong call, loser pays
            state[declaredWinner].roundWins++;
            updateUI();
            await showMessage(`${state[declaredWinner].name} wasn't bluffing! ${state[declaredLoser].name} pays!`, 2200);
            const useDouble = consumeDoubleShock(declaredWinner);
            await doShock(declaredLoser, useDouble);
            await awardBonus(declaredWinner);
        } else {
            // Winner was bluffing — right call, winner pays
            state[declaredLoser].roundWins++;
            updateUI();
            await showMessage(`${state[declaredWinner].name} was bluffing! ${state[declaredLoser].name} wins!`, 2200);
            const useDouble = consumeDoubleShock(declaredLoser);
            await doShock(declaredWinner, useDouble);
        }
        return;
    }

    // No declared winner (tie declared or both declared bust) — straight real compare
    if (bust1 && bust2) { await showMessage('Both bust. Draw.', 2000); return; }
    let winner = null;
    if (bust1) winner = 'p2';
    else if (bust2) winner = 'p1';
    else if (t1 > t2) winner = 'p1';
    else if (t2 > t1) winner = 'p2';
    else { await showMessage('Tie. Round is a draw.', 1800); return; }

    const loser = winner === 'p1' ? 'p2' : 'p1';
    state[winner].roundWins++;
    updateUI();
    if (isBlackjack(state[winner].hand)) {
        await showMessage(`${state[winner].name} hits BLACKJACK! Shock!`, 2000);
        const useDouble = consumeDoubleShock(winner);
        await doShock(loser, useDouble);
    } else {
        await showMessage(`${state[winner].name} wins the round!`, 1800);
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

    clearCards3D(playerCards3D);
    clearCards3D(oppCards3D);
    playerPrevCount = 0;
    oppPrevCount = 0;

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
        clearCards3D(playerCards3D);
        clearCards3D(oppCards3D);
        playerPrevCount = 0;
        oppPrevCount = 0;

        let r2 = null;
        const p1EarlyEnd = ['bluff-win','bluff-loss','fold'].includes(r1.result);
        if (!p1EarlyEnd) {
            r2 = await localPlayerTurn('p2');
            ui.handArea.classList.add('hidden');
            ui.oppArea.classList.add('hidden');
            clearCards3D(playerCards3D);
            clearCards3D(oppCards3D);
            playerPrevCount = 0;
            oppPrevCount = 0;
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
        online._resolvers.action(data.claim !== undefined ? data : data.value);
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
            break;
        case 'oppAction':
            const opp = data.action;
            if (opp === 'hit') ui.oppStatus.textContent = 'Opponent hits...';
            if (opp === 'stand') ui.oppStatus.textContent = 'Opponent stands.';
            break;
        case 'waitBluffCall':
            startGuestBluffCallUI(data.claim);
            break;
        case 'gameOver':
            applyNetState(data.s);
            showGameOver(data.winner);
            break;
    }
}

function startGuestTurnUI(hand) {
    state.p2.hand = hand;
    playerPrevCount = 0;
    renderHand(hand, true);
    ui.actionLabel.textContent = 'Your Turn';
    ui.drawRow.classList.remove('hidden');
    resetBluffRow();
    ui.actionArea.classList.remove('hidden');

    const send = (v, extra = {}) => { ui.actionArea.classList.add('hidden'); sendToHost({ type: 'action', value: v, ...extra }); };
    document.getElementById('btn-hit').onclick   = () => send('hit');
    document.getElementById('btn-stand').onclick = () => send('stand');
    document.getElementById('btn-fold').onclick  = () => send('fold');
    document.getElementById('btn-bluff').onclick = async () => {
        ui.actionArea.classList.add('hidden');
        const claim  = await waitForClaim();
        ui.actionArea.classList.add('hidden');
        sendToHost({ type: 'action', value: 'bluff', claim });
    };
}

function startGuestBluffCallUI(claim) {
    waitForBluffResponse('p2', claim).then(r => {
        ui.actionArea.classList.add('hidden');
        sendToHost({ type: 'action', value: r });
    });
}

// ── ONLINE HOST GAME LOOP ──
async function waitGuest() {
    return new Promise(r => { online._resolvers.action = r; });
}

async function onlineHostPlayerTurn() {
    playerPrevCount = 0;
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
            const claim = await waitForClaim();
            ui.actionArea.classList.add('hidden');
            sendToGuest({ type: 'waitBluffCall', claim });

            const response = await waitGuest();
            broadcastState();

            if (response === 'fold') {
                await showMessage(`${state.p2.name} folds. Round conceded.`, 1600);
                sendToGuest({ type: 'message', text: 'You folded. Round conceded.', duration: 1600 });
                return { result: 'bluff-win', who: 'p1' };
            } else {
                sendToGuest({ type: 'reveal', hostHand: state.p1.hand, guestHand: state.p2.hand });
                playReveal();
                renderOppHand(state.p2.hand, true, '');
                await showMessage('Cards on the table.', 1200);
                const pt = handTotal(state.p1.hand), gt = handTotal(state.p2.hand);
                const blufferWins = !isBust(state.p1.hand) && (isBust(state.p2.hand) || pt >= gt);
                if (blufferWins) {
                    await showMessage(`You had it. ${state.p2.name} pays!`, 2000);
                    const useDouble = consumeDoubleShock('p1');
                    broadcastState();
                    sendToGuest({ type: 'shock', who: 'p2', double: useDouble });
                    await doShock('p2', useDouble);
                    return { result: 'bluff-win', who: 'p1' };
                } else {
                    await showMessage(`Bluff called correctly. You pay!`, 2000);
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
        const raw    = await waitGuest();
        const action = typeof raw === 'object' ? raw.value : raw;
        const actionObj = typeof raw === 'object' ? raw : { value: raw };

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
            const guestClaim = actionObj.claim || 20;
            sendToGuest({ type: 'message', text: 'You bluffed! Waiting...', duration: 1000 });

            const response = await waitForBluffResponse('p1', guestClaim);
            ui.actionArea.classList.add('hidden');
            sendToGuest({ type: 'message', text: response === 'call' ? 'Called!' : 'Folded!', duration: 1000 });

            if (response === 'fold') {
                await showMessage(`You fold. Round conceded.`, 1600);
                sendToGuest({ type: 'message', text: `${state.p2.name} folds. Round conceded.`, duration: 1600 });
                return { result: 'bluff-win', who: 'p2' };
            } else {
                sendToGuest({ type: 'reveal', hostHand: state.p1.hand, guestHand: state.p2.hand });
                playReveal();
                renderOppHand(state.p2.hand, true, '');
                await showMessage('Cards on the table.', 1200);
                const pt = handTotal(state.p1.hand), gt = handTotal(state.p2.hand);
                const blufferWins = !isBust(state.p2.hand) && (isBust(state.p1.hand) || gt >= pt);
                if (blufferWins) {
                    await showMessage(`${state.p2.name} had it. You pay!`, 2000);
                    const useDouble = consumeDoubleShock('p2');
                    broadcastState();
                    sendToGuest({ type: 'shock', who: 'p1', double: useDouble });
                    await doShock('p1', useDouble);
                    return { result: 'bluff-win', who: 'p2' };
                } else {
                    await showMessage(`Bluff called correctly. ${state.p2.name} pays!`, 2000);
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
        clearCards3D(playerCards3D);
        clearCards3D(oppCards3D);
        playerPrevCount = 0;
        oppPrevCount = 0;

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

        document.getElementById('mode-story').onclick = () => {
            gameMode = 'story'; lobby.classList.add('hidden'); resolve('story');
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
async function runStoryMode() {
    const lines = [
        "You don't remember how you got here.",
        "The last thing you recall was a cold rain and a wrong turn down an alleyway.",
        "Now, you're strapped into this chair. Your hands are free, but your ankles are locked.",
        "A neon sign flickers across from you: 'VOLTAGE 21'.",
        "A man in the shadows speaks: 'Twenty-one to live, my friend. Anything else... is a shock to the system.'",
        "The machine hums with lethal intent. Let the game begin."
    ];

    ui.storyScreen.classList.remove('hidden');
    
    for (const line of lines) {
        ui.storyNext.classList.add('hidden');
        await typeWriter(line, ui.storyText, 35);
        ui.storyNext.classList.remove('hidden');
        
        await new Promise(resolve => {
            const handler = () => {
                ui.storyScreen.removeEventListener('click', handler);
                resolve();
            };
            ui.storyScreen.addEventListener('click', handler);
        });
    }

    ui.storyScreen.classList.add('hidden');
    resetState(); updateUI();
    await showMessage('VOLTAGE 21', 1600);
    await runLocalGame();
}

async function startGame() {
    injectBonusUI();
    const mode = await showLobby();

    if (mode === 'story') {
        await runStoryMode();
    } else if (mode === 'local') {
        resetState(); updateUI();
        await showMessage('VOLTAGE 21', 1600);
        await runLocalGame();
    } else if (mode === 'online-host') {
        await runOnlineHostGame();
    } else {
        resetState(); updateUI();
        oppPrevCount = 0;
        renderOppHand([], false, '');
        await showMessage('Connected. Waiting for host...', 1800);
    }
}

// ── ANIMATION LOOP ──
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    updateFlicker(dt);
    updateDevice(dt);
    updateShake(dt);

    // Update tween animations
    for (let i = tweens.length - 1; i >= 0; i--) {
        if (tweens[i].update(dt)) tweens.splice(i, 1);
    }

    // Update shock arc effects
    for (let i = shockArcs.length - 1; i >= 0; i--) {
        if (shockArcs[i].update(dt)) shockArcs.splice(i, 1);
    }

    // Update story events
    checkStoryEvents();

    renderer.render(scene, camera);
}
animate();

startGame();
