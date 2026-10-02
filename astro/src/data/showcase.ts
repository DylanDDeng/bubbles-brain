/** Community works made with AI models. */

/** What a work shows (产品动效, 发布片, MV…); the Showcase reel filters by it. */
export interface ShowcaseCategory {
	id: string;
	title: string;
}

/** How a work was made (Code to Video…); shown as a label, not used for filtering. */
export interface ShowcaseMedium {
	id: string;
	title: string;
}

export interface ShowcaseWork {
	id: string;
	title: string;
	category: ShowcaseCategory['id'];
	medium: ShowcaseMedium['id'];
	model: string;
	/** Hosted media under /media/showcase/. */
	video: string;
	poster: string;
	/** Intrinsic video size; the player and poster keep this aspect ratio. */
	width: number;
	height: number;
	/** Length in whole seconds. */
	duration: number;
	/** Date the work was added to the site (YYYY-MM-DD). */
	added: string;
	note: string;
	/** The prompt the author used, when public; either language may be missing. */
	prompt?: { zh?: string; en?: string };
	source?: { author: string; url: string; platform?: string };
}

export const showcaseCategories: ShowcaseCategory[] = [
	{ id: 'product-motion', title: '产品动效' },
	{ id: 'launch', title: '发布片' },
	{ id: 'explainer', title: '知识科普' },
	{ id: 'demo', title: 'Demo' },
	{ id: 'mv', title: 'MV' },
];

export const showcaseMedia: ShowcaseMedium[] = [{ id: 'code-to-video', title: 'Code to Video' }];

