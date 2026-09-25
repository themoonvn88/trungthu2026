const container = document.getElementById("webgl-container");
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) || window.innerWidth < 768;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060312, 0.008);

const camera = new THREE.PerspectiveCamera(
  isMobile ? 60 : 45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const DEFAULT_CAM_POS = isMobile
  ? new THREE.Vector3(0, 12, 45)
  : new THREE.Vector3(0, 10, 40);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 6.0, 0);

camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.minDistance = 8;
controls.maxDistance = 85;
controls.target.copy(DEFAULT_CAM_TARGET);

// LIGHTS
// Ánh sáng từ Mặt Trăng chiếu xuống
const moonlight = new THREE.DirectionalLight(0xaaccff, 0.8);
moonlight.position.set(-30, 25, -60); // Đặt cùng vị trí với Mặt Trăng
moonlight.target.position.set(0, 0, 0); // Chiếu thẳng vào giữa đảo
scene.add(moonlight);
scene.add(moonlight.target);

const ambientLight = new THREE.AmbientLight(0x2a103d, 1.4);
scene.add(ambientLight);

const treeLight = new THREE.PointLight(0xffb6c1, 2.5, 45);
treeLight.position.set(0, 8, 0);
scene.add(treeLight);

const warmLight = new THREE.PointLight(0xffaa33, 2.0, 30);
warmLight.position.set(0, -2, 0);
scene.add(warmLight);

// --- MẶT NƯỚC BÊN DƯỚI ĐẢO ---
const waterGeo = new THREE.PlaneGeometry(300, 300);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x020512, // Xanh đen sâu thẳm
  roughness: 0.1,  // Độ nhám thấp để phản chiếu tốt
  metalness: 0.8,  // Độ kim loại cao để tạo độ bóng của nước
  transparent: true,
  opacity: 0.85
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.rotation.x = -Math.PI / 2; // Nằm ngang
water.position.y = -6; // Đặt thấp bên dưới hòn đảo và lồng đèn
scene.add(water);

// ISLAND
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const islandGeo = new THREE.CylinderGeometry(
  8.5,
  2.2,
  7.5,
  isMobile ? 32 : 48,
  12,
);
const posAttr = islandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const vx = posAttr.getX(i);
  const vy = posAttr.getY(i);
  const vz = posAttr.getZ(i);

  const distFromCenter = Math.sqrt(vx * vx + vz * vz);
  const noise =
    Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.6 +
    Math.sin(vx * 1.8 + vz * 1.5) * 0.3;

  if (vy > 0) {
    posAttr.setY(i, vy + noise * (1.0 - distFromCenter / 12));
  } else {
    posAttr.setX(i, vx + (Math.random() - 0.5) * 1.4);
    posAttr.setZ(i, vz + (Math.random() - 0.5) * 1.4);
  }
}
islandGeo.computeVertexNormals();

const islandMat = new THREE.MeshStandardMaterial({
  color: 0x3d231b,
  roughness: 0.85,
  flatShading: true,
});
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandGroup.add(islandMesh);

const topGeo = new THREE.CylinderGeometry(8.6, 7.8, 0.8, isMobile ? 32 : 48, 4);
const topPos = topGeo.attributes.position;
for (let i = 0; i < topPos.count; i++) {
  const vx = topPos.getX(i);
  const vy = topPos.getY(i);
  const vz = topPos.getZ(i);
  const noise = Math.sin(vx * 0.9) * Math.cos(vz * 0.9) * 0.5;
  topPos.setY(i, vy + noise * 0.4);
}
topGeo.computeVertexNormals();
const topMat = new THREE.MeshStandardMaterial({
  color: 0x22130e,
  roughness: 0.9,
  flatShading: true,
});
const topMesh = new THREE.Mesh(topGeo, topMat);
topMesh.position.y = 3.6;
islandGroup.add(topMesh);

// BỆ MẶT ĐÁ NHỎ & ĐÁ TẢNG RẢI RÁC ÍT HƠN
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x4a4d52,
  roughness: 0.85,
  metalness: 0.1,
  flatShading: true,
});

// 1. Bệ đá nhỏ dẹt ẩn nhẹ dưới gốc cây
const mainStonePlatformGeo = new THREE.CylinderGeometry(2.5, 3.0, 0.15, 6);
const mainStonePlatform = new THREE.Mesh(mainStonePlatformGeo, stoneMat);
mainStonePlatform.position.set(0, 3.9, 0);
islandGroup.add(mainStonePlatform);

