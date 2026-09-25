import * as THREE from './node_modules/three/build/three.module.js';

const page = document.body;
const hero = page.querySelector('.hero-home, .about-intro, .page-hero-projects, .page-hero-contact');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');

const pageConfigs = {
  'home-page': {
    particleCount: 52,
    lineCount: 16,
    objectCount: 4,
    particleColor: 0xbf557c,
    glowColor: 0xec91ae,
    lineColor: 0xa75977,
    objectColors: [0xa891cf, 0x79b8ca, 0xe58e9a, 0xe4ad82],
  },
  'about-page': {
    particleCount: 20,
    lineCount: 5,
    objectCount: 3,
    particleColor: 0xb35f83,
    glowColor: 0xe99ab9,
    lineColor: 0x9e6682,
    objectColors: [0xa690cc, 0x79b4c2, 0xe3a095],
  },
  'projects-page': {
    particleCount: 38,
    lineCount: 18,
    objectCount: 3,
    particleColor: 0xa95280,
    glowColor: 0xe395bd,
    lineColor: 0x925f91,
    objectColors: [0xa38bcb, 0x74b4c4, 0xe3949e],
  },
  'contact-page': {
    particleCount: 14,
    lineCount: 3,
    objectCount: 2,
    particleColor: 0xb15a80,
    glowColor: 0xe89ab3,
    lineColor: 0x9d6680,
    objectColors: [0xa891ca, 0xe19a91],
  },
};

const config = Object.entries(pageConfigs).find(([className]) => page.classList.contains(className))?.[1];

const hasWebGLSupport = () => {
  const testCanvas = document.createElement('canvas');
  return Boolean(
    testCanvas.getContext('webgl2') ||
    testCanvas.getContext('webgl') ||
    testCanvas.getContext('experimental-webgl'),
  );
};

