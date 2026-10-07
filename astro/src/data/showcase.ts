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