// 2. Chỉ 3 viên đá nhỏ điểm xuyết trên mặt đất
const rockCount = 3;
for (let i = 0; i < rockCount; i++) {
  const rockGeo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25, 0);
  const rockMesh = new THREE.Mesh(rockGeo, stoneMat);

  const angle = (i / rockCount) * Math.PI * 2 + 0.5;
  const dist = 3.8 + Math.random() * 2.0;

  rockMesh.position.set(Math.cos(angle) * dist, 3.9, Math.sin(angle) * dist);
  rockMesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  islandGroup.add(rockMesh);
}

// TREE TRUNK & BRANCHES (CÂY ĐA CỔ THỤ)
const treeGroup = new THREE.Group();
treeGroup.position.set(0, 4.0, 0);
islandGroup.add(treeGroup);

const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x2b1b11, // Nâu sẫm cổ thụ
  roughness: 0.9,
});

// Thân chính cong và to
const trunkCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.3, 3.5, -0.2),
  new THREE.Vector3(-0.3, 6.5, 0.3),
  new THREE.Vector3(0.0, 9.5, 0.0),
]);

// Thân to hơn gốc, vươn cao
const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 0.7, 10, false); 
const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
treeGroup.add(trunkMesh);

// Rễ đa bám quanh gốc cây
for(let i = 0; i < 6; i++) {
    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.random() * 1.2 - 0.6, 0, Math.random() * 1.2 - 0.6),
      new THREE.Vector3(Math.random() * 0.6 - 0.3, 2.5, Math.random() * 0.6 - 0.3),
      new THREE.Vector3(0, 5.0 + Math.random() * 3, 0),
    ]);
    const rootGeo = new THREE.TubeGeometry(rootCurve, 16, 0.15 + Math.random() * 0.1, 6, false);
    const rootMesh = new THREE.Mesh(rootGeo, trunkMat);
    treeGroup.add(rootMesh);
}

const branchClusters = [];
const mainBranchCount = 16; // Nhiều cành để tán rộng
for (let i = 0; i < mainBranchCount; i++) {
  const angle = (i / mainBranchCount) * Math.PI * 2 + Math.random() * 0.5;
  const h = 4.0 + Math.random() * 5.0;
  const startP = trunkCurve.getPointAt(h / 9.5);
  const len = 4.5 + Math.random() * 3.5; // Cành vươn xa

  const endP = new THREE.Vector3(
    startP.x + Math.cos(angle) * len,
    startP.y + 1.2 + Math.random() * 1.5,
    startP.z + Math.sin(angle) * len,
  );

  const midP = new THREE.Vector3().addVectors(startP, endP).multiplyScalar(0.5);
  midP.y += 0.4;

  const bCurve = new THREE.CatmullRomCurve3([startP, midP, endP]);
  const bGeo = new THREE.TubeGeometry(bCurve, 12, 0.15, 6, false);
  const bMesh = new THREE.Mesh(bGeo, trunkMat);
  treeGroup.add(bMesh);

  // Rễ buông thả từ trên cành xuống (Đặc trưng cây đa)
  if (Math.random() > 0.4) {
      const hangRootLength = endP.y - (Math.random() * 2);
      const hangRootGeo = new THREE.CylinderGeometry(0.02, 0.04, hangRootLength, 5);
      const hangRoot = new THREE.Mesh(hangRootGeo, trunkMat);
      hangRoot.position.set(endP.x, endP.y - hangRootLength / 2, endP.z);
      // Cho rễ đung đưa xéo một chút
      hangRoot.rotation.z = (Math.random() - 0.5) * 0.2; 
      hangRoot.rotation.x = (Math.random() - 0.5) * 0.2;
      treeGroup.add(hangRoot);
  }

  branchClusters.push({ center: endP, radius: 4.5 + Math.random() * 2.0 });
}

// HỆ THỐNG TÁN LÁ (XANH LỤC)
const particleCount = isMobile ? 30000 : 50000; // Tăng số lượng để tán xum xuê
const blossomGeo = new THREE.BufferGeometry();
const blossomPos = new Float32Array(particleCount * 3);
const blossomColors = new Float32Array(particleCount * 3);

