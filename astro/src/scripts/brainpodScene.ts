import type * as THREE from 'three';

export interface BrainPodScene {
	setHold(locked: boolean): void;
	setFinish(finish: 'white' | 'graphite'): void;
	reset(): void;
	turn(): boolean;
	setEntranceProgress(progress: number): void;
	dispose(): void;
}

/** The existing Blender geometry, with DOM controls projected onto its physical surfaces. */
export async function createBrainPodScene(
	stage: HTMLElement,
	lcd: HTMLElement,
	wheel: HTMLElement,
	hold: HTMLButtonElement,
	signal: AbortSignal,
): Promise<BrainPodScene | undefined> {
	const [T, { CSS3DRenderer, CSS3DObject }, { RoomEnvironment }, { default: model }] =
		await Promise.all([
			import('three'),
			import('three/examples/jsm/renderers/CSS3DRenderer.js'),
			import('three/examples/jsm/environments/RoomEnvironment.js'),
			import('../data/brainpodModel.json'),
		]);
	if (signal.aborted) return;
	const packed = Uint8Array.from(atob(model.packed), (c) => c.charCodeAt(0));
	const bytes = await new Response(
		new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip')),
	).arrayBuffer();
	if (signal.aborted) return;
	const renderer = new T.WebGLRenderer({
		alpha: true,
		antialias: true,
		powerPreference: 'low-power',
	});
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = T.SRGBColorSpace;
	renderer.toneMapping = T.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.03;
	renderer.domElement.setAttribute('aria-hidden', 'true');
	stage.append(renderer.domElement);
	const scene = new T.Scene(),
		camera = new T.OrthographicCamera(-5, 5, 6, -6, 0.1, 100);
	camera.position.set(0, 0.08, 24);
	camera.lookAt(0, 0.08, 0);
	const pmrem = new T.PMREMGenerator(renderer),
		room = new RoomEnvironment();
	const environment = pmrem.fromScene(room, 0.04);
	scene.environment = environment.texture;
	scene.environmentIntensity = 0.65;
	room.dispose();
	pmrem.dispose();
	const key = new T.DirectionalLight(0xffffff, 2);
	key.position.set(-7, 9, 12);
	scene.add(key);
	const fill = new T.DirectionalLight(0xffffff, 0.85);
	fill.position.set(7, 1, 5);
	scene.add(fill);
	scene.add(new T.AmbientLight(0xffffff, 0.3));
	const pod = new T.Group();
	scene.add(pod);
	const materials = new Map<string, THREE.MeshPhysicalMaterial>();
	for (const mesh of model.meshes) {
		const geometry = new T.BufferGeometry();
		geometry.setAttribute(
			'position',
			new T.BufferAttribute(new Float32Array(bytes, mesh.offset, mesh.count), 3),
		);
		geometry.setAttribute(
			'normal',
			new T.BufferAttribute(new Float32Array(bytes, mesh.offset + mesh.count * 4, mesh.count), 3),
		);
		const color = new T.Color().setRGB(mesh.color[0], mesh.color[1], mesh.color[2]);
		const material = new T.MeshPhysicalMaterial({
			color,
			metalness: mesh.metalness,
			roughness: mesh.roughness,
		});
		if (mesh.name === 'White front shell') {
			material.clearcoat = 0.7;
			material.clearcoatRoughness = 0.23;
		}
		if (mesh.name === 'Chrome back') {
			material.roughness = 0.2;
			material.envMapIntensity = 1.2;
		}
		materials.set(mesh.name, material);
		const part = new T.Mesh(geometry, material);
		part.name = mesh.name;
		pod.add(part);
	}
	const holdSlider = pod.getObjectByName('Hold switch')!;
	let holdLocked = false;
	holdSlider.position.x = -0.42;
	const holdAnchor = new T.Vector3();
	const engraving = document.createElement('canvas');
	engraving.width = 900;
	engraving.height = 1200;
	const ctx = engraving.getContext('2d');
	if (!ctx) throw new Error('Canvas unavailable');
	ctx.fillStyle = '#54545460';
	ctx.textAlign = 'center';
	ctx.font = '500 51px sans-serif';
	ctx.fillText("Bubble's Brain", 450, 432);
	ctx.font = '20px sans-serif';
	ctx.fillText('保持好奇，持续探索。', 450, 485);
	ctx.lineWidth = 3;
	ctx.strokeStyle = '#54545455';
	ctx.beginPath();
	ctx.arc(450, 300, 40, 0, Math.PI * 2);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(450, 300, 14, 0, Math.PI * 2);
	ctx.stroke();
	ctx.font = '17px monospace';
	ctx.fillText('COLLECT. CONNECT. CREATE.', 450, 1015);
	const texture = new T.CanvasTexture(engraving);
	texture.colorSpace = T.SRGBColorSpace;
	const back = new T.Mesh(
		new T.PlaneGeometry(5.2, 8.8),
		new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
	);
	back.rotation.y = Math.PI;
	back.position.z = -0.806;
	pod.add(back);
	const cssScene = new T.Scene(),
		cssPod = new T.Group();
	cssScene.add(cssPod);
	const screen = new CSS3DObject(lcd);
	screen.scale.setScalar(0.01);
	screen.position.set(0, 2.23, 0.874);
	cssPod.add(screen);
	const wheelLabels = new CSS3DObject(wheel);
	wheelLabels.scale.setScalar(0.01);
	wheelLabels.position.set(0, -2.12, 0.944);
	cssPod.add(wheelLabels);
	const cssRenderer = new CSS3DRenderer();
	cssRenderer.domElement.className = 'html-render';
	cssRenderer.domElement.style.pointerEvents = 'none';
	stage.append(cssRenderer.domElement);
	const motion = matchMedia('(prefers-reduced-motion: reduce)');
	const upright = !!stage.closest('.brainpod--device');
	const base = upright ? { x: 0, y: 0, z: 0 } : { x: -0.04, y: -0.18, z: 0.19 };
	let target = { ...base },
		pose = upright || motion.matches ? { ...base } : { x: -0.07, y: -0.32, z: 0.24 };
	let raf = 0,
		entranceProgress = 0,
		disposed = false,
		flipped = false,
		drag: { id: number; x: number; y: number } | null = null;
	function schedule() {
		if (!raf && !document.hidden && !disposed) raf = requestAnimationFrame(frame);
	}
	function frame() {
		raf = 0;
		if (disposed || document.hidden) return;
		let moving = false;
		for (const axis of ['x', 'y', 'z'] as const) {
			const d = target[axis] - pose[axis];
			if (Math.abs(d) > 0.0001) {
				pose[axis] += motion.matches ? d : d * 0.13;
				moving = true;
			} else pose[axis] = target[axis];
		}
		const holdDelta = (holdLocked ? 0 : -0.42) - holdSlider.position.x;
		if (Math.abs(holdDelta) > 0.001) {
			holdSlider.position.x += motion.matches ? holdDelta : holdDelta * 0.22;
			moving = true;
		}
		render();
		if (moving) schedule();
	}
	function render() {
		const facing = 1 - entranceProgress;
		// Turn toward the nearest front face without changing the user's saved pose.
		const y = Math.atan2(Math.sin(pose.y), Math.cos(pose.y));
		pod.rotation.set(pose.x * facing, y * facing, pose.z * facing);
		cssPod.rotation.copy(pod.rotation);
		cssRenderer.domElement.style.visibility = Math.cos(y * facing) > 0.1 ? 'visible' : 'hidden';
		renderer.render(scene, camera);
		cssRenderer.render(cssScene, camera);
		holdAnchor.set(-1.55, 5.25, -0.11);
		pod.localToWorld(holdAnchor).project(camera);
		hold.style.left = `${((holdAnchor.x + 1) / 2) * stage.clientWidth}px`;
		hold.style.top = `${((-holdAnchor.y + 1) / 2) * stage.clientHeight}px`;
		hold.style.visibility = entranceProgress > 0.1 ? 'hidden' : 'visible';
	}
	function resize() {
		const w = stage.clientWidth,
			h = stage.clientHeight;
		if (!w || !h || disposed) return;
		const aspect = w / h,
			vertical = Math.max(11.85, 7.3 / aspect);
		camera.left = (-vertical * aspect) / 2;
		camera.right = (vertical * aspect) / 2;
		camera.top = vertical / 2;
		camera.bottom = -vertical / 2;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
		cssRenderer.setSize(w, h);
		schedule();
	}
	const observer = new ResizeObserver(resize);
	observer.observe(stage);
	const controls = { signal };
	stage.addEventListener(
		'pointerdown',
		(e) => {
			if (e.button !== 0 || (e.target as Element).closest('.lcd,.wheel-ui,.hold-switch')) return;
			drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
			stage.setPointerCapture(e.pointerId);
		},
		controls,
	);
	stage.addEventListener(
		'pointermove',
		(e) => {
			if (!drag || e.pointerId !== drag.id) return;
			target.y += (e.clientX - drag.x) * 0.01;
			target.x = Math.max(-0.48, Math.min(0.48, target.x + (e.clientY - drag.y) * 0.006));
			drag.x = e.clientX;
			drag.y = e.clientY;
			schedule();
		},
		controls,
	);
	stage.addEventListener('pointerup', () => (drag = null), controls);
	stage.addEventListener('pointercancel', () => (drag = null), controls);
	stage.addEventListener(
		'dblclick',
		(e) => {
			if (!(e.target as Element).closest('.lcd,.wheel-ui,.hold-switch')) reset();
		},
		controls,
	);
	document.addEventListener(
		'visibilitychange',
		() => {
			if (document.hidden) {
				cancelAnimationFrame(raf);
				raf = 0;
			} else schedule();
		},
		controls,
	);
	motion.addEventListener(
		'change',
		() => {
			pose = { ...target };
			schedule();
		},
		controls,
	);
	function reset() {
		target = { ...base };
		flipped = false;
		schedule();
	}
	function dispose() {
		if (disposed) return;
		disposed = true;
		cancelAnimationFrame(raf);
		observer.disconnect();
		pod.traverse((object) => {
			if (object instanceof T.Mesh) {
				object.geometry.dispose();
				const list = Array.isArray(object.material) ? object.material : [object.material];
				list.forEach((m) => m.dispose());
			}
		});
		texture.dispose();
		environment.dispose();
		renderer.dispose();
		renderer.domElement.remove();
		cssRenderer.domElement.remove();
	}
	signal.addEventListener('abort', dispose, { once: true });
	resize();
	// Position the DOM surfaces and draw the body before the caller reveals either layer.
	render();
	stage.dataset.renderer = 'webgl';
	return {
		setHold(value) {
			holdLocked = value;
			schedule();
		},
		setEntranceProgress(progress) {
			if (disposed || progress === entranceProgress) return;
			entranceProgress = progress;
			// Scroll and the DOM screen must use the same pose in the same frame.
			render();
		},
		setFinish(finish) {
			materials.get('White front shell')?.color.set(finish === 'graphite' ? '#353535' : '#f2f2ef');
			materials.get('Click wheel')?.color.set(finish === 'graphite' ? '#252525' : '#cdcdca');
			materials.get('Select button')?.color.set(finish === 'graphite' ? '#363636' : '#e9e9e6');
			schedule();
		},
		reset,
		turn() {
			flipped = !flipped;
			target = {
				x: flipped && !upright ? -0.12 : base.x,
				y: flipped ? Math.PI - (upright ? 0 : 0.24) : base.y,
				z: flipped && !upright ? 0.035 : base.z,
			};
			schedule();
			return flipped;
		},
		dispose,
	};
}
