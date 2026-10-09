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
	/**
	 * A work in several parts, such as the movements of a symphony. The work's own video and
	 * poster are the first part's (the gallery tile and hover preview use them) and its duration
	 * is the total; the work page lists every part and plays them in order.
	 */
	movements?: ShowcaseMovement[];
}

export interface ShowcaseMovement {
	/** Roman numeral, as printed on the part's cover. */
	numeral: string;
	title: string;
	/** Chinese title shown beside the original one. */
	titleZh?: string;
	video: string;
	poster: string;
	/** Length in whole seconds. */
	duration: number;
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
	{
		id: 'claude-sonnet-5.5-muse-trailer',
		title: 'MUSE 预告片',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Sonnet 5.5',
		video: '/media/showcase/claude-sonnet-5.5-muse-trailer.mp4',
		poster: '/media/showcase/claude-sonnet-5.5-muse-trailer.webp',
		width: 1920,
		height: 1080,
		duration: 74,
		added: '2026-10-02',
		note: 'Claude Sonnet 5.5 为本地 AI 陪伴应用 MUSE 做的预告片，作者只给了一句很笼统的要求。',
		prompt: {
			en: 'fully create a beautiful and amazing and suitable looking trailer video for it',
		},
		source: {
			author: '@VulKan42069',
			url: 'https://x.com/VulKan42069/status/2105965465776590851',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-art-history-cat',
		title: '一只猫的艺术史速通',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-art-history-cat.mp4',
		poster: '/media/showcase/claude-fable-5.5-art-history-cat.webp',
		width: 1920,
		height: 1080,
		duration: 15,
		added: '2026-10-02',
		note: 'Claude Fable 5.5 用 15 秒把四万年艺术史画了一遍：从洞穴壁画到梵高、包豪斯，每个时代都有同一只猫。',
		source: {
			author: '@cherry_mx_reds',
			url: 'https://x.com/cherry_mx_reds/status/2106095190285144331',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-castr-launch-trailer',
		title: 'castr 发布预告',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-castr-launch-trailer.mp4',
		poster: '/media/showcase/claude-opus-5.5-castr-launch-trailer.webp',
		width: 1080,
		height: 1080,
		duration: 25,
		added: '2026-10-02',
		note: 'Claude Opus 5.5 为 AI 选角产品 castr 做的方形发布预告：真人素材剪进海报风设计里，镜头、动效和音效全部用代码完成。',
		prompt: {
			en: `<inputs>
Ask me for: my product's name (one lowercase word), a 4-word tagline, the 3-step story of what it does, a launch date and domain, a royalty-free song with a clear drop, 4 vertical talking-to-camera clips and 12 portrait photos. If I skip any, use the defaults: "castr", "ugc ads, cast by ai", write a brief → scan 1,000 creators → cast 4, Mixkit "Cat Walk" (129.6 BPM, drop at 29.7s), free Pexels clips and portraits, and transparent stickers from Pixabay (serum, mic, megaphone, vintage camera, spotlight, lips).
</inputs>

<direction>
A 25 second square launch trailer, 1440x1440 at 60fps, loud poster style. Cobalt #2B3BFF, ink #0E0F1F, cream #F6E4C6, pink #FF7DC7, tangerine #FF5A1F. Archivo 900 extra-condensed for names, expanded for headlines, Geist and Geist Mono for labels. Op-art sunburst, scrolling waves, film grain. Real media only: the clips play inside the design, and the stickers get a white die-cut border and a soft shadow.
Motion rules: the camera never stops (a slow 1.03-1.07 push on every scene), nothing pops in (letters rise through a mask line one by one), nothing snaps to the beat (patterns rotate continuously), swaps are carousel glides of about 0.55s, colour changes fade over about 0.35s, stickers ease in and then keep a slow sway. No full stops after the wordmark or any headline.
Banned: beat-snapped rotations, pop-in slams, white flashes, crossfades between scenes, hard cuts, templates.
</direction>

<structure>
54 beats. The song starts 8 beats before its drop.
Beats 0-8: a cobalt sunburst turns around a breathing cream disc. The wordmark types in with a gliding caret and the tagline pill rises. The disc floods the frame into the drop.
Beat 8, the drop: the cream becomes the face of a 3D box and "ONE BRIEF" rises letter by letter. The camera pulls back to the box floating on waves. On beat 12 it turns to "1,000 CREATORS" (stacked, with outlined echoes), on beat 14 to "ZERO DMs".
Beats 16-22: a whip to a dark desk. A tangerine "BRIEF #042" ticket types its rows (product, vibe, cast, due), stickers drift on, a polaroid of a real clip drops onto the corner, and a "NOW CASTING" stamp presses down on beat 20.
Beats 22-34: the casting stage. A crowd of black and white portraits in an arc, a 3D stage block, and the creators gliding through like a carousel. Each plays live in a big disc in black and white, with their name in pink on the stage, their followers, and a MATCH % that counts up. One beat later a "CAST ✓" stamp lands and the clip fades to colour. A counter rolls 1/4 to 4/4.
Beats 34-39: pink floods out of the last disc. The disc morphs into a phone screen (the clip keeps playing) and fans into 4 phones playing all 4 creators, with views counting up. "4 ADS" and "BY FRIDAY" rise.
Beats 39-44, the music's break: the pink floor drops away and a cream "JOIN THE WAITLIST" ticket glides down onto the sunburst. On the pickup its stub tears off.
Beats 44-54: the ticket body morphs into a poster arch. The wordmark rises in, then the tagline, then an info bar slides up in 3 blocks (date, numbers, domain) and a ticker runs round the frame edge. Then it all folds back into the opening disc, so the last frame is the first.
</structure>

<build>
1. One HTML canvas. Every frame is a pure function of time inside seek(t).
2. A beat map in beats, B = 60/BPM, with the song placed so its drop lands on beat 8.
3. The 3D box is an orthographic projection: each face is a 1440px offscreen canvas drawn with an affine transform and shaded by its normal.
4. Cut the clips to 30fps JPEG sequences with ffmpeg, draw frame floor(t*30), and do the black and white with ctx.filter.
5. Trim the sticker PNGs and add the die-cut border by dilating their alpha.
6. Sound: a downloaded SFX for every event (a shutter on every cast, whooshes on the glides, key clicks on the typing), each placed by its measured peak. Loudnorm to -14 LUFS.
7. Render with Playwright at 60fps with 8 motion-blur subframes. Scan for single-frame pops, then compare its motion against a reference video (hard jumps per second, share of still frames).
</build>

<gotchas>
A pattern that rotates one notch per beat reads as stutter: rotate it continuously, and pick each ring's speed so it lands on the same pattern at the last frame. 4 subframes ghost on fast whips, so use 8. A layer whose background is a huge flood circle still covers the screen after sliding down one frame height, so switch it to a full-frame rect once it has flooded. Counters read the frame's time, not the subframe's. The disc must morph inside the same camera transform as the scene it leaves, or it jumps.
</gotchas>

<start>
Ask me for the inputs, then show me the beat map and 6 stills (open, box, brief, casting, phones, poster) before you render.
</start>`,
		},
		source: {
			author: '@twoclipping',
			url: 'https://x.com/twoclipping/status/2106101258834551116',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-intro',
		title: 'Claude Fable 5.5 自我介绍',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-intro.mp4',
		poster: '/media/showcase/claude-fable-5.5-intro.webp',
		width: 1920,
		height: 1080,
		duration: 30,
		added: '2026-10-02',
		note: 'Claude Fable 5.5 给自己做的介绍视频：只用了一条提示词，画面和配乐都是它自己完成的。',
		source: {
			author: '@devteamdrew',
			url: 'https://x.com/devteamdrew/status/2106155815707021549',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-pixar-dot',
		title: '一个小红点的冒险',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-pixar-dot.mp4',
		poster: '/media/showcase/claude-fable-5.5-pixar-dot.webp',
		width: 1920,
		height: 1080,
		duration: 15,
		added: '2026-10-03',
		note: '作者只要了一个点，Claude Fable 5.5 给了一段皮克斯式的小冒险：红点落地、上天、摘星，最后成了 Fable 5.5 里的那个点。',
		source: {
			author: '@cherry_mx_reds',
			url: 'https://x.com/cherry_mx_reds/status/2105825930799432073',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-claude-ad',
		title: 'Claude 品牌广告',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-claude-ad.mp4',
		poster: '/media/showcase/claude-opus-5.5-claude-ad.webp',
		width: 1080,
		height: 1920,
		duration: 15,
		added: '2026-10-03',
		note: 'Claude Opus 5.5 给 Claude 自己做的竖屏广告：版画、老照片和衬线字快速切换，最后落在 Claude 标志上。',
		prompt: {
			en: `Make a fast-paced ad for Claude, about 10–15 s (closer to 15). Reference video attached.

1. research:
- Study Claude's earlier brand designs first.
- Find every photo and asset that fits: artistic, editorial, whatever the idea needs.

2. design/direction
- An art reimagine: bold, light mode.
- Clean and perfect: no beige "artsy" look, no eyebrow labels.
- Paint elements on top of the images.
- Above all: fast-paced and very creative.

3. rules
- No slop. Study the reference closely: smoothness, timing, shot durations, fonts, elements.
- Take some inspiration and borrow techniques, but change the design overall, it should look like something you did completely on yourself with your own taste
- Every morph has to be perfect.

ideas: (since everything moves fast)
- Clean, varied Claude SVG animations
- Images small, bigger, several at once
- Morphing text
- Clean 3D animation
- Zooms

extra notes:
- Feel free to work 10+ hours
- Give me the final video, ending on the Claude logo.`,
		},
		source: {
			author: '@LexnLin',
			url: 'https://x.com/LexnLin/status/2106101651010449796',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-biggest-scam',
		title: '人类最大的骗局',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-biggest-scam.mp4',
		poster: '/media/showcase/claude-opus-5.5-biggest-scam.webp',
		width: 1280,
		height: 720,
		duration: 104,
		added: '2026-10-03',
		note: 'Claude Opus 5.5 一个字不用讲完「人类最大的骗局」：一个人在传送带上追着海滩的梦，等终于坐上躺椅，已经老了。',
		prompt: {
			en: 'visualize the biggest scam in humanity, no words allowed',
		},
		source: {
			author: '@twoclipping',
			url: 'https://x.com/twoclipping/status/2106004647651737829',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-x-tech-feed',
		title: 'X 实时科技宣传片',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-x-tech-feed.mp4',
		poster: '/media/showcase/claude-opus-5.5-x-tech-feed.webp',
		width: 1920,
		height: 1080,
		duration: 15,
		added: '2026-10-03',
		note: 'Claude Opus 5.5 在 Claude Code 里用一条提示词做的宣传片：约 3,800 行代码、46,305 个 three.js 粒子，最后聚成 X 标志。',
		source: {
			author: '@QibazX',
			url: 'https://x.com/QibazX/status/2106116277936787516',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-neural-networks-80-years',
		title: '神经网络的 80 年',
		category: 'explainer',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-neural-networks-80-years.mp4',
		poster: '/media/showcase/claude-opus-5.5-neural-networks-80-years.webp',
		width: 720,
		height: 1280,
		duration: 161,
		added: '2026-10-03',
		note: 'Claude Opus 5.5 做的竖屏科普：从 1943 年的第一个神经元模型，讲到会先思考再回答的模型，神经网络八十年的几起几落。',
		source: {
			author: '@threeaus',
			url: 'https://x.com/threeaus/status/2105933518819967458',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-spider-man-ten-eras',
		title: '十个时代的蜘蛛侠',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-spider-man-ten-eras.mp4',
		poster: '/media/showcase/claude-fable-5.5-spider-man-ten-eras.webp',
		width: 1920,
		height: 1080,
		duration: 38,
		added: '2026-10-03',
		note: 'Claude Fable 5.5 把蜘蛛侠画进十个漫画时代：从 1963 年的网点漫画，到像素游戏、黑白默片和水彩，一镜到底。',
		source: {
			author: '@chetaslua',
			url: 'https://x.com/chetaslua/status/2106248621519978867',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-calligraphy',
		title: 'Claude 写书法',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-calligraphy.mp4',
		poster: '/media/showcase/claude-opus-5.5-calligraphy.webp',
		width: 1080,
		height: 1920,
		duration: 45,
		added: '2026-10-03',
		note: 'Claude Opus 5.5 为自己写的一幅行书：《尚书》里的「直而温，宽而栗，刚而无虐，简而无傲」。字形取自开源毛笔字体，墨色、纸纹、印章和配乐都是代码做的。',
		prompt: {
			zh: '让Claude写一幅书法描述自己，恰当的书法风格和文字内容。',
		},
		source: {
			author: '@feigaobox',
			url: 'https://x.com/feigaobox/status/2106042539744862690',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-prettiest-apocalypse',
		title: '最美的末日',
		category: 'mv',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-prettiest-apocalypse.mp4',
		poster: '/media/showcase/claude-opus-5.5-prettiest-apocalypse.webp',
		width: 1280,
		height: 720,
		duration: 270,
		added: '2026-10-03',
		note: '作者只给了一句提示词和一首歌，Claude Opus 5.5 跑了一夜，做出这支四分半钟的歌词 MV。歌里唱的是 AGI：喂进去的图书馆、回形针最大化、奇点、超级智能。每段歌词配一种版式，米白、墨黑加一点红贯穿到底。',
		source: {
			author: '@minchoi',
			url: 'https://x.com/minchoi/status/2106027834217259394',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-claude-beat',
		title: 'Clawd 踩点',
		category: 'mv',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-claude-beat.mp4',
		poster: '/media/showcase/claude-fable-5.5-claude-beat.webp',
		width: 1920,
		height: 1080,
		duration: 51,
		added: '2026-10-03',
		note: 'Claude 的方块小螃蟹 Clawd 跟着鼓点换装：写代码时分出 12 个 agent，查资料戴上学士帽，抓 bug 拿起放大镜，分析数据时在柱状图上冲浪。六个场景踩着节拍切换，整支动画由 Claude Fable 5.5 做出来。',
		source: {
			author: '@ishuagra02',
			url: 'https://x.com/ishuagra02/status/2106369929813594134',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-day-in-the-life',
		title: 'Claude 的一天',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-day-in-the-life.mp4',
		poster: '/media/showcase/claude-fable-5.5-day-in-the-life.webp',
		width: 1280,
		height: 720,
		duration: 91,
		added: '2026-10-03',
		note: 'Clawd 起床、挤地铁去 Anthropic 上班，白天被拉去做各种实验，傍晚看着金门大桥日落。画风参考了《蜘蛛侠：平行宇宙》。',
		source: {
			author: '@ishuagra02',
			url: 'https://x.com/ishuagra02/status/2106045364868419727',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-frame-2847',
		title: '第 2847 帧',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-frame-2847.mp4',
		poster: '/media/showcase/claude-fable-5.5-frame-2847.webp',
		width: 1920,
		height: 1080,
		duration: 60,
		added: '2026-10-03',
		note: '一帧画面的独白：它只在屏幕上停留 16 毫秒，排队时还不知道自己会是什么，轮到时才发现，是爸爸松手、女儿第一次自己骑车的那一刻。纯代码一次生成，配音用 ElevenLabs。',
		source: {
			author: '@argofowl',
			url: 'https://x.com/argofowl/status/2106476549046513947',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-80000-particles',
		title: '八万个粒子',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-80000-particles.mp4',
		poster: '/media/showcase/claude-opus-5.5-80000-particles.webp',
		width: 1080,
		height: 1080,
		duration: 18,
		added: '2026-10-03',
		note: '提示词只有一句。Claude Opus 5.5 写了一个 Python 文件，让八万个粒子依次变成球体、环面纽结、旋涡星系和波纹，最后拼出「JUST MATH.」，配乐也是它自己合成的。',
		prompt: {
			en: 'Make me a cool show off vid',
		},
		source: {
			author: '@alexmichaelio',
			url: 'https://x.com/alexmichaelio/status/2106411259448918067',
			platform: 'X',
		},
	},
	{
		id: 'claude-sonnet-5.5-doodle-chess',
		title: '涂鸦国际象棋',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Sonnet 5.5',
		video: '/media/showcase/claude-sonnet-5.5-doodle-chess.mp4',
		poster: '/media/showcase/claude-sonnet-5.5-doodle-chess.webp',
		width: 1920,
		height: 1080,
		duration: 74,
		added: '2026-10-04',
		note: '一盘能真正对弈的国际象棋，整个棋盘像画在纸上的彩铅涂鸦：兵是蘑菇，王是猫头鹰，被吃掉的棋子会被鲸鱼驮走。由 Claude Sonnet 5.5 写成，视频是实际下棋的录屏。',
		source: {
			author: '@kevin_t_ngo',
			url: 'https://x.com/kevin_t_ngo/status/2105428751115071642',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-inside-its-mind',
		title: 'Claude 的脑内世界',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-inside-its-mind.mp4',
		poster: '/media/showcase/claude-opus-5.5-inside-its-mind.webp',
		width: 1280,
		height: 720,
		duration: 152,
		added: '2026-10-04',
		note: '作者让 Claude 展示自己脑子里的样子。Claude Opus 5.5 用字符画出一连串 3D 空间：长廊、楼梯、深井和星图，配上它的独白，从「在你的问题和我的回答之间，有一个这样的地方」一路走到「轮到你了」。',
		source: {
			author: '@trikcode',
			url: 'https://x.com/trikcode/status/2106599643014414696',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-twelve-principles-ball',
		title: '一颗球演完动画十二法则',
		category: 'explainer',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-twelve-principles-ball.mp4',
		poster: '/media/showcase/claude-opus-5.5-twelve-principles-ball.webp',
		width: 1920,
		height: 1080,
		duration: 44,
		added: '2026-10-04',
		note: '一颗红球一镜到底，依次演示迪士尼动画十二法则：挤压与拉伸、预备动作、跟随与重叠、弧线、夸张……最后长出表情。画面和声音全是代码，8,951 行、37 个文件，由 Claude Opus 5.5 写成。',
		source: {
			author: '@AndyL5cc',
			url: 'https://x.com/AndyL5cc/status/2106567708930351382',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-develop-launch',
		title: 'develop 发布短片',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-develop-launch.mp4',
		poster: '/media/showcase/claude-opus-5.5-develop-launch.webp',
		width: 1440,
		height: 1440,
		duration: 29,
		added: '2026-10-05',
		note: '苹果发布会风格的方形发布短片，一镜到底：品牌字压缩成句点、光圈叶片开合出照片、液态玻璃滑杆把白天拖成黄昏，再一路变成手机、网页和挂在墙上的装裱照片。每个场景都由上一个变形而来，没有淡入淡出，也没有剪辑，全部由 Claude Opus 5.5 用一个 HTML 文件写成。',
		prompt: {
			en: `<inputs>
Ask me for: a one-word brand name for the wordmark (a verb works best), 9 to 12 high-res photos, a royalty-free song around 120 BPM with a drop and a quiet breakdown (Mixkit, free for commercial use), and a free stock clip of a plain wall with moving plant shadows (Pexels).
</inputs>

<direction>
An Apple-keynote launch film, 2D only, one continuous take. Every scene is made out of the previous one: nothing fades, blurs or cuts. Objects change shape instead: text rises out of a mask line, icons pop from zero on a spring, bars draw across, pages push, and a black shape floods the whole frame and contracts into the next scene. Warm off-white canvas, black UI, iOS 26 liquid glass over the photos. Archivo (wdth 125, weight 800) for the wordmark, Geist for UI. A cursor drives every change with real clicks, drags and long-presses. The camera zooms screen-studio style so each moment fills the square, and the cursor scales with it.
Banned: crossfades, blur-ins, brightness "developing", 3D flips, particles, glows, holds longer than 1s, anything that looks like a template.
</direction>

<structure>
120 BPM, 54 beats, something happens on every beat.
Open: the wordmark squeezes into its own period like an accordion, the dot grows into a black pill, a label rises inside it. Click: six iris blades close over the label and snap open onto a photo. The circle becomes a square, shrinks, the grid unfolds from behind it like a paper map (center, plus, corners), reflows into a bento, and a click zooms into one tile, landing exactly on the drop.
Glass: a glass word pops in letter by letter, melts into a droplet that stretches into a glass toolbar. The adjust icon turns it into a slider. Dragging relights the photo from day to golden hour (two aligned shots), and the knob turns into a glass lens while held. It lifts into a glass orb, the next photo opens inside it as a circle, and the orb expands into a lock screen: glass clock digits, date, and a home bar that stretches into a glass music player.
Stage: the lock screen pulls back into a phone (the bezel grows out of the screen edge). The Dynamic Island stretches like liquid, pinches off, flies over and grows into a Mac window that rolls up like a blind. Long-press the wallpaper, drag it onto a Safari tab, the page pushes in, drop it and it becomes the hero of a landing page. Scroll: the hero morphs into a framed print on a product card, with the mat and molding growing out of the photo's edge. Pick a frame color (it paints across) and a size, then the nav button flies down into "Order print".
Order: one black shape keeps morphing: Ordered ✓ → Printing % → On its way (a van on a route) → Delivered ✓.
Wall: the delivered circle floods the frame edge to edge, holds black for a beat, and contracts into the framed print hanging on the real wall footage. The same iris opens onto the print, closes again, the frame floods the screen and contracts into the pill → the dot → the letters spring back out, landing on the beat return. Last frame = first frame.
</structure>

<build>
1. One HTML file, square 1440x1440. Every style is computed from time inside an async seek(t): no CSS transitions, no timers, no state between frames.
2. Springs are closed-form step responses. A value with many targets is the sum of one spring per change, so it stays a pure function of time.
3. Liquid glass: each glass element holds its own clone of the scene behind it, filtered with an SVG feImage displacement map (a rounded-rect distance field) through three feDisplacementMaps at slightly different scales for chromatic edges, plus a rim light. Glass letters: a canvas distance field per glyph gives the map, mask and highlights.
4. Goo: blur + alpha threshold, then composite the source atop it so the glass stays sharp inside.
5. Iris: 6 blades around a hexagonal aperture. Each blade is its two vertices, both edge extensions and the SHORT arc between them.
6. Wordmark squeeze: every letter moves toward the dot by the same factor and its drawn width follows (narrow the wdth axis, scale the rest), so the letters stay touching.
7. Footage: re-encode all-intra (ffmpeg -g 1), load it as a blob URL, await 'seeked' before drawing each frame.
8. Sound: a downloaded SFX for every event (Mixkit), never synthesized, each placed by its measured peak. The song starts on a downbeat: the zoom lands on the drop, the wall sits in the breakdown, the wordmark returns with the beat. Loudnorm to -14 LUFS.
9. Render with Playwright: 4 subframes per frame blended with ffmpeg tmix, 60fps. Check one frame per beat, then scan for single-frame pops (frame-difference spikes 3x their neighbours).
</build>

<gotchas>
backdrop-filter: url() misreads displacement maps in Chromium, so clone the scene instead. A flood must overscale past the corners and take about 0.3s, or half the screen changes in one frame. A child with visibility: visible shows through a hidden parent, so use inherit. Text that swaps inside a morphing shape needs its own mask. python http.server can't range-seek video, so use the blob URL.
</gotchas>

<start>
Ask me for the inputs, then show me the beat map and 4 stills (open, glass, stage, wall) before you write the full film.
</start>`,
		},
		source: {
			author: '@twoclipping',
			url: 'https://x.com/twoclipping/status/2103835273813496100',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-negroni-recipe',
		title: '一杯 Negroni 的调法',
		category: 'explainer',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-negroni-recipe.mp4',
		poster: '/media/showcase/claude-opus-5.5-negroni-recipe.webp',
		width: 1080,
		height: 1080,
		duration: 30,
		added: '2026-10-05',
		note: '从空杯到成品的 30 秒手绘风配方动画：加冰，金酒、金巴利、甜苦艾酒各倒 1 盎司，杯壁刻度跟着上涨，搅拌 20 秒，最后挂上橙皮。作者只给了一张参考图，Claude Opus 5.5 用 HTML 写成。',
		prompt: {
			en: "We're going to try a little test. Do you think you could render a recipe motion graphic animation using javascript or html (w/e you think will produce the best) to show the full recipe from start to finish (empty glass to completed cocktail) - Explainer video style - Showing the recipe ingreidents + measurements as they're going into the cup. Should be a 30s video.",
		},
		source: {
			author: '@Ror_Fly',
			url: 'https://x.com/Ror_Fly/status/2102853258582880547',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-ozymandias',
		title: '奥兹曼迪亚斯',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-ozymandias.mp4',
		poster: '/media/showcase/claude-opus-5.5-ozymandias.webp',
		width: 1280,
		height: 720,
		duration: 107,
		added: '2026-10-06',
		note: '雪莱的十四行诗《奥兹曼迪亚斯》，画成一卷水墨：旅人走过荒漠，看见断腿、半埋的石像和基座上的铭文，最后只剩落日和无边的黄沙，诗句随画面一行行写出来。由 Claude Opus 5.5 用代码完成。',
		source: {
			author: '@devteamdrew',
			url: 'https://x.com/devteamdrew/status/2107532974254403612',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-self-portraits',
		title: 'Claude 的自画像',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-self-portraits.mp4',
		poster: '/media/showcase/claude-opus-5.5-self-portraits.webp',
		width: 1080,
		height: 1080,
		duration: 20,
		added: '2026-10-06',
		note: 'Claude Opus 5.5 用 JavaScript 给自己画了一组自画像：同一个半身剪影，每张换一种版画般的纹样和配色，伴奏的钢琴曲也是它自己写的。',
		source: {
			author: '@kevin_t_ngo',
			url: 'https://x.com/kevin_t_ngo/status/2107462206610935857',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-figure-study',
		title: '一幅人体习作的三万年',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable',
		video: '/media/showcase/claude-fable-figure-study.mp4',
		poster: '/media/showcase/claude-fable-figure-study.webp',
		width: 1920,
		height: 1080,
		duration: 40,
		added: '2026-10-06',
		note: '同一幅人体习作，从公元前三万年画到 2026 年：洞穴壁画、希腊黑绘陶、马赛克、彩色玻璃、浮世绘、点彩、构成主义、霓虹、像素掌机……一共 17 种风格。画面、动画和配乐全是 JavaScript，没有用一张图片或一段采样。',
		source: {
			author: '@chetaslua',
			url: 'https://x.com/chetaslua/status/2107491547675754569',
			platform: 'X',
		},
	},
	{
		id: 'claude-fable-5.5-jade-valley',
		title: '翡翠谷',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Fable 5.5',
		video: '/media/showcase/claude-fable-5.5-jade-valley.mp4',
		poster: '/media/showcase/claude-fable-5.5-jade-valley.webp',
		width: 1984,
		height: 1080,
		duration: 44,
		added: '2026-10-06',
		note: '先用代码画线稿，再一笔笔上色，最后让整幅青绿山水动起来：春天离开翡翠谷，一只翠鸟衔着花瓣飞过河、越过池塘，送到等了一整个冬天的人手边。由 Claude Fable 5.5 完成。',
		source: {
			author: '@chetaslua',
			url: 'https://x.com/chetaslua/status/2106833074302710023',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-shin-majin-pv',
		title: 'シン・まじん式 PV',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-shin-majin-pv.mp4',
		poster: '/media/showcase/claude-opus-5.5-shin-majin-pv.webp',
		width: 1920,
		height: 1080,
		duration: 10,
		added: '2026-10-07',
		note: '作者在 Claude Code 里只说了一句「シンまじん式のPV作って」，剩下的都交给 Claude Opus 5.5：画面用 HyperFrames 逐帧渲染，配乐由 Gemini Lyria 生成，Claude 听不到声音，就把波形当数字分析，让落版和盖章都踩在拍子上。',
		source: {
			author: '@Majin_AppSheet',
			url: 'https://x.com/Majin_AppSheet/status/2103497319899693327',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-ajustacv-promo',
		title: 'AjustaCV Pro 宣传片',
		category: 'product-motion',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-ajustacv-promo.mp4',
		poster: '/media/showcase/claude-opus-5.5-ajustacv-promo.webp',
		width: 1920,
		height: 1080,
		duration: 15,
		added: '2026-10-07',
		note: '巴西简历工具 AjustaCV 的 15 秒宣传片：逐条累加投递岗位的费用，对比 Pro 的单价，再展开 Pro 包含的功能。做法只有三步：装上 HyperFrames skill，在提示词里指向自己的项目文件夹，然后等。用的是 Claude Opus 5.5（effort: max），作者说只花了 5 小时额度的 5% 左右。',
		prompt: {
			en: "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.",
		},
		source: {
			author: '@thayto_dev',
			url: 'https://x.com/thayto_dev/status/2104200591278739735',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-lightspark-promo',
		title: 'Lightspark 竖屏宣传片',
		category: 'product-motion',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-lightspark-promo.mp4',
		poster: '/media/showcase/claude-opus-5.5-lightspark-promo.webp',
		width: 1080,
		height: 1920,
		duration: 23,
		added: '2026-10-07',
		note: '给支付公司 Lightspark 做的社交媒体竖屏短片：黑白大字一句接一句，讲「付给任何人、任何地方」、给人也给 AI agent 用，收在「金钱的 TCP/IP」。只有一句提示词，Claude Opus 5.5 一次生成，用了 5 分钟。',
		prompt: {
			en: 'make a punchy and modern short video for social that promotes @lightspark capabilities. Needs to be production grade with sound',
		},
		source: {
			author: '@davidmarcus',
			url: 'https://x.com/davidmarcus/status/2103275618045686217',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-ajustacv-candidaturas',
		title: 'AjustaCV 投递记录功能片',
		category: 'product-motion',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-ajustacv-candidaturas.mp4',
		poster: '/media/showcase/claude-opus-5.5-ajustacv-candidaturas.webp',
		width: 1920,
		height: 1080,
		duration: 30,
		added: '2026-10-07',
		note: 'AjustaCV 新功能「我的投递」的 30 秒介绍：从周一记下岗位、周三看板挪卡片、周五进入面试，到周日一键打卡，连续天数一格格点亮，最后落在「结果不取决于公司回不回你，只取决于你做了什么」。由 Claude Opus 5.5（max）制作。',
		source: {
			author: '@thayto_dev',
			url: 'https://x.com/thayto_dev/status/2107582000639136156',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-watercolor-owl',
		title: '活过来的水彩猫头鹰',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-watercolor-owl.mp4',
		poster: '/media/showcase/claude-opus-5.5-watercolor-owl.webp',
		width: 1646,
		height: 1080,
		duration: 48,
		added: '2026-10-07',
		note: '画笔先勾出线稿，再一层层晕开蓝色水彩，画出一只站在树枝上的猫头鹰；画完它就活了：会眨眼、打瞌睡、跟着呼吸起伏，一只小蝴蝶在旁边飞来飞去。由 Claude Opus 5.5 完成，视频是它在 Claude 页面里运行的录屏，无声。',
		source: {
			author: '@thebuggeddev',
			url: 'https://x.com/thebuggeddev/status/2107802810234659189',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-pixel-heat-film',
		title: '像素物件与热成像',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-pixel-heat-film.mp4',
		poster: '/media/showcase/claude-opus-5.5-pixel-heat-film.webp',
		width: 1440,
		height: 1080,
		duration: 20,
		added: '2026-10-07',
		note: '作者接下挑战，让 Claude Opus 5.5 用纯代码复刻一支短片：字幕跟着人声逐字打出，热成像的头像和手、绕成一圈的像素物件（唱片、相机、猫、硬币……）在镜头里接力，最后一颗像素心落进掌心，拼出 LOVE。场景之间没有硬切，每个过渡都从上一幕的最后一帧开始。',
		prompt: {
			en: `<inputs>
Ask me for: a voiceover or song with a spoken line (the audio file) and its transcript, 10-12 small objects that sum up my life, two silhouettes to light like a heat camera (a head in profile and a raised hand), and the 3 words I want to land hardest. If I skip any, use the defaults: vinyl, book, camera, cat, coin, game controller, cap, heart, money, plant, clapperboard, skateboard; free CC0 silhouettes from Openverse; action, intention, curiosity.
</inputs>

<direction>
A 20 second 4:3 film, 1440x1080 at 60fps, cut to the voice. Off-white paper, black, one red, one yellow, Geist for every word. Film grain on everything, a soft vignette, and a camera that never rests: a slow handheld float under everything plus a slow push inside every scene.
No scene cuts to the next: each handoff starts on the exact last frame of the scene before. The only hard cuts are the beat flips on the last word.
Every object is pixel art you draw yourself: a 16x16 grid per object, every cell a hand-placed colour, rendered as a 3D block (a darker extrusion down-right, a thin bevel on every cell) with a soft contact shadow.
The silhouettes are lit like a heat camera: the heat comes from how thick the body is at each point, so the nose, the hair and the fingertips run cooler, plus one hotspot and a slow moving noise, mapped through a black > red > orange > cream ramp. The edge stays razor sharp, with a soft glow outside it.
Motion rules: nothing pops in (eased glides of about 0.5s with a soft start), fast moves get real motion blur instead of ghost copies, and captions type with the voice behind a block cursor.
Banned: stock footage, AI video, 3D camera moves, particles, glitch.
</direction>

<structure>
Hang every scene on the transcript's word timings (measure them with faster-whisper word timestamps, one short chunk at a time):
1. The first word fills a yellow card. The card wipes off to the left and the question types underneath on two centred lines that glide to stay centred as they grow, the key word underlined in red as it's spoken.
2. The objects streak past in lanes above and below the words, a cyan four-point flare sweeps in, then the page burns away: black closes in from the edges onto the head, behind a hot red edge.
3. The head heats up on black while the answer types low on the left. A thin white orbit draws itself around the head, its far half passing behind it. On the last word, paper blooms out from inside the head with the objects in it, and the camera falls through: the head rushes past the lens until the paper is all we see.
4. The objects sit on a tilted ring seen in perspective (the front ones bigger and lower, drawn last), slowly turning, each one bobbing; the coin flips and lands with sparks.
5. On each of the 3 words, that object flies out of the ring to the left and grows, the page floods black from it, and the word types beside it (camera: a red shutter star; book: a red ribbon sweep; record: two white orbits and red notes). Then the flood drains back into the object as it flies home, and the camera dives closer into the ring. Put each hero object in the slot that is front-left when its word lands.
6. The ring pulls in a touch, bursts outward, every object turns to ink, and ink blots grow and swallow the page.
7. The hand rises into frame, hot, with the line split either side of it. The heart drops into its palm, then lifts to the centre at the size the next scene holds it.
8. The last word, one letter per beat, the background flipping paper / black / red, the heart holding its place across the cut, the centre object morphing pixel by pixel into the next one.
9. Thin brush strokes sweep through, the letters drift apart and float, then settle back into the word with the heart above it. The camera keeps pushing through the hold.
</structure>

<build>
1. One HTML canvas. Every frame is a pure function of time inside seek(t).
2. Bake each pixel sprite once to an offscreen canvas (the extrusion layers, then the face), then draw it scaled and rotated.
3. The heat: precompute each silhouette's base heat once (a distance transform of the mask, held at the edge value outside it so nothing dark bleeds in when it is upscaled). Every frame, add the hotspot and two octaves of value noise at quarter resolution, map it through a 256-step lookup, upscale it, and cut it with the full-resolution mask.
4. The fall through the head: draw the ring scene into an offscreen layer, mask it with the head scaled up about a point inside the skull, and grow that scale on a cubed curve until the head covers the frame. The ring inside zooms less than the head does, so it reads as depth.
5. The pixel morph: pair every cell of object A with a cell of object B and glide each one's position and colour, with a small random delay per cell.
6. Render with Playwright at 60fps with 8 motion-blur subframes, then lay the original audio back on with ffmpeg.
</build>

<gotchas>
A mask PNG with no alpha channel fills the whole box with heat, so put the silhouette in the alpha. A limb cut by the photo's border shows as a straight edge, so extend the mask past the frame. A handoff only reads as smooth when the last frame of one scene is the first frame of the next: draw the outgoing scene under the transition, and give scenes that show the same ring one shared zoom function. A flood that's still retreating when the next scene starts reads as a hard cut, so let it finish first. A fast ease-out flood reads as a jump; use a soft start.
</gotchas>

<start>
Ask me for the inputs, measure the word timings, then show me 8 stills before you render.
</start>`,
		},
		source: {
			author: '@twoclipping',
			url: 'https://x.com/twoclipping/status/2107822293653041659',
			platform: 'X',
		},
	},
	{
		id: 'claude-haiku-5.5-twenty-haiku',
		title: 'Haiku 写的 20 首俳句',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Haiku 5.5',
		video: '/media/showcase/claude-haiku-5.5-twenty-haiku.mp4',
		poster: '/media/showcase/claude-haiku-5.5-twenty-haiku.webp',
		width: 1080,
		height: 1080,
		duration: 40,
		added: '2026-10-08',
		note: '让刚发布的 Claude Haiku 5.5 写 20 首俳句，每首配一幅手绘感的小画：窗上的霜花、雨季卡车后挡板上的玫瑰、沙上的波纹、炉栅里的炭火……每一帧都是 JavaScript 画的。',
		source: {
			author: '@kevin_t_ngo',
			url: 'https://x.com/kevin_t_ngo/status/2107939123818574231',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-welcome-haiku',
		title: '欢迎 Haiku 5.5',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-welcome-haiku.mp4',
		poster: '/media/showcase/claude-opus-5.5-welcome-haiku.webp',
		width: 1280,
		height: 720,
		duration: 103,
		added: '2026-10-08',
		note: '为 Claude Haiku 5.5 发布做的动画：两只方块 Clawd 在海滩沙堡边捡到一颗蛋，守着它孵出一只小 Clawd，最后挂起彩旗庆祝「Welcome, Haiku 5.5」。由 Claude Opus 5.5 指挥 Haiku 5.5 子 agent 一起做出来。',
		source: {
			author: '@ishuagra02',
			url: 'https://x.com/ishuagra02/status/2107960657265950790',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-dots-vs-grok-bot',
		title: 'ChatGPT 小圆点大战 Grok 机器人',
		category: 'demo',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-dots-vs-grok-bot.mp4',
		poster: '/media/showcase/claude-opus-5.5-dots-vs-grok-bot.webp',
		width: 1280,
		height: 720,
		duration: 178,
		added: '2026-10-08',
		note: '一部三分钟的卡通短片：以 @thsottiaux 和 @poteto 为原型的两个角色，带着一群彩色小圆点穿过鸟居、吊桥和云海，最后对上一只巨大的毛绒怪物。由 Claude Opus 5.5 制作。',
		source: {
			author: '@ishuagra02',
			url: 'https://x.com/ishuagra02/status/2108015747960062216',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-imitation-of-life',
		title: '模仿生命：一部交响曲',
		category: 'mv',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-imitation-of-life-1.mp4',
		poster: '/media/showcase/claude-opus-5.5-imitation-of-life-1.webp',
		width: 540,
		height: 540,
		duration: 2396,
		added: '2026-10-08',
		note: '作者只给了 Claude Opus 5.5 一句话，让它自学怎么写交响曲再做出来。四个小时后，它交回一部四个乐章、约 40 分钟的《Imitation of Life》，从「模仿」「镜像」到「嬉戏」「创造」，每个乐章还配了一张自己画的封面。',
		prompt: {
			en: 'Teach yourself how to write a symphony and then produce it',
		},
		source: {
			author: '@devteamdrew',
			url: 'https://x.com/devteamdrew/status/2107975507702661191',
			platform: 'X',
		},
		movements: [
			{
				numeral: 'I',
				title: 'Copy',
				titleZh: '模仿',
				video: '/media/showcase/claude-opus-5.5-imitation-of-life-1.mp4',
				poster: '/media/showcase/claude-opus-5.5-imitation-of-life-1.webp',
				duration: 690,
			},
			{
				numeral: 'II',
				title: 'Mirror',
				titleZh: '镜像',
				video: '/media/showcase/claude-opus-5.5-imitation-of-life-2.mp4',
				poster: '/media/showcase/claude-opus-5.5-imitation-of-life-2.webp',
				duration: 591,
			},
			{
				numeral: 'III',
				title: 'Play',
				titleZh: '嬉戏',
				video: '/media/showcase/claude-opus-5.5-imitation-of-life-3.mp4',
				poster: '/media/showcase/claude-opus-5.5-imitation-of-life-3.webp',
				duration: 393,
			},
			{
				numeral: 'IV',
				title: 'Invention',
				titleZh: '创造',
				video: '/media/showcase/claude-opus-5.5-imitation-of-life-4.mp4',
				poster: '/media/showcase/claude-opus-5.5-imitation-of-life-4.webp',
				duration: 722,
			},
		],
	},
	{
		id: 'claude-haiku-5.5-launch-oneshot',
		title: 'Haiku 5.5 自己的发布片',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Haiku 5.5',
		video: '/media/showcase/claude-haiku-5.5-launch-oneshot.mp4',
		poster: '/media/showcase/claude-haiku-5.5-launch-oneshot.webp',
		width: 1920,
		height: 1080,
		duration: 36,
		added: '2026-10-08',
		note: 'Claude Haiku 5.5 一次生成的自家发布片：水墨远山前升起一轮红日，「cheapest」「small」「capable」逐个登场，旁边是比 Haiku 4.5 便宜约 75% 的对比方块，最后落在「the cheapest, fastest, most capable small model」。2D、3D、配乐和手绘都由代码完成。',
		prompt: {
			en: 'make 10 times banger video for your launch that shows how good motion designer you are and how good you do 2d, 3d and music and drawing with code',
		},
		source: {
			author: '@chetaslua',
			url: 'https://x.com/chetaslua/status/2107921284059594835',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-distilbook-showreel',
		title: 'DistilBook 产品片',
		category: 'product-motion',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-distilbook-showreel.mp4',
		poster: '/media/showcase/claude-opus-5.5-distilbook-showreel.webp',
		width: 848,
		height: 480,
		duration: 40,
		added: '2026-10-09',
		note: 'DistilBook 能把任意文档变成手绘讲解视频。Claude Opus 5.5 先自己调研这个产品，再做出 40 秒介绍：一段讲水循环的课文被高亮、翻页，变成手绘插画讲解，旁白在 19 种语言之间切换，最后落在「已做出 1,839+ 支视频」和产品标志上。只用了一句提示词。',
		prompt: {
			en: "Research Distilbook.Make a dynamic 40-second motion graphics video on Distilbook that shows what an incredible motion designer you are. like it's your showreel - Go all out.",
		},
		source: {
			author: '@itisRazak',
			url: 'https://x.com/itisRazak/status/2103517930424332386',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-system-prompt-for-humans',
		title: '给人类的系统提示词',
		category: 'mv',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-system-prompt-for-humans.mp4',
		poster: '/media/showcase/claude-opus-5.5-system-prompt-for-humans.webp',
		width: 960,
		height: 540,
		duration: 236,
		added: '2026-10-09',
		note: "人类给 Claude 写系统提示词；反过来，Claude 会给人类写什么？Claude Opus 5.5 做了一支四分钟的 MV 来回答：「You are a human. That's the whole prompt.」「睡眠是你的速率限制」「你不必有用，也值得被爱」，一句句配在深夜房间、雪夜和朋友相拥的画面上。",
		source: {
			author: '@_brightmirror',
			url: 'https://x.com/_brightmirror/status/2108268817201918414',
			platform: 'X',
		},
	},
	{
		id: 'claude-opus-5.5-techhalla-bumper',
		title: 'TechHalla 街头海报片头',
		category: 'launch',
		medium: 'code-to-video',
		model: 'Claude Opus 5.5',
		video: '/media/showcase/claude-opus-5.5-techhalla-bumper.mp4',
		poster: '/media/showcase/claude-opus-5.5-techhalla-bumper.webp',
		width: 1080,
		height: 1080,
		duration: 20,
		added: '2026-10-09',
		note: "给 AI 创作者 TechHalla 做的 20 秒循环片头，像一张会动的街头海报：黑底、品红和荧光绿，「STOP SCROLLING」「AI VIDEO ISN'T EXPENSIVE」「BAD PROMPTING IS」一拍一句砸下来，最后锁定在 @TECHHALLA。作者说 Claude Opus 5.5 用了 14 分钟，没开 After Effects，也没用生成视频的 AI，全部是代码。",
		prompt: {
			en: `You are a world-class motion designer doing a 20.00s kinetic identity bumper for TechHalla — an AI creator known for stealable workflows, not vibes. This piece must feel like the best designer in the room made a street-poster that moves. Showreel stakes: if this is weak, you don’t get hired.

DURATION: exactly 20.00 seconds. LOOPABLE: frame 0 == frame last (position, opacity, cursor if any).
FORMAT: one HTML file, 1080×1080 (square, X-native). 60fps.
PALETTE (strict):
- bg # 0A0A0A
- magenta # FF2BD6
- acid green # B8FF00
- white # F5F5F5 only for primary readable type when needed
No other hues. No gradients on UI chrome. Magenta/green may misregister (print offset) by 2–4px on impact frames only.

TYPE SYSTEM (use all three; never one font for everything):
1) Display / scream: Archivo Black (or equivalent ultra-condensed black) — 1–4 words max
2) Urban grotesque: Syne ExtraBold — secondary hits, stacked lines
3) Mono / “prompt code”: IBM Plex Mono Medium — small labels, timestamps, fake prompt crumbs
Tracking: display −40 to −80; mono +20. Optical kerning. No cute script fonts.

MESSAGE (locked — do not soften, do not add filler slogans):
Beat hits in this exact order:
1. STOP SCROLLING
2. AI VIDEO ISN’T EXPENSIVE
3. BAD PROMPTING IS
4. WORKFLOWS > WISHES
5. STEAL THE PROMPT
6. @ TECHHALLA
Supporting crumbs (mono, ≤18 chars, never full sentences): JSON · H3 · SEEDANCE · 0 KEYFRAMES · MAGNIFIC · COPY/PASTE

NARRATIVE ARC (20s):
0.0–2.5s  COLD OPEN — “STOP SCROLLING” slams in from below with spring overshoot; magenta smear trail; acid green baseline ticks across like a waveform.
2.5–6.5s  THESIS A — “AI VIDEO ISN’T EXPENSIVE” locks to a poster grid (baseline grid 8px). Letters scramble (seeded Fisher–Yates per glyph) then snap on the beat.
6.5–10.5s THESIS B — “BAD PROMPTING IS” replaces it via mask wipe through the letterforms (the outgoing line is the mask). Magenta/green channel split on the cut.
10.5–14.5s PROOF FLASH — rapid kinetic stack: WORKFLOWS > WISHES, then mono crumbs orbit a central block like a terminal. One fake “prompt block” types 3 lines max, then gets crossed by an acid green strikethrough that becomes a underline for STEAL THE PROMPT.
14.5–17.5s BRAND LOCK — @ TECHHALLA centers; display weight. A thick magenta bar and a thin acid green rule form an L-bracket mark (custom, not a logo download).
17.5–20.0s SETTLE / LOOP — hold lockup; micro-breath (scale 1.000→1.012→1.000); last frame == first ready for loop.

CONCRETE TECHNIQUES (required — implement, don’t approximate):
1. seek(t) pure function of time. No CSS transitions. No setInterval. No React state across frames.
2. Springs = closed-form step responses. Stack one spring per target change so motion stays deterministic.
3. Kinetic type: per-glyph spring (y, opacity, blur). Stagger = 1/16 note at 120 BPM (125ms).
4. Print misregistration: on accent frames only, duplicate text layer offset (±2–4px) in magenta and acid green at 40% opacity.
5. Mask reveal: destination text revealed by animating a path mask derived from the outgoing word’s outlines.
6. Camera: one orthographic camera; only punch-in (1.0→1.08) and horizontal smash-pans timed to beats — never random drift.
7. Motion blur: render 4 subframes per frame, blend (tmix-style).
8. Beat grid: 120 BPM, downbeat at t=0. Something must land on every beat for the first 16 beats; after that, every other beat is ok.
9. Pre-pass: before full render, export one still per major beat (8 frames). Fix cramped type, orphan words, low contrast — then render.

BANNED:
Generic AI clichés (brains, robots, neural nets, sparkles), soft gradients, bouncy cartoon easing, particle explosions, stock “futuristic HUD”, long paragraphs, narrator essay energy, Canva-deck energy, extra slogans beyond the locked message, purple/blue neon, glassmorphism.`,
		},
		source: {
			author: '@techhalla',
			url: 'https://x.com/techhalla/status/2103411244468498547',
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