const startBackground = () => {
  if (!hero || !config || reduceMotion.matches || !hasWebGLSupport()) return () => {};

  const canvas = document.createElement('canvas');
  canvas.className = 'three-background';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      canvas,
      powerPreference: 'low-power',
    });
  } catch {
    return () => {};
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.z = 8;

  const group = new THREE.Group();
  scene.add(group);

  const particleCount = window.innerWidth <= 760
    ? Math.max(8, Math.round(config.particleCount * 0.5))
    : config.particleCount;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    particlePositions[offset] = THREE.MathUtils.randFloatSpread(8.5);
    particlePositions[offset + 1] = THREE.MathUtils.randFloatSpread(4.6);
    particlePositions[offset + 2] = THREE.MathUtils.randFloat(-1.5, 1);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: config.particleColor,
    size: 0.09,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  const particleGlowMaterial = new THREE.PointsMaterial({
    color: config.glowColor,
    size: 0.22,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particleGlow = new THREE.Points(particleGeometry, particleGlowMaterial);
  group.add(particleGlow);

  const lineCount = window.innerWidth <= 760
    ? Math.max(2, Math.round(config.lineCount * 0.45))
    : config.lineCount;
  const linePositions = new Float32Array(lineCount * 6);
  for (let index = 0; index < lineCount; index += 1) {
    const first = (index * 3) % particleCount;
    const second = (first + (index % 4) + 3) % particleCount;
    const lineOffset = index * 6;
    const firstOffset = first * 3;
    const secondOffset = second * 3;
    linePositions.set(particlePositions.slice(firstOffset, firstOffset + 3), lineOffset);
    linePositions.set(particlePositions.slice(secondOffset, secondOffset + 3), lineOffset + 3);
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: config.lineColor,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const connectingLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  group.add(connectingLines);

  const objectDefinitions = [
    { radius: 0.72, position: [-2.8, 1.1, -0.4], speed: 0.045 },
    { radius: 0.5, position: [2.6, -0.5, -0.8], speed: -0.06 },
    { radius: 0.36, position: [1.1, 1.5, -1.1], speed: 0.075 },
    { radius: 0.44, position: [-1.2, -1.35, -0.7], speed: -0.05 },
  ];

  const activeObjectDefinitions = objectDefinitions.slice(0, window.innerWidth <= 760
    ? Math.min(2, config.objectCount)
    : config.objectCount);
  const meshes = activeObjectDefinitions.map(({ radius, position, speed }, index) => {
    const geometry = new THREE.IcosahedronGeometry(radius, 1);
    const material = new THREE.MeshBasicMaterial({
      color: config.objectColors[index],
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.userData.baseY = position[1];
    mesh.userData.speed = speed;
    group.add(mesh);
    return mesh;
  });

  const targetGroupRotation = new THREE.Vector2();
  const clock = new THREE.Clock();
  let animationFrame = 0;
  let resizeFrame = 0;
  let isVisible = true;
  let isPageVisible = !document.hidden;
  let isDisposed = false;

  const updateTheme = () => {
    const isDark = document.body.classList.contains('is-dark');
    particleMaterial.color.set(isDark ? 0xf0c6d4 : config.particleColor);
    particleMaterial.opacity = isDark ? 0.86 : 0.94;
    particleGlowMaterial.color.set(isDark ? 0xf6c9d8 : config.glowColor);
    particleGlowMaterial.opacity = isDark ? 0.27 : 0.34;
    lineMaterial.color.set(isDark ? 0xe4b7ca : config.lineColor);
    lineMaterial.opacity = isDark ? 0.3 : 0.4;
    meshes.forEach((mesh, index) => {
      mesh.material.opacity = isDark ? 0.16 : 0.22;
    });
  };

  const resize = () => {
    resizeFrame = 0;
    if (isDisposed) return;

    const width = hero.clientWidth;
    const height = hero.clientHeight;
    if (!width || !height) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const requestResize = () => {
    if (!resizeFrame) resizeFrame = window.requestAnimationFrame(resize);
  };

  const render = () => {
    animationFrame = 0;
    if (isDisposed || !isVisible || !isPageVisible) return;

    const elapsed = clock.getElapsedTime();
    const isDark = document.body.classList.contains('is-dark');
    const motionScale = isDark ? 1 : 1.65;
    group.rotation.y += (targetGroupRotation.x - group.rotation.y) * 0.025;
    group.rotation.x += (targetGroupRotation.y - group.rotation.x) * 0.025;
    particles.rotation.y = elapsed * 0.012 * motionScale;
    particleGlow.rotation.y = particles.rotation.y;
    connectingLines.rotation.y = particles.rotation.y;
    particles.position.y = Math.sin(elapsed * 0.18 * motionScale) * (isDark ? 0.08 : 0.13);
    particleGlow.position.y = particles.position.y;
    connectingLines.position.y = particles.position.y;

    meshes.forEach((mesh, index) => {
      mesh.rotation.x = elapsed * (index + 1) * 0.045 * motionScale;
      mesh.rotation.y = elapsed * mesh.userData.speed * motionScale;
      mesh.position.y = mesh.userData.baseY + Math.sin(elapsed * 0.16 * motionScale + index) * (isDark ? 0.12 : 0.18);
    });

    try {
      renderer.render(scene, camera);
    } catch {
      cleanup();
      return;
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  const startRendering = () => {
    if (!animationFrame && !isDisposed && isVisible && isPageVisible) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  const handlePointerMove = (event) => {
    if (!finePointer.matches || isDisposed) return;
    targetGroupRotation.x = ((event.clientX / window.innerWidth) * 2 - 1) * 0.08;
    targetGroupRotation.y = ((event.clientY / window.innerHeight) * 2 - 1) * 0.045;
  };

  const handleVisibilityChange = () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) startRendering();
  };

  const themeObserver = new MutationObserver(updateTheme);

  const handleMotionPreferenceChange = () => {
    if (reduceMotion.matches) cleanup();
  };

  function cleanup() {
    if (isDisposed) return;
    isDisposed = true;

    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('resize', requestResize);
    reduceMotion.removeEventListener?.('change', handleMotionPreferenceChange);

    particleGeometry.dispose();
    particleMaterial.dispose();
    particleGlowMaterial.dispose();
    lineGeometry.dispose();
    lineMaterial.dispose();
    meshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    renderer.dispose();
    canvas.remove();
  }

  hero.prepend(canvas);
  document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('resize', requestResize, { passive: true });
  reduceMotion.addEventListener?.('change', handleMotionPreferenceChange);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  updateTheme();
  resize();
  startRendering();

  return cleanup;
};

startBackground();