// Các sắc độ xanh của lá đa
const colorDarkGreen = new THREE.Color(0x133816);
const colorLeafGreen = new THREE.Color(0x275924);
const colorLightGreen = new THREE.Color(0x427533);
const colorYellowGreen = new THREE.Color(0x618536);

const clusters = [
  { center: new THREE.Vector3(0, 11.0, 0), radius: 8.0 },
  { center: new THREE.Vector3(0, 8.5, 0), radius: 9.0 },
  { center: new THREE.Vector3(0, 6.0, 0), radius: 7.5 },
  ...branchClusters,
];

for (let i = 0; i < particleCount; i++) {
  const c = clusters[Math.floor(Math.random() * clusters.length)];

  const u = Math.random();
  const r = Math.pow(u, 0.55) * c.radius; // Tán tròn đều
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = c.center.x + r * Math.sin(phi) * Math.cos(theta);
  const y = c.center.y + r * Math.sin(phi) * Math.sin(theta) * 0.65; // Hơi dẹt ngang
  const z = c.center.z + r * Math.cos(phi);

  blossomPos[i * 3] = x;
  blossomPos[i * 3 + 1] = y;
  blossomPos[i * 3 + 2] = z;

  // Pha trộn ngẫu nhiên các màu xanh
  const randC = Math.random();
  let col;
  if (randC < 0.25) col = colorDarkGreen;
  else if (randC < 0.65) col = colorLeafGreen;
  else if (randC < 0.9) col = colorLightGreen;
  else col = colorYellowGreen;

  blossomColors[i * 3] = col.r;
  blossomColors[i * 3 + 1] = col.g;
  blossomColors[i * 3 + 2] = col.b;
}

blossomGeo.setAttribute("position", new THREE.BufferAttribute(blossomPos, 3));
blossomGeo.setAttribute("color", new THREE.BufferAttribute(blossomColors, 3));

// Giữ lại texture này vì các lồng đèn phía dưới cũng cần dùng
function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(200,200,200,0.6)");
  grad.addColorStop(1, "rgba(200,200,200,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const blossomMat = new THREE.PointsMaterial({
  size: isMobile ? 0.6 : 0.5,
  vertexColors: true,
  map: createParticleTexture(),
  transparent: true,
  opacity: 0.9,
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const blossomParticles = new THREE.Points(blossomGeo, blossomMat);
treeGroup.add(blossomParticles);

// --- BẮT ĐẦU PHẦN NHÂN VẬT (THỎ, CHỊ HẰNG, CHÚ CUỘI) ---

// 1. TẠO HÌNH CON THỎ
function createRabbit() {
  const group = new THREE.Group();
  const rabbitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  
  // Thân
  const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
  bodyGeo.scale(1, 0.85, 1.2);
  const body = new THREE.Mesh(bodyGeo, rabbitMat);
  body.position.y = 0.3;
  group.add(body);

  // Đầu
  const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const head = new THREE.Mesh(headGeo, rabbitMat);
  head.position.set(0, 0.6, 0.35);
  group.add(head);

  // Tai
  const earGeo = new THREE.SphereGeometry(0.08, 16, 16);
  earGeo.scale(1, 3.5, 0.5);
  const earL = new THREE.Mesh(earGeo, rabbitMat);
  earL.position.set(-0.12, 0.9, 0.25);
  earL.rotation.set(-0.2, 0, 0.2);
  group.add(earL);

  const earR = new THREE.Mesh(earGeo, rabbitMat);
  earR.position.set(0.12, 0.9, 0.25);
  earR.rotation.set(-0.2, 0, -0.2);
  group.add(earR);

  // Đuôi
  const tailGeo = new THREE.SphereGeometry(0.1, 16, 16);
  const tail = new THREE.Mesh(tailGeo, rabbitMat);
  tail.position.set(0, 0.3, -0.4);
  group.add(tail);

  return group;
}

// 2. TẠO HÌNH CHỊ HẰNG
function createChiHang() {
  const group = new THREE.Group();
  
  // Váy (Hình nón)
  const dressGeo = new THREE.ConeGeometry(0.6, 1.8, 32);
  const dressMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 });
  const dress = new THREE.Mesh(dressGeo, dressMat);
  dress.position.y = 0.9;
  group.add(dress);

  // Đầu
  const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.95;
  group.add(head);

  // Tóc búi
  const hairGeo = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 1.98;
  group.add(hair);

  const bunGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const bun = new THREE.Mesh(bunGeo, hairMat);
  bun.position.set(0, 2.3, -0.15);
  group.add(bun);

  group.scale.setScalar(1.2);
  return group;
}