export const showcaseWorks: ShowcaseWork[] = [
	{
		id: 'claude-opus-5.5-intro',
		title: 'Claude Opus 5.5 发布视频',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-intro.mp4',
		poster: '/media/showcase/claude-opus-5.5-intro.webp',
		width: 1920,
		height: 1080,
		duration: 20,
		added: '2026-09-29',
		note: 'Claude Opus 5.5 复刻自己的发布视频。',
	},
	{
		id: 'claude-opus-5.5-product-ui-motion',
		title: '产品界面动效',
		category: 'product-motion',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-product-ui-motion.mp4',
		poster: '/media/showcase/claude-opus-5.5-product-ui-motion.webp',
		width: 1440,
		height: 1440,
		duration: 14,
		added: '2026-09-29',
		note: 'Claude Opus 5.5 用一个形状连续变形出十几个界面组件的动效。',
		prompt: {
			zh: `<inputs>
向我询问：8 到 12 个我希望形状变成的 UI 状态（例如按钮、加载器、播放器、滑块、开关、标签、图表、命令面板、通知），纯黑白或一种强调色，以及一首约 120 BPM 的免版税歌曲（例如 Mixkit，商业使用免费）
</inputs>

<direction>
Dribbble 级别的 UI 动态。一个形状，永不切割：每个状态都是同一元素变形其尺寸、圆角和颜色，同时内容在短暂模糊中切换。光标驱动每一次变化，使用真实点击和拖拽。浅暖灰画布，黑白组件，一种干净的 UI 字体（Geist）。到处都是弹簧，最多轻微超调。相机缩放使每个状态填满画面。最后帧是第一帧，所以它循环。 禁止：弹跳缓动、粒子爆发、光晕、UI 铬上的渐变、不匹配的图标描边、空闲时间、任何看起来像模板的东西
</direction>

<structure>
120 BPM，7 小节，每拍都有事情发生。 按钮 → 加载器 → 勾选 → 动态岛 → 带播放/暂停变形的音乐播放器 → 拖动进度条 → 它变成音量滑块，拖过最大值时拉伸 → 开关在节拍上翻转 → 旋钮变成液体标签指示器 → 标签打开成一个自我绘制的图表，悬停时有工具提示 → 它折叠成 ⌘K → 输入过滤 → 回车 → 通知 → 回到按钮。
</structure>

<build>
1. 一个 HTML 文件，方形 1440x1440。每个样式都在 seek(t) 内从时间计算：无 CSS 过渡、无定时器、无帧间状态携带。
2. 弹簧是闭式阶跃响应。多次改变目标的值是每次变化一个弹簧之和，因此它保持为时间的纯函数。
3. 标签指示器的两个边缘骑乘不同的弹簧，因此领先边缘领先于尾随边缘拉伸。同样的技巧用于开关旋钮。
4. 拖拽是直接操作：光标按住时，值从其位置计算。释放时从当前位置弹回。
5. 用 numpy 分析歌曲以获取节拍网格，并在重拍开始。将每个 UI 声音放置在其测量的峰值上。
6. 用 Playwright 渲染：每帧 4 个子帧，用 ffmpeg tmix 混合以实现 60fps 动态模糊。
7. 在完整渲染前每拍渲染一帧。修复任何偏离网格、拥挤或难以阅读的东西。
</build>

<gotchas>
永远不要在相机缩放的任何东西或文本渲染模糊的任何东西上放置 will-change。在变形容器内切换的文本需要自己的进入和退出时机，否则会重叠。让最后一帧与第一帧完全相同，包括光标位置和速度，否则循环会卡顿
</gotchas>

<start>
向我询问输入，然后在你写任何代码前，在节拍网格上向我展示状态列表
</start>`,
		},
	},
	{
		id: 'claude-opus-5.5-hongmen-banquet',
		title: '鸿门宴',
		category: 'explainer',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-hongmen-banquet.mp4',
		poster: '/media/showcase/claude-opus-5.5-hongmen-banquet.webp',
		width: 1920,
		height: 1080,
		duration: 214,
		added: '2026-09-29',
		note: 'Claude Opus 5.5 用手绘白板动画讲鸿门宴。',
	},
	{
		id: 'claude-opus-5.5-iphone-18-pro-variable-aperture',
		title: 'iPhone 18 Pro 可变光圈',
		category: 'explainer',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-iphone-18-pro-variable-aperture.mp4',
		poster: '/media/showcase/claude-opus-5.5-iphone-18-pro-variable-aperture.webp',
		width: 1280,
		height: 720,
		duration: 87,
		added: '2026-09-29',
		note: 'Claude Opus 5.5 做的 iPhone 18 Pro 可变光圈科普视频。',
		source: {
			author: '@yz_chow',
			url: 'https://x.com/yz_chow/status/2104723082174935305',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-code-animation-short',
		title: '纯代码动画短片',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-code-animation-short.mp4',
		poster: '/media/showcase/claude-opus-5.5-code-animation-short.webp',
		width: 1920,
		height: 1080,
		duration: 40,
		added: '2026-09-29',
		note: 'Claude Opus 5.5 只用代码做出 20 个镜头的动画短片，不用素材也不用 AE。',
		prompt: {
			zh: '参考「视频链接」，帮我做一个动画短片能让网友惊掉下巴',
		},
		source: {
			author: '@AndyL5cc',
			url: 'https://x.com/AndyL5cc/status/2104850150749532431',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-every-frame-is-code',
		title: '每一帧都是代码',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-every-frame-is-code.mp4',
		poster: '/media/showcase/claude-opus-5.5-every-frame-is-code.webp',
		width: 1920,
		height: 1080,
		duration: 12,
		added: '2026-10-02',
		note: 'Claude Opus 5.5 用一个 seek(t) 函数逐帧画出弹球翻页动画，音效也是代码合成的。',
		prompt: {
			en: `Make a 12s motion video in code (1920x1080, 30fps, one HTML file drawing every frame from a single seek(t) function, rendered with Playwright + ffmpeg, with original synthesized sound).

Story: a dark prompt pill on an off-white page types "make a launch video" with a real keystroke rhythm → enter, the button flashes orange and the pill slides up → a 12-frame filmstrip stamps in left to right, one frame per beat at 120 BPM; each frame shows one pose of an orange ball's bounce (squash on contact, stretch mid-air, real arcs) → a playhead sweeps the strip while a big viewer above plays the poses as a flipbook, twice, faster the second time → the strip slides away, "every frame is code." fills the screen, and the ball arcs over and lands as the period.

Rules: arrive fast, land soft (cover 12–19% of the remaining distance per frame); nothing ever freezes (slow push on every hold); stagger 2–4 frames; blur only on fast moves; big and readable on a phone; off-white, ink and one orange only. Sound: a tick per key, a click on enter, a rising note per frame stamp, a thump when the ball lands.

Show me 5 stills first (typing, strip half-built, flipbook, headline, last frame), critique them like a harsh motion director, fix the 3 worst problems, then render.`,
		},
		source: {
			author: '@notdwd',
			url: 'https://x.com/notdwd/status/2105031774904766641',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-qingming-rainbow-bridge',
		title: '清明上河图里的虹桥',
		category: 'explainer',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-qingming-rainbow-bridge.mp4',
		poster: '/media/showcase/claude-opus-5.5-qingming-rainbow-bridge.webp',
		width: 720,
		height: 1280,
		duration: 151,
		added: '2026-10-02',
		note: 'Claude Opus 5.5 用 3D 动画讲《清明上河图》里的虹桥：几十根短木头互相托着，编成一座没有桥墩的拱桥。',
		source: {
			author: '@AndyL5cc',
			url: 'https://x.com/AndyL5cc/status/2105159074136596698',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-fifteen-mg-styles',
		title: '十五种 MG 动画风格',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-fifteen-mg-styles.mp4',
		poster: '/media/showcase/claude-opus-5.5-fifteen-mg-styles.webp',
		width: 1280,
		height: 720,
		duration: 179,
		added: '2026-10-02',
		note: 'Claude Opus 5.5 用代码做出十五种 MG 动画风格，从逐帧手绘、扁平矢量到赛博朋克 HUD 和复古 Synthwave。',
		source: {
			author: '@VincentWei93',
			url: 'https://x.com/VincentWei93/status/2104957548797604116',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-pocketsflow-promo',
		title: 'Pocketsflow 宣传片',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-pocketsflow-promo.mp4',
		poster: '/media/showcase/claude-opus-5.5-pocketsflow-promo.webp',
		width: 1920,
		height: 1080,
		duration: 15,
		added: '2026-10-02',
		note: 'Claude Opus 5.5 为创作者收款平台 Pocketsflow 做的宣传片，一个半调网点小人串起开店、结账和订阅。',
		source: {
			author: '@achxvi',
			url: 'https://x.com/achxvi/status/2103918792845963545',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-clips-clipboard-promo',
		title: 'Clips 剪贴板宣传片',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-clips-clipboard-promo.mp4',
		poster: '/media/showcase/claude-opus-5.5-clips-clipboard-promo.webp',
		width: 1920,
		height: 1080,
		duration: 15,
		added: '2026-10-02',
		note: 'Claude Opus 5.5 为 Windows 剪贴板工具 Clips 做的 3D 宣传片：复制、归类、粘贴，一镜到底。',
		source: {
			author: '@okooo5km',
			url: 'https://x.com/okooo5km/status/2104884349841846515',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-fall-watercolor',
		title: '水彩里的秋天',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-fall-watercolor.mp4',
		poster: '/media/showcase/claude-fable-5.5-fall-watercolor.webp',
		width: 1080,
		height: 1920,
		duration: 25,
		added: '2026-10-02',
		note: 'Claude Fable 5.5 用代码画的水彩动画：一片枫叶落进湖里，晕开成一整幅秋景。',
		source: {
			author: '@ishuagra02',
			url: 'https://x.com/ishuagra02/status/2106000055706784118',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-humanity-walks',
		title: '人类走过三万年',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-humanity-walks.mp4',
		poster: '/media/showcase/claude-fable-5.5-humanity-walks.webp',
		width: 1920,
		height: 1080,
		duration: 74,
		added: '2026-10-02',
		note: 'Claude Fable 5.5 用代码画的短片：一个人走过二十种艺术风格，从洞穴壁画一路走进机器的潜空间，配乐也是代码写的。',
		prompt: {
			en: 'One person crosses 30,000 years of art in 74 seconds. 20 plates, and at every border the style changes: from a cave wall to the latent space of a machine.',
		},
		source: {
			author: '@l_mejiaC',
			url: 'https://x.com/l_mejiaC/status/2105801379956850793',
			platform: 'X',
		},
	},
];

export const showcaseHref = (work: Pick<ShowcaseWork, 'id'>) => `/vibe-coding/showcase/${work.id}/`;

export function showcaseCategory(id: string) {
	return showcaseCategories.find((category) => category.id === id);
}

export function showcaseMedium(id: string) {
	return showcaseMedia.find((medium) => medium.id === id);
}

/** Newest first; the first entry is what the Showcase theater plays by default. */
export const showcaseByNewest = () =>
	showcaseWorks
		.map((work, index) => ({ work, index }))
		// Same-day additions: the later entry in the list is the newer one.
		.sort((a, b) => b.work.added.localeCompare(a.work.added) || b.index - a.index)
		.map(({ work }) => work);

export const formatShowcaseDuration = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
