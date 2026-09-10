import type * as THREE from 'three';

async function loadPublication(kind: string | undefined) {
	const [model, print] =
		kind === 'tutorials'
			? await Promise.all([
					import('../data/brainpod-art/collection-objects/tutorials.json'),
					import('../data/brainpod-art/collection-objects/tutorials-cover.png?url'),
				])
			: kind === 'vibe-coding'
				? await Promise.all([
						import('../data/brainpod-art/collection-objects/vibe-coding.json'),
						import('../data/brainpod-art/collection-objects/vibe-coding-cover.png?url'),
					])
				: kind === 'benchmarks'
					? await Promise.all([
							import('../data/brainpod-art/collection-objects/benchmarks.json'),
							import('../data/brainpod-art/collection-objects/benchmarks-cover.png?url'),
						])
					: await Promise.all([
							import('../data/brainpod-art/magazine/read-again.json'),
							import('../data/brainpod-art/magazine/cover.png?url'),
						]);
	return { packedModel: model.default, printUrl: print.default };
}

export interface ReadingMagazineScene {
	setVisible(visible: boolean): void;
	dispose(): void;
}

/** A Blender-authored paper object, enhanced without changing its containing link. */
export async function createReadingMagazineScene(
	host: HTMLElement,
	signal: AbortSignal,
): Promise<ReadingMagazineScene | undefined> {
	const [T, { GLTFLoader }, { packedModel, printUrl }] = await Promise.all([
		import('three'),
		import('three/examples/jsm/loaders/GLTFLoader.js'),
		loadPublication(host.dataset.readingMagazine),
	]);
	if (signal.aborted) return;
	const renderer = new T.WebGLRenderer({
		alpha: true,
		antialias: true,
		powerPreference: 'low-power',
	});
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setClearColor(0xffffff, 0);
	renderer.outputColorSpace = T.SRGBColorSpace;
	renderer.toneMapping = T.NeutralToneMapping;
	renderer.toneMappingExposure = 1;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = T.PCFSoftShadowMap;
	const scene = new T.Scene();
	const camera = new T.OrthographicCamera(-1.8, 1.8, 2.3, -2.3, 0.1, 30);
	camera.position.set(0, 0, 10);
	const book = new T.Group();
	scene.add(book);
	// Use one upright display pose for every collection, with a little visible depth.
	const base = { x: 0, y: -0.3, z: 0 };
	book.rotation.set(base.x, base.y, base.z);
	const key = new T.DirectionalLight(0xffffff, 1.8);
	key.position.set(-3, 5, 8);
	key.castShadow = true;
	key.shadow.mapSize.set(1024, 1024);
	key.shadow.camera.left = key.shadow.camera.bottom = -3;
	key.shadow.camera.right = key.shadow.camera.top = 3;
	key.shadow.camera.near = 0.5;
	key.shadow.camera.far = 20;
	key.shadow.bias = -0.00015;
	key.shadow.normalBias = 0.008;
	scene.add(key);
	scene.add(new T.HemisphereLight(0xffffff, 0xc7cbd3, 1.6));
	scene.add(new T.AmbientLight(0xffffff, 0.65));
	const fill = new T.DirectionalLight(0xffffff, 1.6);
	fill.position.set(4, -1, 4);
	scene.add(fill);
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
	const root = host.closest<HTMLElement>('[data-brainpod]');
	const events = new AbortController();
	let disposed = false,
		visible = true,
		raf = 0,
		loaded = false;
	let targetX = 0,
		targetY = 0,
		x = 0,
		y = 0;
	const textures = new Set<THREE.Texture>();
	const geometries = new Set<THREE.BufferGeometry>();
	const materials = new Set<THREE.Material>();
	function releaseObject(object: THREE.Object3D) {
		object.traverse((child) => {
			if (!(child instanceof T.Mesh)) return;
			geometries.add(child.geometry);
			for (const material of Array.isArray(child.material) ? child.material : [child.material])
				materials.add(material);
		});
		geometries.forEach((geometry) => geometry.dispose());
		materials.forEach((material) => material.dispose());
	}
	function motionAllowed() {
		if (reduced.matches || !finePointer.matches || root?.dataset.motion === 'off') return false;
		if (!root) {
			try {
				return sessionStorage.getItem('bubble-brainpod-motion') !== 'paused';
			} catch {
				// A blocked storage API does not prevent reading or pointer interaction.
			}
		}
		return true;
	}
	function stop() {
		cancelAnimationFrame(raf);
		raf = 0;
	}
	function schedule() {
		if (!disposed && loaded && visible && !document.hidden && !raf)
			raf = requestAnimationFrame(frame);
	}
	function frame() {
		raf = 0;
		if (disposed || !visible || document.hidden) return;
		x += (targetX - x) * 0.13;
		y += (targetY - y) * 0.13;
		book.rotation.set(base.x + y * 0.02, base.y + x * 0.085, base.z);
		renderer.render(scene, camera);
		if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.0005) schedule();
	}
	function resetPose() {
		targetX = targetY = 0;
		if (!motionAllowed()) x = y = 0;
		schedule();
	}
	function resize() {
		const width = host.clientWidth,
			height = host.clientHeight;
		if (!width || !height || disposed) return;
		const vertical = 3.95;
		const horizontal = (vertical * width) / height;
		camera.left = -horizontal / 2;
		camera.right = horizontal / 2;
		camera.top = vertical / 2;
		camera.bottom = -vertical / 2;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height, false);
		schedule();
	}
	const resizes = new ResizeObserver(resize);
	const settings = new MutationObserver(resetPose);
	function dispose() {
		if (disposed) return;
		disposed = true;
		stop();
		events.abort();
		resizes.disconnect();
		settings.disconnect();
		releaseObject(scene);
		textures.forEach((texture) => texture.dispose());
		key.shadow.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		renderer.domElement.remove();
		delete host.dataset.magazineReady;
	}
	signal.addEventListener('abort', dispose, { once: true });
	try {
		const packed = Uint8Array.from(atob(packedModel.packed), (char) => char.charCodeAt(0));
		const bytes = await new Response(
			new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip')),
		).arrayBuffer();
		if (disposed) return;
		const model = await new GLTFLoader().parseAsync(bytes, '');
		if (disposed) {
			releaseObject(model.scene);
			return;
		}
		book.add(model.scene);
		const print = await new T.TextureLoader().loadAsync(printUrl);
		if (disposed) {
			print.dispose();
			return;
		}
		textures.add(print);
		print.colorSpace = T.SRGBColorSpace;
		print.flipY = false;
		print.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
		book.traverse((child) => {
			if (!(child instanceof T.Mesh)) return;
			child.castShadow = child.receiveShadow = true;
			const surfaces = Array.isArray(child.material) ? child.material : [child.material];
			child.receiveShadow = surfaces.every((surface) => surface.name !== 'Matte printed cover');
			for (const material of surfaces) {
				if (material.name === 'Matte printed cover') {
					material.map = print;
					material.needsUpdate = true;
				}
			}
		});
		const canvas = renderer.domElement;
		canvas.className = 'reading-magazine-canvas';
		canvas.setAttribute('aria-hidden', 'true');
		canvas.addEventListener(
			'webglcontextlost',
			() => {
				dispose();
				host.dataset.magazineState = 'fallback';
			},
			{ signal: events.signal },
		);
		host.append(canvas);
		loaded = true;
		resize();
		// Publish only after the first real frame; the static cover never disappears early.
		renderer.render(scene, camera);
		host.dataset.magazineReady = '';
		resizes.observe(host);
		if (root) settings.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
		host.addEventListener(
			'pointermove',
			(event) => {
				if (!motionAllowed() || event.pointerType !== 'mouse' || event.buttons) return;
				const bounds = host.getBoundingClientRect();
				targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
				targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
				schedule();
			},
			{ passive: true, signal: events.signal },
		);
		host.addEventListener('pointerleave', resetPose, { signal: events.signal });
		reduced.addEventListener('change', resetPose, { signal: events.signal });
		finePointer.addEventListener('change', resetPose, { signal: events.signal });
		document.addEventListener(
			'visibilitychange',
			() => {
				if (document.hidden) stop();
				else schedule();
			},
			{ signal: events.signal },
		);
		return {
			setVisible(value) {
				visible = value;
				if (value) {
					resize();
					schedule();
				} else {
					stop();
					targetX = targetY = x = y = 0;
				}
			},
			dispose,
		};
	} catch (error) {
		dispose();
		if (!signal.aborted) throw error;
	}
}