// 3. TẠO HÌNH CHÚ CUỘI (Ngồi thổi sáo)
function createChuCuoi() {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcda3, roughness: 0.4 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  
  // Thân (Áo nâu)
  const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16);
  const body = new THREE.Mesh(bodyGeo, shirtMat);
  body.position.y = 0.35;
  group.add(body);

  // Đầu
  const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.85;
  group.add(head);

  // Tóc
  const hairGeo = new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 0.87;
  group.add(hair);

  // Chân (gập lại vì đang ngồi)
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16);
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.9 });
  
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.rotation.x = Math.PI / 2;
  legL.position.set(-0.15, 0.1, 0.2);
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.rotation.x = Math.PI / 2;
  legR.position.set(0.15, 0.1, 0.2);
  group.add(legR);

  // Cây sáo trúc
  const fluteGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
  const fluteMat = new THREE.MeshStandardMaterial({ color: 0xe3c16f });
  const flute = new THREE.Mesh(fluteGeo, fluteMat);
  flute.position.set(0.15, 0.7, 0.2);
  flute.rotation.z = -Math.PI / 4;
  flute.rotation.x = Math.PI / 4;
  group.add(flute);

  group.scale.setScalar(1.2);
  return group;
}

// THÊM CHỊ HẰNG VÀ CHÚ CUỘI VÀO ĐẢO
const chiHang = createChiHang();
chiHang.position.set(-2.5, 4.0, 1.5);
chiHang.rotation.y = Math.PI / 3;
islandGroup.add(chiHang);

const chuCuoi = createChuCuoi();
chuCuoi.position.set(1.5, 4.0, 1.8); // Ngồi gần gốc cây
chuCuoi.rotation.y = -Math.PI / 4;
islandGroup.add(chuCuoi);
// --- ĐỐNG LỬA TRẠI BÊN CẠNH CHÚ CUỘI ---
const campfireGroup = new THREE.Group();
campfireGroup.position.set(1.5, 4.0, 2.6); // Đặt gần chỗ Cuội ngồi
islandGroup.add(campfireGroup);

// Khúc củi
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 1.0 });
for(let i = 0; i < 3; i++) {
  const woodGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
  const wood = new THREE.Mesh(woodGeo, woodMat);
  wood.rotation.z = Math.PI / 2.5;
  wood.rotation.y = (i * Math.PI * 2) / 3;
  wood.position.y = 0.05;
  campfireGroup.add(wood);
}

// Ngọn lửa phát sáng
const fireMat = new THREE.SpriteMaterial({
  map: createParticleTexture(), // Tận dụng lại texture đốm sáng
  color: 0xff5500,
  blending: THREE.AdditiveBlending,
  transparent: true
});
const fireSprite = new THREE.Sprite(fireMat);
fireSprite.scale.set(1.2, 1.5, 1);
fireSprite.position.y = 0.3;
campfireGroup.add(fireSprite);

// Đèn hắt sáng từ lửa
const fireLight = new THREE.PointLight(0xff6600, 2.5, 6);
fireLight.position.y = 0.5;
campfireGroup.add(fireLight);

// --- ĐÀN ĐOM ĐÓM BAY QUANH CÂY ĐA ---
const fireflyCount = 40;
const fireflyGeo = new THREE.BufferGeometry();
const fireflyPos = new Float32Array(fireflyCount * 3);
const fireflyData = [];

for (let i = 0; i < fireflyCount; i++) {
  fireflyPos[i * 3] = (Math.random() - 0.5) * 15;
  fireflyPos[i * 3 + 1] = 4 + Math.random() * 8; // Bay cao từ gốc lên cành
  fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 15;

  fireflyData.push({
    speedX: (Math.random() - 0.5) * 0.02,
    speedY: (Math.random() - 0.5) * 0.01,
    speedZ: (Math.random() - 0.5) * 0.02,
    baseY: fireflyPos[i * 3 + 1],
    phase: Math.random() * Math.PI * 2
  });
}
fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));

const fireflyMat = new THREE.PointsMaterial({
  size: 0.25,
  color: 0xccff00, // Xanh lá mạ pha vàng phát sáng
  transparent: true,
  opacity: 0.8,
  map: createParticleTexture(),
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
islandGroup.add(fireflies);


// THÊM ĐÀN THỎ NGỌC NHẢY QUANH ĐẢO (12 bé)
const rabbits = [];
const rabbitCount = 12; // Bạn có thể tăng số này lên 20, 30 tùy thích!

for (let i = 0; i < rabbitCount; i++) {
  const rabbitMesh = createRabbit();
  islandGroup.add(rabbitMesh);

  rabbits.push({
    mesh: rabbitMesh,
    // Cho thỏ chạy ở nhiều vòng tròn rộng hẹp khác nhau (từ gần gốc tới sát mép đảo)
    orbitRadius: 2.0 + Math.random() * 5.5, 
    orbitSpeed: (0.1 + Math.random() * 0.15) * (i % 2 === 0 ? 1 : -1), // Chạy xuôi và ngược chiều
    phase: Math.random() * Math.PI * 2,
    baseY: 4.05,
    hopSpeed: 4.0 + Math.random() * 3.5, // Nhảy nhanh chậm khác nhau
    hopHeight: 0.15 + Math.random() * 0.2, // Nhảy cao thấp khác nhau
    scale: 0.45 + Math.random() * 0.35, // Bé to bé nhỏ
  });
  
  rabbits[i].mesh.scale.setScalar(rabbits[i].scale);
}

// HÀM CHUYỂN ĐỘNG CHO NHÂN VẬT
function updateCharacters(time) {
  // Thỏ nhảy múa
  rabbits.forEach((r) => {
    const angle = r.phase + time * r.orbitSpeed;
    const sign = Math.sign(r.orbitSpeed) || 1;
    const x = Math.cos(angle) * r.orbitRadius;
    const z = Math.sin(angle) * r.orbitRadius;
    const hop = Math.abs(Math.sin(time * r.hopSpeed)) * r.hopHeight;
    r.mesh.position.set(x, r.baseY + hop, z);
    const dx = -Math.sin(angle) * sign;
    const dz = Math.cos(angle) * sign;
    r.mesh.rotation.y = Math.atan2(dx, dz);
  });

  // Chị Hằng lơ lửng và dải lụa xoay chầm chậm
  chiHang.position.y = 4.0 + Math.sin(time * 1.5) * 0.1;

  // Cuội đung đưa người theo nhịp sáo
  chuCuoi.rotation.z = Math.sin(time * 2.5) * 0.05;

  // Lửa bập bùng (kích thước ngọn lửa thay đổi liên tục)
  fireSprite.scale.setScalar(1.2 + Math.random() * 0.4);
  fireLight.intensity = 2.0 + Math.random() * 1.0;

  // Đom đóm bay lượn
  const ffPos = fireflyGeo.attributes.position.array;
  for (let i = 0; i < fireflyCount; i++) {
    const data = fireflyData[i];
    ffPos[i * 3] += data.speedX;
    ffPos[i * 3 + 1] = data.baseY + Math.sin(time * 2 + data.phase) * 0.5;
    ffPos[i * 3 + 2] += data.speedZ;
    
    // Giới hạn vùng bay của đom đóm
    if(Math.abs(ffPos[i * 3]) > 8) data.speedX *= -1;
    if(Math.abs(ffPos[i * 3 + 2]) > 8) data.speedZ *= -1;
  }
  fireflyGeo.attributes.position.needsUpdate = true;
  fireflyMat.opacity = 0.4 + Math.sin(time * 3.0) * 0.4;
}
// --- KẾT THÚC PHẦN NHÂN VẬT ---

// LANTERNS & MESSAGES WITH IMAGES
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);

const lanterns = [];
const interactiveObjects = [];

const wishList = [
  {
    text: "Chúc em và gia đình một mùa Trung Thu đoàn viên, tràn ngập niềm vui và hạnh phúc!",
    img: "./assets/1.jpg",
  },
  {
    text: "Cầu chúc cho mọi nguyện ước của em đêm nay sẽ trở thành hiện thực.",
    img: "./assets/2.jpg",
  },
  {
    text: "Trăng tròn ấm áp, chúc em mãi luôn hạnh phúc.",
    img: "./assets/3.jpg",
  },
  {
    text: "Chúc em luôn giữ được tâm hồn trong trẻo, yêu đời như ánh trăng rằm.",
    img: "./assets/4.jpg",
  },
  {
    text: "Trung Thu bình an, vạn sự như ý, công danh thăng tiến rực rỡ!",
    img: "./assets/5.jpg",
  },
  {
    text: "Chúc riêng em một đêm trăng thật lãng mạn và ngọt ngào.",
    img: "./assets/6.jpg",
  },
  {
    text: "Sức khỏe dồi dào, tâm an yên, miệng luôn mỉm cười rạng rỡ.",
    img: "./assets/7.jpg",
  },
  {
    text: "Chúc em luôn giữ được ánh mắt trong veo, nụ cười rạng rỡ và bay thật cao với những ước mơ nhỏ bé của mình.",
    img: "./assets/8.jpg",
  },
  {
    text: "Gửi tặng em một ngàn cái ôm ấm áp nhân ngày Tết Thiếu nhi. Cứ vô tư hồn nhiên đi, thế giới phức tạp ngoài kia kệ nó!",
    img: "./assets/9.jpg",
  },
  {
    text: "Chúc em ngày lễ thật vui, ngập tràn kẹo ngọt và những điều lãng mạng.",
    img: "./assets/10.jpg",
  },
  {
    text: "Chúc em mãi giữ được tâm hồn trẻ trung, vô tư để ngày nào cũng cười thật tươi.",
    img: "./assets/1.jpg",
  },
];

function createLanternTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#ff4d4d");
  grad.addColorStop(0.5, "#e63946");
  grad.addColorStop(1, "#ffb703");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  return new THREE.CanvasTexture(canvas);
}

const lanternTex = createLanternTexture();

function createLanternMesh() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.6, 0.45, 1.4, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: lanternTex,
    emissive: 0xff7700,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const capGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.1, 6);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.5,
  });
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.y = 0.7;
  group.add(capTop);

  const tagGeo = new THREE.PlaneGeometry(0.35, 0.7);
  const tagMat = new THREE.MeshBasicMaterial({
    color: 0xd90429,
    side: THREE.DoubleSide,
  });
  const tag = new THREE.Mesh(tagGeo, tagMat);
  tag.position.set(0, -1.1, 0);
  group.add(tag);

  const spriteMat = new THREE.SpriteMaterial({
    map: createParticleTexture(),
    color: 0xffaa00,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(spriteMat);
  glow.scale.set(3.2, 3.2, 1);
  group.add(glow);

  const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  group.add(hitMesh);

  return { group, hitMesh };
}

const lanternCount = isMobile ? 24 : 38;
for (let i = 0; i < lanternCount; i++) {
  const { group: lantern, hitMesh } = createLanternMesh();

  const radius = 9 + Math.random() * 25;
  const angle = Math.random() * Math.PI * 2;
  const y = -1 + Math.random() * 30;

  lantern.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

  const wishData = wishList[Math.floor(Math.random() * wishList.length)];

  lantern.userData = {
    speedY: 0.008 + Math.random() * 0.012,
    swingSpeed: 0.8 + Math.random() * 1.2,
    initialX: lantern.position.x,
    initialZ: lantern.position.z,
    wish: wishData.text,
    imgUrl: wishData.img,
    id: i,
  };

  const sc = 0.75 + Math.random() * 0.5;
  lantern.scale.set(sc, sc, sc);

  hitMesh.userData.parentLantern = lantern;

  lanternsGroup.add(lantern);
  lanterns.push(lantern);
  interactiveObjects.push(hitMesh);
}

// --- MẶT TRĂNG RẰM CHÂN THẬT ---
// Tự động vẽ bề mặt trăng có vết lõm (craters)
function createMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Màu nền của trăng (vàng nhạt)
  ctx.fillStyle = "#fff4d4";
  ctx.fillRect(0, 0, 512, 512);

  // Tạo các mảng tối ngẫu nhiên mô phỏng bề mặt lồi lõm của mặt trăng
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 10 + Math.random() * 40;
    const opacity = 0.02 + Math.random() * 0.08;

    ctx.fillStyle = `rgba(180, 160, 140, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

const moonGroup = new THREE.Group();
scene.add(moonGroup);

// Quả cầu mặt trăng chân thật (Tăng độ chi tiết lưới lên 64)
const moonGeo = new THREE.SphereGeometry(15, 64, 64);
const moonMat = new THREE.MeshBasicMaterial({ 
  map: createMoonTexture(),
  color: 0xffffff 
}); 
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
// Xoay nhẹ mặt trăng để lộ góc bề mặt đẹp nhất
moonMesh.rotation.set(Math.PI / 8, Math.PI / 4, 0);
moonGroup.add(moonMesh);

// Hào quang phát sáng tỏa ra xung quanh mặt trăng
const moonGlowMat = new THREE.SpriteMaterial({
  map: createParticleTexture(), 
  color: 0xfff0b3,
  transparent: true,
  opacity: 0.6, // Giảm độ chói để nhìn rõ vân mặt trăng bên trong
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const moonGlow = new THREE.Sprite(moonGlowMat);
moonGlow.scale.set(65, 65, 1);
moonGroup.add(moonGlow);

// Đặt mặt trăng lơ lửng ở tít phía xa
moonGroup.position.set(-30, 25, -60);


// FALLING PETALS & STARS
const fallingPetalsCount = isMobile ? 80 : 180;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];

for (let i = 0; i < fallingPetalsCount; i++) {
  petalsPos[i * 3] = (Math.random() - 0.5) * 36;
  petalsPos[i * 3 + 1] = Math.random() * 36;
  petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 36;

  petalsData.push({
    speedY: 0.02 + Math.random() * 0.03,
  });
}

petalsGeo.setAttribute("position", new THREE.BufferAttribute(petalsPos, 3));
const petalsMat = new THREE.PointsMaterial({
  size: isMobile ? 0.35 : 0.3,
  color: 0xa9bc6c,
  transparent: true,
  opacity: 0.75,
  map: createParticleTexture(),
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const petalsParticles = new THREE.Points(petalsGeo, petalsMat);
scene.add(petalsParticles);

const starCount = isMobile ? 400 : 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 180;
  starPos[i * 3 + 1] = Math.random() * 90;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.4,
  transparent: true,
  opacity: 0.7,
});
scene.add(new THREE.Points(starGeo, starMat));

// FIREWORKS
let fireworks = [];
function createFirework(pos) {
  const pCount = 50;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);
  const velocities = [];

  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = pos.x;
    pPositions[i * 3 + 1] = pos.y;
    pPositions[i * 3 + 2] = pos.z;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.08 + Math.random() * 0.12;

    velocities.push(
      new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi),
      ),
    );
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.35,
    color: 0xffd700,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const pMesh = new THREE.Points(pGeo, pMat);
  scene.add(pMesh);

  fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.0 });
}

// RAYCASTER & INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null;
let targetCamTarget = null;
let selectedLantern = null;

const wishModal = document.getElementById("wishModal");
const wishText = document.getElementById("wishText");
const wishImage = document.getElementById("wishImage");
const closeWishBtn = document.getElementById("closeWishBtn");

let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(event) {
  pointerDownPos.x =
    event.clientX || (event.touches && event.touches[0].clientX) || 0;
  pointerDownPos.y =
    event.clientY || (event.touches && event.touches[0].clientY) || 0;
}

function onPointerUp(event) {
  if (event.target.closest(".top-bar") || event.target.closest(".wish-modal"))
    return;

  const clientX =
    event.clientX ||
    (event.changedTouches && event.changedTouches[0].clientX) ||
    0;
  const clientY =
    event.clientY ||
    (event.changedTouches && event.changedTouches[0].clientY) ||
    0;

  const distMoved = Math.hypot(
    clientX - pointerDownPos.x,
    clientY - pointerDownPos.y,
  );
  if (distMoved > 8) return;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, false);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    selectedLantern = hitMesh.userData.parentLantern || hitMesh.parent;
    const lPos = selectedLantern.position;

    createFirework(lPos);

    const offset = new THREE.Vector3()
      .subVectors(camera.position, lPos)
      .normalize()
      .multiplyScalar(5.5);
    targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
    targetCamTarget = lPos.clone();

    wishText.textContent = `"${selectedLantern.userData.wish}"`;
    wishImage.src = selectedLantern.userData.imgUrl;

    setTimeout(() => {
      wishModal.classList.add("active");
    }, 300);
  }
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

function resetCamera() {
  targetCamPos = DEFAULT_CAM_POS.clone();
  targetCamTarget = DEFAULT_CAM_TARGET.clone();
  selectedLantern = null;
}

function closeWishCard(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  wishModal.classList.remove("active");
  resetCamera();
}

closeWishBtn.addEventListener("click", closeWishCard);
closeWishBtn.addEventListener("touchend", closeWishCard);

wishModal.addEventListener("click", (e) => {
  if (e.target === wishModal) closeWishCard(e);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWishCard();
});

// AUDIO (Tự động phát nhạc trên cả Máy tính và Điện thoại)
const bgm = document.getElementById("bgm");
const audioBtn = document.getElementById("audio-btn");
let isPlaying = false;

function playAudio() {
  if (!isPlaying) {
    bgm.play().then(() => {
      isPlaying = true;
      audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      // Gỡ bỏ các sự kiện chờ sau khi nhạc đã phát thành công
      window.removeEventListener("pointerdown", playAudio);
      window.removeEventListener("touchstart", playAudio);
      window.removeEventListener("click", playAudio);
    }).catch(() => {});
  }
}

// 1. Thử tự phát ngay khi vừa tải trang (dành cho trình duyệt máy tính cho phép)
playAudio();

// 2. Phát ngay lập tức khi ngón tay vừa chạm vào màn hình điện thoại (kể cả chạm để xoay 3D)
window.addEventListener("pointerdown", playAudio, { passive: true });
window.addEventListener("touchstart", playAudio, { passive: true });
window.addEventListener("click", playAudio, { passive: true });

// 3. Nút bật/tắt nhạc thủ công ở góc trên
audioBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // Ngăn sự kiện chạm lan ra màn hình làm bật lại nhạc
  if (isPlaying) {
    bgm.pause();
    audioBtn.innerHTML = '<i class="fas fa-music" style="opacity:0.5;"></i>';
    isPlaying = false;
  } else {
    bgm.play().then(() => {
      audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      isPlaying = true;
    }).catch(() => {});
  }
});

// ANIMATION
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  lanterns.forEach((lantern) => {
    lantern.position.y += lantern.userData.speedY;
    lantern.position.x =
      lantern.userData.initialX +
      Math.sin(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.position.z =
      lantern.userData.initialZ +
      Math.cos(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.rotation.y += 0.005;

    if (lantern.position.y > 30) {
      lantern.position.y = -3;
    }
  });

  const pPos = petalsGeo.attributes.position.array;
  for (let i = 0; i < fallingPetalsCount; i++) {
    pPos[i * 3 + 1] -= petalsData[i].speedY;
    pPos[i * 3] += Math.sin(time + i) * 0.01;
    pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;

    if (pPos[i * 3 + 1] < -3) {
      pPos[i * 3 + 1] = 30;
      pPos[i * 3] = (Math.random() - 0.5) * 36;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
  }
  petalsGeo.attributes.position.needsUpdate = true;

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.life -= delta * 1.2;
    const posArr = fw.mesh.geometry.attributes.position.array;

    for (let j = 0; j < fw.velocities.length; j++) {
      posArr[j * 3] += fw.velocities[j].x;
      posArr[j * 3 + 1] += fw.velocities[j].y;
      posArr[j * 3 + 2] += fw.velocities[j].z;
    }
    fw.mesh.geometry.attributes.position.needsUpdate = true;
    fw.mesh.material.opacity = fw.life;

    if (fw.life <= 0) {
      scene.remove(fw.mesh);
      fireworks.splice(i, 1);
    }
  }

  islandGroup.rotation.y = Math.sin(time * 0.15) * 0.05;

  // --- CODE MỚI: HIỆU ỨNG THỞ & ĐUNG ĐƯA ---
  // 1. Cây đa đung đưa nhẹ trong gió
  treeGroup.scale.y = 1.0 + Math.sin(time * 1.2) * 0.015; // Tán lá nhấp nhô
  treeGroup.rotation.z = Math.sin(time * 0.8) * 0.01; // Cả cây nghiêng nhẹ

  // 2. Lồng đèn đung đưa đồng bộ nhẹ nhàng thêm
  lanternsGroup.position.y = Math.sin(time) * 0.2;

  // 3. (Nếu bạn đã thêm mặt nước) Mặt nước dập dềnh nhẹ
  if (typeof water !== 'undefined') {
    water.position.y = -6 + Math.sin(time * 0.5) * 0.2;
  }
  // ------------------------------------------

  updateCharacters(time);

  updateCharacters(time);

  if (targetCamPos && targetCamTarget) {
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamTarget, 0.04);

    if (camera.position.distanceTo(targetCamPos) < 0.1) {
      targetCamPos = null;
      targetCamTarget = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.fov = width < 768 ? 60 : 45;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2),
  );
});
