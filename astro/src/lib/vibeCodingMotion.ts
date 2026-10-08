// 动效图鉴：每个动效一块可调的舞台。页面以演示为主，文字只留一句说明和一条坑。
// 控件改动后，舞台重播，「跟 AI 这么说」按 prompt 模板实时改写。

export type MotionDemo =
	| 'duration'
	| 'easing'
	| 'spring'
	| 'reveal'
	| 'stagger'
	| 'parallax'
	| 'countup'
	| 'lift'
	| 'press'
	| 'magnetic'
	| 'spotlight'
	| 'tilt'
	| 'ripple'
	| 'like'
	| 'toggle'
	| 'loading'
	| 'shake'
	| 'focus'
	| 'typewriter'
	| 'textReveal'
	| 'marquee'
	| 'gradient'
	| 'expand'
	| 'pageTransition'
	| 'sharedElement'
	| 'scrolly'
	| 'copy'
	| 'cart'
	| 'drag'
	| 'swipe'
	| 'pull';

export interface MotionChoice {
	value: string;
	label: string;
	/** 写进说法里的措辞 */
	say: string;
}

export interface MotionControl {
	id: string;
	label: string;
	type: 'range' | 'choice';
	value: string | number;
	min?: number;
	max?: number;
	step?: number;
	/** px、ms（显示为毫秒）、s（数值是毫秒，显示为秒）、%（百分比）、deg（角度） */
	unit?: 'px' | 'ms' | 's' | '%' | 'deg';
	/** 数值为 0 时写进说法的措辞，比如间隔为 0 时是「同时出现」 */
	zeroSay?: string;
	/** 数值不为 0 时的措辞模板，{v} 会换成带单位的值 */
	say?: string;
	/** 按数值分档的措辞：取第一个 upTo 不小于当前值的档，{v} 会换成带单位的值 */
	levels?: { upTo: number; say: string }[];
	options?: MotionChoice[];
}

export interface MotionPreset {
	label: string;
	note: string;
	values: Record<string, string | number>;
}

export interface MotionProfile {
	demo: MotionDemo;
	/** 舞台下方的一句操作提示 */
	hint: string;
	controls: MotionControl[];
	presets: MotionPreset[];
	/** {控件 id} 会换成该控件当前的措辞 */
	prompt: string;
	warning: string;
}

const easeChoices: MotionChoice[] = [
	{ value: 'out', label: '先快后慢', say: '先快后慢（ease-out）' },
	{ value: 'inout', label: '慢快慢', say: '慢快慢（ease-in-out）' },
	{ value: 'linear', label: '匀速', say: '匀速（linear）' },
	{ value: 'back', label: '回弹', say: '结尾带一点回弹（back-out）' },
];

export const vibeCodingMotionProfiles: Record<string, MotionProfile> = {
	duration: {
		demo: 'duration',
		hint: '拖动时长，看同一个下拉菜单展开得快还是慢',
		controls: [
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 250,
				min: 50,
				max: 1200,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '利落', note: '按钮、开关', values: { dur: 150 } },
			{ label: '正常', note: '菜单、弹窗', values: { dur: 250 } },
			{ label: '从容', note: '大块内容进场', values: { dur: 500 } },
			{ label: '拖沓', note: '多半太慢了', values: { dur: 1000 } },
		],
		prompt: '这个下拉菜单展开和收起的动画时长改成 {dur}，其他动画不要动。',
		warning:
			'越大的东西可以动得越久，越常点的东西要动得越快。每天点几十次的按钮如果要等半秒，再好看也会让人烦。',
	},
	easing: {
		demo: 'easing',
		hint: '五个小球同时出发，时长一样，差别全在「手感」',
		controls: [
			{
				id: 'ease',
				label: '选一条',
				type: 'choice',
				value: 'out',
				options: [
					{ value: 'out', label: '先快后慢', say: 'ease-out（先快后慢，结尾慢慢停住）' },
					{ value: 'in', label: '先慢后快', say: 'ease-in（先慢后快，适合离场）' },
					{ value: 'inout', label: '慢快慢', say: 'ease-in-out（两头慢、中间快）' },
					{ value: 'linear', label: '匀速', say: 'linear（匀速）' },
					{ value: 'back', label: '回弹', say: 'back-out（冲过头一点再弹回来）' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 800,
				min: 300,
				max: 2000,
				step: 100,
				unit: 's',
			},
		],
		presets: [],
		prompt: '这个动画的缓动改用 {ease}，时长保持 {dur}。',
		warning:
			'进场用先快后慢、离场用先慢后快，基本不会错。匀速只适合一直转的加载圈和跑马灯，用在进场上会显得很机械。',
	},
	spring: {
		demo: 'spring',
		hint: '拖动回弹程度，看卡片弹出来时晃几下',
		controls: [
			{
				id: 'bounce',
				label: '回弹程度',
				type: 'range',
				value: 25,
				min: 0,
				max: 60,
				step: 5,
				unit: '%',
				levels: [
					{ upTo: 0, say: '不要回弹，干脆地停住' },
					{ upTo: 15, say: '几乎不回弹（回弹程度约 {v}）' },
					{ upTo: 30, say: '轻轻回弹一下（回弹程度约 {v}）' },
					{ upTo: 45, say: '明显回弹两三下（回弹程度约 {v}）' },
					{ upTo: 100, say: '夸张地来回弹几下（回弹程度约 {v}）' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 500,
				min: 200,
				max: 1200,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '稳重', note: '不回弹', values: { bounce: 0, dur: 450 } },
			{ label: '轻快', note: '轻轻弹一下', values: { bounce: 20, dur: 500 } },
			{ label: '俏皮', note: '明显弹几下', values: { bounce: 45, dur: 700 } },
		],
		prompt: '卡片出现时用弹簧动画（spring）：时长约 {dur}，{bounce}。',
		warning:
			'回弹适合「被你拉出来」的东西：弹窗、通知、拖拽松手。页面上的文字段落也弹来弹去，会显得轻浮。',
	},
	'reveal-on-scroll': {
		demo: 'reveal',
		hint: '在框里往下滚，或者点「重播」自动滚一遍',
		controls: [
			{
				id: 'kind',
				label: '怎么进来',
				type: 'choice',
				value: 'up',
				options: [
					{ value: 'up', label: '淡入上浮', say: '从下方 {dist} 淡入上浮' },
					{ value: 'fade', label: '只淡入', say: '原地淡入' },
					{ value: 'scale', label: '放大浮现', say: '从略小一点放大并淡入' },
					{ value: 'left', label: '从左滑入', say: '从左侧 {dist} 滑入并淡入' },
				],
			},
			{
				id: 'dist',
				label: '移动距离',
				type: 'range',
				value: 24,
				min: 8,
				max: 80,
				step: 4,
				unit: 'px',
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 600,
				min: 200,
				max: 1500,
				step: 50,
				unit: 's',
			},
			{ id: 'ease', label: '手感', type: 'choice', value: 'out', options: easeChoices },
		],
		presets: [
			{
				label: '克制优雅',
				note: '距离小、慢一点',
				values: { kind: 'up', dist: 16, dur: 800, ease: 'out' },
			},
			{
				label: '活泼',
				note: '快、带回弹',
				values: { kind: 'scale', dist: 24, dur: 450, ease: 'back' },
			},
			{
				label: '戏剧化',
				note: '距离大、慢',
				values: { kind: 'up', dist: 72, dur: 1200, ease: 'inout' },
			},
		],
		prompt: '卡片滚动进入视口时，{kind}，时长 {dur}，{ease}，只播一次。',
		warning:
			'不是每一块都要淡入。整页从头到尾都在浮现，看多了反而廉价；首屏内容也别等滚动，应该一打开就在。',
	},
	stagger: {
		demo: 'stagger',
		hint: '八个方块按顺序登场，改改间隔和顺序',
		controls: [
			{
				id: 'gap',
				label: '间隔',
				type: 'range',
				value: 60,
				min: 0,
				max: 300,
				step: 10,
				unit: 'ms',
				say: '每个间隔 {v}',
				zeroSay: '同时出现',
			},
			{
				id: 'order',
				label: '顺序',
				type: 'choice',
				value: 'seq',
				options: [
					{ value: 'seq', label: '从左到右', say: '从左到右、从上到下' },
					{ value: 'diag', label: '斜着铺开', say: '从左上角沿对角线铺开' },
					{ value: 'center', label: '从中间散开', say: '从中间向两边散开' },
					{ value: 'random', label: '随机', say: '随机顺序' },
				],
			},
			{
				id: 'dur',
				label: '每个时长',
				type: 'range',
				value: 450,
				min: 200,
				max: 1000,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '轻快', note: '间隔短', values: { gap: 40, order: 'seq', dur: 400 } },
			{ label: '舒展', note: '斜着铺开', values: { gap: 90, order: 'diag', dur: 600 } },
			{ label: '散开', note: '从中间往外', values: { gap: 70, order: 'center', dur: 500 } },
		],
		prompt: '这组卡片依次淡入上浮：{order}，{gap}，每个时长 {dur}。',
		warning:
			'间隔乘以个数，就是最后一个要等多久。二十个卡片每个间隔 100ms，最后一个要等两秒，用户早就滚走了，个数多时间隔要更短。',
	},
	parallax: {
		demo: 'parallax',
		hint: '在框里上下滚动，背景比内容走得慢',
		controls: [
			{
				id: 'speed',
				label: '背景速度',
				type: 'range',
				value: 40,
				min: 10,
				max: 90,
				step: 10,
				unit: '%',
			},
			{
				id: 'layers',
				label: '层数',
				type: 'choice',
				value: '2',
				options: [
					{ value: '2', label: '两层', say: '' },
					{ value: '3', label: '三层', say: '，中间再加一层以 {mid} 速度移动的中景' },
				],
			},
		],
		presets: [
			{ label: '轻微', note: '几乎察觉不到', values: { speed: 70, layers: '2' } },
			{ label: '明显', note: '景深感', values: { speed: 40, layers: '3' } },
			{ label: '夸张', note: '背景几乎不动', values: { speed: 10, layers: '3' } },
		],
		prompt: '首屏做视差滚动：内容正常滚动，背景图以滚动速度的 {speed} 移动{layers}。',
		warning:
			'视差在手机上最容易卡顿，也最容易让人头晕。只在首屏这类大图区域用一处就够了，并且在系统开启「减少动态效果」时关掉。',
	},
	'count-up': {
		demo: 'countup',
		hint: '点「重播」，数字从 0 滚到目标值',
		controls: [
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 1500,
				min: 500,
				max: 3000,
				step: 100,
				unit: 's',
			},
			{
				id: 'ease',
				label: '手感',
				type: 'choice',
				value: 'out',
				options: [
					{ value: 'out', label: '先快后慢', say: '先快后慢，快到终点时放慢' },
					{ value: 'linear', label: '匀速', say: '匀速' },
				],
			},
			{
				id: 'sep',
				label: '千分位',
				type: 'choice',
				value: 'yes',
				options: [
					{ value: 'yes', label: '加逗号', say: '数字带千分位逗号' },
					{ value: 'no', label: '不加', say: '数字不加千分位' },
				],
			},
		],
		presets: [],
		prompt: '这几个统计数字进入视口时从 0 滚动到目标值，时长 {dur}，{ease}，{sep}，只播一次。',
		warning:
			'滚动期间数字宽度会变，整行跟着抖。让 AI 给数字用等宽数字（tabular-nums），并且先占好最终宽度。',
	},
	'hover-lift': {
		demo: 'lift',
		hint: '把鼠标移到卡片上试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'lift',
				label: '浮起高度',
				type: 'range',
				value: 6,
				min: 2,
				max: 16,
				step: 1,
				unit: 'px',
			},
			{
				id: 'shadow',
				label: '阴影',
				type: 'choice',
				value: 'soft',
				options: [
					{ value: 'none', label: '不变', say: '阴影不变' },
					{ value: 'soft', label: '稍微加深', say: '阴影稍微加深' },
					{ value: 'strong', label: '明显加深', say: '阴影明显加深，像被托起来' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 200,
				min: 100,
				max: 500,
				step: 25,
				unit: 's',
			},
			{ id: 'ease', label: '手感', type: 'choice', value: 'out', options: easeChoices },
		],
		presets: [
			{
				label: '克制',
				note: '轻轻一抬',
				values: { lift: 4, shadow: 'soft', dur: 200, ease: 'out' },
			},
			{
				label: '明显',
				note: '托起来',
				values: { lift: 10, shadow: 'strong', dur: 250, ease: 'out' },
			},
			{
				label: '俏皮',
				note: '带回弹',
				values: { lift: 8, shadow: 'soft', dur: 350, ease: 'back' },
			},
		],
		prompt:
			'鼠标移到卡片上时，卡片上浮 {lift}，{shadow}，过渡 {dur}，{ease}；移开时恢复原样。手机上没有悬停，不做这个效果。',
		warning:
			'只给能点的东西加悬停浮起。不能点的卡片也浮起来，用户会以为点了能进去，结果点了没反应。',
	},
	press: {
		demo: 'press',
		hint: '按住按钮试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'scale',
				label: '按下缩到',
				type: 'range',
				value: 96,
				min: 88,
				max: 99,
				step: 1,
				unit: '%',
			},
			{
				id: 'back',
				label: '松开时',
				type: 'choice',
				value: 'plain',
				options: [
					{ value: 'plain', label: '直接复原', say: '平滑恢复原大小' },
					{ value: 'spring', label: '回弹', say: '轻轻回弹到原大小' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 120,
				min: 60,
				max: 300,
				step: 20,
				unit: 's',
			},
		],
		presets: [
			{ label: '细腻', note: '几乎察觉不到', values: { scale: 98, back: 'plain', dur: 100 } },
			{ label: '扎实', note: '按下去有分量', values: { scale: 95, back: 'plain', dur: 120 } },
			{ label: 'Q 弹', note: '松手弹一下', values: { scale: 92, back: 'spring', dur: 220 } },
		],
		prompt: '按钮按下时缩小到原来的 {scale}，松开后{back}，过渡 {dur}。手机上触摸按下时同样生效。',
		warning:
			'缩得太多会像按钮坏了。96% 左右就能感觉到「按下去了」，主按钮可以多一点，列表里的小按钮少一点。',
	},
	'magnetic-button': {
		demo: 'magnetic',
		hint: '把鼠标慢慢靠近按钮；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'range',
				label: '吸附范围',
				type: 'range',
				value: 60,
				min: 20,
				max: 120,
				step: 10,
				unit: 'px',
			},
			{
				id: 'strength',
				label: '吸附力度',
				type: 'range',
				value: 30,
				min: 10,
				max: 60,
				step: 5,
				unit: '%',
			},
			{
				id: 'back',
				label: '离开时',
				type: 'choice',
				value: 'spring',
				options: [
					{ value: 'plain', label: '平滑回位', say: '平滑' },
					{ value: 'spring', label: '弹回原位', say: '带一点回弹' },
				],
			},
		],
		presets: [
			{ label: '若有若无', note: '轻轻一吸', values: { range: 40, strength: 15, back: 'plain' } },
			{ label: '明显', note: '跟着走', values: { range: 70, strength: 35, back: 'spring' } },
			{ label: '黏人', note: '吸得很紧', values: { range: 110, strength: 55, back: 'spring' } },
		],
		prompt:
			'鼠标靠近按钮 {range} 以内时，按钮朝鼠标方向移动，位移约为鼠标偏移的 {strength}；鼠标离开后{back}地回到原位。手机上不做这个效果。',
		warning:
			'磁吸只适合页面上最重要的那一两个按钮。到处都在吸，鼠标像被拽来拽去，点个按钮都要对半天准。',
	},
	'cursor-spotlight': {
		demo: 'spotlight',
		hint: '在卡片上移动鼠标；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'size',
				label: '光圈大小',
				type: 'range',
				value: 240,
				min: 120,
				max: 420,
				step: 20,
				unit: 'px',
			},
			{
				id: 'strength',
				label: '亮度',
				type: 'range',
				value: 26,
				min: 6,
				max: 40,
				step: 2,
				unit: '%',
			},
			{
				id: 'border',
				label: '边框',
				type: 'choice',
				value: 'yes',
				options: [
					{ value: 'yes', label: '跟着亮', say: '，卡片边框靠近光的地方也跟着变亮' },
					{ value: 'no', label: '不变', say: '' },
				],
			},
		],
		presets: [
			{ label: '柔和', note: '大而淡', values: { size: 360, strength: 12, border: 'no' } },
			{ label: '聚光', note: '小而亮', values: { size: 160, strength: 32, border: 'yes' } },
		],
		prompt:
			'鼠标在卡片上移动时，一团直径约 {size} 的柔光跟着鼠标走，强度约 {strength}{border}；鼠标离开时光慢慢淡出。手机上不做这个效果。',
		warning:
			'光效是点缀，不能盖住文字。浅色背景上光要淡，深色背景上效果才明显；整页的卡片一起发光，就成了霓虹灯。',
	},
	tilt: {
		demo: 'tilt',
		hint: '在卡片上移动鼠标；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'angle',
				label: '最大角度',
				type: 'range',
				value: 10,
				min: 2,
				max: 24,
				step: 1,
				unit: 'deg',
			},
			{
				id: 'glare',
				label: '反光',
				type: 'choice',
				value: 'yes',
				options: [
					{ value: 'yes', label: '有', say: '，表面有一道跟着倾斜方向移动的反光' },
					{ value: 'no', label: '没有', say: '' },
				],
			},
			{
				id: 'dur',
				label: '回正时长',
				type: 'range',
				value: 400,
				min: 150,
				max: 1000,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '轻微', note: '若有若无', values: { angle: 4, glare: 'no', dur: 300 } },
			{ label: '卡片感', note: '像拿在手里', values: { angle: 10, glare: 'yes', dur: 400 } },
			{ label: '夸张', note: '角度很大', values: { angle: 20, glare: 'yes', dur: 600 } },
		],
		prompt:
			'鼠标在卡片上移动时，卡片朝鼠标方向做 3D 倾斜，最大 {angle}{glare}；鼠标离开后在 {dur}内平滑回正。手机上不做这个效果。',
		warning:
			'倾斜角度一大，卡片上的字就会变形、难读。放文字的卡片控制在 10° 以内；会员卡、海报这种以图为主的才适合夸张一点。',
	},
	ripple: {
		demo: 'ripple',
		hint: '点一下按钮试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'origin',
				label: '从哪荡开',
				type: 'choice',
				value: 'point',
				options: [
					{ value: 'point', label: '点击的位置', say: '点击的位置' },
					{ value: 'center', label: '按钮中心', say: '按钮中心' },
				],
			},
			{
				id: 'alpha',
				label: '深浅',
				type: 'range',
				value: 30,
				min: 10,
				max: 50,
				step: 5,
				unit: '%',
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 550,
				min: 300,
				max: 1000,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '标准', note: 'Material 风格', values: { origin: 'point', alpha: 30, dur: 550 } },
			{ label: '轻柔', note: '淡而慢', values: { origin: 'point', alpha: 15, dur: 800 } },
			{ label: '居中', note: '从中间散开', values: { origin: 'center', alpha: 30, dur: 450 } },
		],
		prompt:
			'点击按钮时，从{origin}荡开一圈白色涟漪，透明度约 {alpha}，在 {dur}内扩散到盖满整个按钮并淡出。',
		warning:
			'涟漪要在按下的那一刻就开始，等松手才出现会显得迟钝。连续快速点击时，每次都要从新的位置重新荡开，不能排队播放。',
	},
	'like-burst': {
		demo: 'like',
		hint: '点一下心形试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'pop',
				label: '放大到',
				type: 'range',
				value: 130,
				min: 110,
				max: 170,
				step: 10,
				unit: '%',
			},
			{
				id: 'particles',
				label: '迸出小点',
				type: 'choice',
				value: 'few',
				options: [
					{ value: 'none', label: '不要', say: '' },
					{ value: 'few', label: '6 个', say: '，同时向四周迸出 6 个小圆点并淡出' },
					{ value: 'many', label: '12 个', say: '，同时向四周迸出 12 个小圆点并淡出' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 450,
				min: 250,
				max: 800,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '克制', note: '只跳一下', values: { pop: 120, particles: 'none', dur: 350 } },
			{ label: '开心', note: '带小点', values: { pop: 130, particles: 'few', dur: 450 } },
			{ label: '庆祝', note: '一大把', values: { pop: 160, particles: 'many', dur: 600 } },
		],
		prompt:
			'点击点赞按钮时，心形变成红色实心，先放大到 {pop} 再弹回原大小，时长 {dur}{particles}；点赞数同时加 1。取消点赞时直接变回空心，不播放动画。',
		warning:
			'只在「点亮」时庆祝，取消时安静地变回去。要是取消也来一遍爆炸动画，用户会以为自己又点赞了一次。',
	},
	'toggle-switch': {
		demo: 'toggle',
		hint: '点一下开关试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 200,
				min: 100,
				max: 500,
				step: 25,
				unit: 's',
			},
			{
				id: 'ease',
				label: '手感',
				type: 'choice',
				value: 'out',
				options: [
					{ value: 'out', label: '先快后慢', say: '先快后慢（ease-out）' },
					{ value: 'back', label: '回弹', say: '滑到头时轻轻回弹一下' },
				],
			},
			{
				id: 'stretch',
				label: '按住时',
				type: 'choice',
				value: 'yes',
				options: [
					{
						value: 'yes',
						label: '圆点拉长',
						say: '；按住开关时，圆点先横向拉长一点，松手再滑过去',
					},
					{ value: 'no', label: '不变', say: '' },
				],
			},
		],
		presets: [
			{ label: '干脆', note: '快、不拉伸', values: { dur: 150, ease: 'out', stretch: 'no' } },
			{ label: 'iOS 风', note: '按住会拉长', values: { dur: 250, ease: 'out', stretch: 'yes' } },
			{ label: '俏皮', note: '带回弹', values: { dur: 350, ease: 'back', stretch: 'yes' } },
		],
		prompt:
			'点击开关时，圆点在 {dur}内滑到另一侧，{ease}，开启时底色同时从灰色过渡到品牌色{stretch}。',
		warning:
			'开关的动画要短，0.2 秒左右就够。它是一个「立刻生效」的控件，动画拖太久，用户会怀疑设置到底改了没有。',
	},
	'loading-button': {
		demo: 'loading',
		hint: '点一下提交试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'waiting',
				label: '等待时',
				type: 'choice',
				value: 'spinner',
				options: [
					{ value: 'spinner', label: '转圈', say: '一个转圈的加载图标' },
					{ value: 'dots', label: '三个点', say: '三个依次跳动的小点' },
					{ value: 'text', label: '文字', say: '「提交中…」' },
				],
			},
			{
				id: 'shape',
				label: '按钮形状',
				type: 'choice',
				value: 'keep',
				options: [
					{ value: 'keep', label: '宽度不变', say: '宽度保持不变' },
					{ value: 'circle', label: '收成圆形', say: '平滑收窄成一个圆形' },
				],
			},
			{
				id: 'done',
				label: '成功后',
				type: 'choice',
				value: 'check',
				options: [
					{ value: 'check', label: '对勾', say: '显示一个对勾和「已提交」' },
					{ value: 'none', label: '直接复原', say: '直接恢复原样' },
				],
			},
		],
		presets: [],
		prompt:
			'点击提交按钮后，按钮立刻变成不可点击，文字换成{waiting}，按钮{shape}；请求成功后{done}，1.5 秒后恢复原样；请求失败时恢复原文字并提示错误。',
		warning:
			'加载状态最重要的作用是防止重复提交：按钮在等待时一定要不可点击。只换了个转圈图标、却还能再点，用户急起来连点三下，就提交了三次。',
	},
	'error-shake': {
		demo: 'shake',
		hint: '点一下登录试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{ id: 'amp', label: '幅度', type: 'range', value: 8, min: 4, max: 20, step: 2, unit: 'px' },
			{
				id: 'count',
				label: '次数',
				type: 'choice',
				value: '3',
				options: [
					{ value: '2', label: '2 下', say: '2' },
					{ value: '3', label: '3 下', say: '3' },
					{ value: '5', label: '5 下', say: '5' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 400,
				min: 200,
				max: 800,
				step: 50,
				unit: 's',
			},
		],
		presets: [
			{ label: '提醒', note: '轻轻两下', values: { amp: 6, count: '2', dur: 300 } },
			{ label: '标准', note: 'macOS 登录', values: { amp: 8, count: '3', dur: 400 } },
			{ label: '强烈', note: '幅度大', values: { amp: 16, count: '5', dur: 500 } },
		],
		prompt:
			'密码错误时，输入框左右抖动 {count} 下、幅度约 {amp}，时长 {dur}；边框同时变红，下方出现红色提示「密码不正确」。抖完保持红框，直到用户重新输入。',
		warning:
			'抖动只是吸引注意，真正告诉用户哪里错了的是那行红字。只抖不说原因，用户还是不知道该改什么。',
	},
	'input-focus': {
		demo: 'focus',
		hint: '点进输入框试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'label',
				label: '提示文字',
				type: 'choice',
				value: 'float',
				options: [
					{
						value: 'float',
						label: '浮到上方',
						say: '输入框里的提示文字缩小并浮到边框上方，变成标题',
					},
					{ value: 'hide', label: '直接消失', say: '输入框里的提示文字在开始输入时消失' },
				],
			},
			{
				id: 'ring',
				label: '边框',
				type: 'choice',
				value: 'ring',
				options: [
					{ value: 'color', label: '只变色', say: '' },
					{ value: 'ring', label: '变色 + 光晕', say: '，外面再加一圈淡淡的同色光晕' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 200,
				min: 100,
				max: 400,
				step: 25,
				unit: 's',
			},
		],
		presets: [
			{ label: '简洁', note: '只变色', values: { label: 'hide', ring: 'color', dur: 150 } },
			{
				label: '浮动标签',
				note: 'Material 风格',
				values: { label: 'float', ring: 'ring', dur: 200 },
			},
		],
		prompt:
			'点进输入框时，边框在 {dur}内变成品牌色{ring}；{label}。输入框为空且失去焦点时，恢复原样。',
		warning:
			'浮到上方的标签要一直留着，不能输入后就消失。用户填到一半回头检查时，还需要知道这个框是填什么的。',
	},
	scrollytelling: {
		demo: 'scrolly',
		hint: '在框里往下滚，或者点「重播」自动滚一遍',
		controls: [
			{
				id: 'swap',
				label: '换图方式',
				type: 'choice',
				value: 'fade',
				options: [
					{ value: 'fade', label: '淡入淡出', say: '淡入淡出地切换' },
					{ value: 'slide', label: '上下滑动', say: '向上滑动着切换' },
					{ value: 'cut', label: '直接切换', say: '直接切换' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 350,
				min: 150,
				max: 700,
				step: 50,
				unit: 's',
			},
		],
		presets: [],
		prompt:
			'做一个粘性滚动叙事：左边三段说明文字正常滚动，右边的手机截图固定不动（position: sticky）；每段文字滚到视口中间时，右边的截图{swap}成对应画面，时长 {dur}。手机上改成上下排列，每段文字下面直接放对应截图。',
		warning: '段落之间要留足滚动距离，至少大半屏。三段文字挤在一起，右边的图还没看清就被换掉了。',
	},
	'copy-feedback': {
		demo: 'copy',
		hint: '点一下复制试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'tip',
				label: '提示',
				type: 'choice',
				value: 'text',
				options: [
					{ value: 'icon', label: '只换图标', say: '' },
					{ value: 'text', label: '图标 + 文字', say: '，文字从「复制」变成「已复制」' },
					{
						value: 'bubble',
						label: '再加气泡',
						say: '，文字变成「已复制」，按钮上方再冒出一个「已复制到剪贴板」的小气泡',
					},
				],
			},
			{
				id: 'swap',
				label: '切换方式',
				type: 'choice',
				value: 'pop',
				options: [
					{ value: 'cut', label: '直接替换', say: '直接' },
					{ value: 'pop', label: '缩放淡入', say: '缩小淡出再放大淡入地' },
				],
			},
			{
				id: 'hold',
				label: '停留',
				type: 'range',
				value: 1500,
				min: 800,
				max: 3000,
				step: 100,
				unit: 's',
			},
		],
		presets: [],
		prompt: '点击「复制」后，把链接写入剪贴板，按钮里的图标{swap}换成对勾{tip}，{hold}后恢复原样。',
		warning:
			'一定要等复制真的成功了再显示「已复制」。浏览器不允许访问剪贴板时，要提示用户手动复制，而不是照样显示成功。',
	},
	'add-to-cart': {
		demo: 'cart',
		hint: '点一下加入购物车试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'dur',
				label: '飞行时长',
				type: 'range',
				value: 700,
				min: 400,
				max: 1200,
				step: 50,
				unit: 's',
			},
			{
				id: 'path',
				label: '路线',
				type: 'choice',
				value: 'arc',
				options: [
					{ value: 'arc', label: '弧线', say: '一条向上拱起的弧线' },
					{ value: 'line', label: '直线', say: '直线' },
				],
			},
			{
				id: 'bump',
				label: '到达时',
				type: 'choice',
				value: 'both',
				options: [
					{ value: 'count', label: '数字跳一下', say: '购物车上的数字加 1 并跳一下' },
					{ value: 'shake', label: '购物车晃一下', say: '购物车图标左右晃一下' },
					{ value: 'both', label: '都要', say: '购物车图标晃一下，数字加 1 并跳一下' },
				],
			},
		],
		presets: [],
		prompt:
			'点击「加入购物车」时，复制出一张商品小图，沿{path}飞到右上角的购物车图标，途中逐渐缩小、淡出，时长 {dur}；到达时{bump}。',
		warning:
			'飞行动画只是锦上添花，购物车数字必须以接口返回为准。动画播完了但请求失败，要把数字改回来并提示用户。',
	},
	typewriter: {
		demo: 'typewriter',
		hint: '标题会一直打字、换句；改参数立刻生效',
		controls: [
			{
				id: 'speed',
				label: '每个字',
				type: 'range',
				value: 90,
				min: 30,
				max: 250,
				step: 10,
				unit: 'ms',
			},
			{
				id: 'cursor',
				label: '光标',
				type: 'choice',
				value: 'bar',
				options: [
					{ value: 'bar', label: '竖线', say: '末尾跟着一条闪烁的竖线光标' },
					{ value: 'block', label: '方块', say: '末尾跟着一个闪烁的方块光标' },
					{ value: 'none', label: '不要', say: '不显示光标' },
				],
			},
			{
				id: 'loop',
				label: '打完后',
				type: 'choice',
				value: 'cycle',
				options: [
					{ value: 'stay', label: '停住', say: '打完后停住' },
					{
						value: 'cycle',
						label: '删掉换下一句',
						say: '打完停 1.5 秒，再逐字删掉，换下一句，三句轮流',
					},
				],
			},
		],
		presets: [
			{ label: '从容', note: '慢慢打', values: { speed: 140, cursor: 'bar', loop: 'cycle' } },
			{ label: '利落', note: '一口气打完', values: { speed: 50, cursor: 'bar', loop: 'stay' } },
			{ label: '终端风', note: '方块光标', values: { speed: 70, cursor: 'block', loop: 'cycle' } },
		],
		prompt:
			'首页标题后半句用打字机效果：一个字一个字打出来，每个字间隔 {speed}，{cursor}；{loop}。',
		warning:
			'打字机只适合短短一句。整段正文一个字一个字蹦出来，读者要干等；轮换的句子也别超过三四句。',
	},
	'text-reveal': {
		demo: 'textReveal',
		hint: '标题按字、按词或按行依次出现，改改单位和方式',
		controls: [
			{
				id: 'unit',
				label: '单位',
				type: 'choice',
				value: 'char',
				options: [
					{ value: 'char', label: '逐字', say: '一个字一个字地' },
					{ value: 'word', label: '逐词', say: '一个词一个词地' },
					{ value: 'line', label: '逐行', say: '一行一行地' },
				],
			},
			{
				id: 'style',
				label: '方式',
				type: 'choice',
				value: 'up',
				options: [
					{ value: 'up', label: '淡入上浮', say: '每个从下方 12px 淡入上浮' },
					{ value: 'blur', label: '模糊变清晰', say: '每个从模糊变清晰' },
					{ value: 'mask', label: '遮罩升起', say: '每个从下方被遮住的位置升起' },
				],
			},
			{
				id: 'gap',
				label: '间隔',
				type: 'range',
				value: 40,
				min: 15,
				max: 200,
				step: 5,
				unit: 'ms',
			},
		],
		presets: [
			{ label: '细腻', note: '逐字、模糊', values: { unit: 'char', style: 'blur', gap: 30 } },
			{ label: '大气', note: '逐行升起', values: { unit: 'line', style: 'mask', gap: 160 } },
			{ label: '节奏感', note: '逐词上浮', values: { unit: 'word', style: 'up', gap: 90 } },
		],
		prompt: '首页大标题{unit}依次出现，间隔 {gap}，{style}，只播一次。',
		warning:
			'拆成单个字以后，读屏软件会一个字一个字地念。让 AI 给拆开的字加 aria-hidden，再给整句保留一份完整的文字。',
	},
	marquee: {
		demo: 'marquee',
		hint: '一直在滚；把鼠标放上去试试悬停效果',
		controls: [
			{
				id: 'speed',
				label: '速度',
				type: 'range',
				value: 50,
				min: 15,
				max: 150,
				step: 5,
				unit: 'px',
				say: '{v}',
			},
			{
				id: 'dir',
				label: '方向',
				type: 'choice',
				value: 'left',
				options: [
					{ value: 'left', label: '向左', say: '向左' },
					{ value: 'right', label: '向右', say: '向右' },
				],
			},
			{
				id: 'hover',
				label: '悬停时',
				type: 'choice',
				value: 'slow',
				options: [
					{ value: 'pause', label: '暂停', say: '暂停' },
					{ value: 'slow', label: '减速', say: '减慢到原来的三分之一' },
					{ value: 'none', label: '不变', say: '保持滚动' },
				],
			},
			{
				id: 'edge',
				label: '两端',
				type: 'choice',
				value: 'fade',
				options: [
					{ value: 'fade', label: '渐隐', say: '；左右两端做渐隐，不要生硬地切断' },
					{ value: 'cut', label: '直切', say: '' },
				],
			},
		],
		presets: [],
		prompt:
			'这一排 logo 做成无限循环的跑马灯：{dir}匀速滚动，每秒约 {speed}，首尾无缝衔接；鼠标悬停时{hover}{edge}。',
		warning:
			'内容要复制一份接在后面，才能首尾无缝；只放一份，滚到头会突然空出一截。速度宁慢勿快，快到看不清 logo 就失去意义了。',
	},
	'animated-gradient': {
		demo: 'gradient',
		hint: '背景一直在缓慢流动，改改速度和配色',
		controls: [
			{
				id: 'cycle',
				label: '转一圈',
				type: 'range',
				value: 12000,
				min: 4000,
				max: 30000,
				step: 1000,
				unit: 's',
			},
			{
				id: 'palette',
				label: '配色',
				type: 'choice',
				value: 'cool',
				options: [
					{ value: 'cool', label: '冷色', say: '蓝、紫、青三种冷色' },
					{ value: 'warm', label: '暖色', say: '橙、粉、黄三种暖色' },
					{ value: 'mono', label: '黑白', say: '深浅不一的灰色' },
				],
			},
			{
				id: 'strength',
				label: '浓度',
				type: 'range',
				value: 35,
				min: 10,
				max: 70,
				step: 5,
				unit: '%',
			},
		],
		presets: [
			{
				label: '若有若无',
				note: '淡、慢',
				values: { cycle: 24000, palette: 'cool', strength: 15 },
			},
			{ label: '极光', note: '冷色流动', values: { cycle: 12000, palette: 'cool', strength: 40 } },
			{ label: '黄昏', note: '暖色', values: { cycle: 14000, palette: 'warm', strength: 40 } },
		],
		prompt:
			'首屏背景做成缓慢流动的渐变：{palette}的几团柔和色块在背景里慢慢漂移、相互融合，转一圈约 {cycle}，颜色浓度约 {strength}；文字保持清晰可读，系统开启「减少动态效果」时背景静止。',
		warning:
			'流动背景很吃性能，尤其是加了模糊滤镜的大色块。只放在首屏一处，滚出视口后暂停；颜色浓度也要压住，抢了文字的风头就本末倒置了。',
	},
	'expand-collapse': {
		demo: 'expand',
		hint: '点「展开全部」试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 300,
				min: 150,
				max: 700,
				step: 50,
				unit: 's',
			},
			{
				id: 'ease',
				label: '手感',
				type: 'choice',
				value: 'out',
				options: [
					{ value: 'out', label: '先快后慢', say: '先快后慢（ease-out）' },
					{ value: 'inout', label: '慢快慢', say: '慢快慢（ease-in-out）' },
				],
			},
			{
				id: 'arrow',
				label: '箭头',
				type: 'choice',
				value: 'turn',
				options: [
					{ value: 'turn', label: '跟着翻转', say: '，旁边的箭头同时旋转 180°' },
					{ value: 'none', label: '不变', say: '' },
				],
			},
			{
				id: 'fade',
				label: '新内容',
				type: 'choice',
				value: 'fade',
				options: [
					{ value: 'fade', label: '淡入', say: '，新露出的内容跟着淡入' },
					{ value: 'none', label: '直接显示', say: '' },
				],
			},
		],
		presets: [],
		prompt:
			'点击「展开全部」时，内容区高度在 {dur}内平滑展开到实际高度，{ease}{arrow}{fade}；再次点击按相同方式收起。',
		warning:
			'高度要按内容实际测出来，不能写死一个数。写死 300px，内容多了被截掉、少了留一大片空白；内容长到一定程度，直接跳到详情页反而更好。',
	},
	'page-transition': {
		demo: 'pageTransition',
		hint: '点一条笔记进入详情，再点返回；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'kind',
				label: '方式',
				type: 'choice',
				value: 'slide',
				options: [
					{ value: 'fade', label: '淡入淡出', say: '旧页面淡出、新页面淡入' },
					{
						value: 'slide',
						label: '左右滑动',
						say: '新页面从右侧滑入、旧页面向左让出（返回时方向相反）',
					},
					{ value: 'up', label: '上浮淡入', say: '旧页面淡出、新页面从下方 16px 淡入上浮' },
					{ value: 'zoom', label: '缩放', say: '旧页面略微缩小淡出、新页面从略大一点缩回原大小' },
				],
			},
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 300,
				min: 150,
				max: 700,
				step: 50,
				unit: 's',
			},
		],
		presets: [],
		prompt:
			'页面之间切换时加转场：{kind}，时长 {dur}。浏览器支持时用 View Transitions API 实现，不支持的浏览器直接切换。',
		warning:
			'转场要快，0.3 秒以内。用户点了链接是想马上看到内容，每次换页都要等半秒以上，再好看也会嫌烦。',
	},
	'shared-element': {
		demo: 'sharedElement',
		hint: '点一张模板卡片，再点返回；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'dur',
				label: '时长',
				type: 'range',
				value: 450,
				min: 250,
				max: 900,
				step: 50,
				unit: 's',
			},
			{
				id: 'ease',
				label: '手感',
				type: 'choice',
				value: 'out',
				options: [
					{ value: 'out', label: '先快后慢', say: '先快后慢（ease-out）' },
					{ value: 'inout', label: '慢快慢', say: '慢快慢（ease-in-out）' },
					{ value: 'back', label: '回弹', say: '结尾带一点回弹' },
				],
			},
			{
				id: 'rest',
				label: '其他内容',
				type: 'choice',
				value: 'fade',
				options: [
					{ value: 'fade', label: '跟着淡入', say: '在封面到位后淡入' },
					{ value: 'none', label: '直接出现', say: '直接出现' },
				],
			},
		],
		presets: [],
		prompt:
			'点击卡片打开详情时，卡片里的封面图从原来的位置和大小平滑放大到详情页顶部的大图位置，时长 {dur}，{ease}；详情页其他内容{rest}。返回时封面图沿原路缩回卡片。可以用 View Transitions API 的 view-transition-name 实现。',
		warning:
			'前后两个画面里必须是「同一张图」，比例也要接近。卡片里是方图、详情里是宽图，飞过去时会被拉伸变形，反而显得粗糙。',
	},
	'drag-reorder': {
		demo: 'drag',
		hint: '按住一项上下拖动试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'lift',
				label: '拿起时',
				type: 'choice',
				value: 'scale',
				options: [
					{ value: 'scale', label: '放大加阴影', say: '略微放大、加上阴影' },
					{ value: 'shadow', label: '只加阴影', say: '加上阴影' },
					{ value: 'tilt', label: '倾斜一点', say: '略微倾斜、加上阴影，像被拎起来' },
				],
			},
			{
				id: 'dur',
				label: '让位时长',
				type: 'range',
				value: 200,
				min: 100,
				max: 450,
				step: 25,
				unit: 's',
			},
			{
				id: 'drop',
				label: '放下时',
				type: 'choice',
				value: 'smooth',
				options: [
					{ value: 'smooth', label: '平滑落位', say: '平滑落到新位置' },
					{ value: 'spring', label: '轻轻回弹', say: '带一点回弹地落到新位置' },
				],
			},
		],
		presets: [],
		prompt:
			'列表支持拖拽排序：按住一项拖动时，它{lift}并跟着鼠标走；其他项在 {dur}内平滑让出位置；松手后{drop}。手机上长按 300ms 才进入拖拽，避免和页面滚动冲突。',
		warning:
			'拖拽排序一定要有键盘和读屏的替代方式，比如每一项旁边放「上移」「下移」按钮。只能用鼠标拖，就把一部分用户挡在门外了。',
	},
	'swipe-delete': {
		demo: 'swipe',
		hint: '按住一条消息往左拖试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'width',
				label: '按钮宽度',
				type: 'range',
				value: 80,
				min: 60,
				max: 120,
				step: 10,
				unit: 'px',
			},
			{
				id: 'release',
				label: '拖得够远时',
				type: 'choice',
				value: 'auto',
				options: [
					{
						value: 'auto',
						label: '直接删除',
						say: '拖过整行一半再松手就直接删除，没拖够就停在露出按钮的位置',
					},
					{ value: 'reveal', label: '只露出按钮', say: '松手后停在露出按钮的位置，点按钮才删除' },
				],
			},
			{
				id: 'dur',
				label: '收起时长',
				type: 'range',
				value: 250,
				min: 150,
				max: 500,
				step: 50,
				unit: 's',
			},
		],
		presets: [],
		prompt:
			'列表项支持向左滑动：手指往左拖时，这一项跟着手指移动，右侧露出 {width} 宽的红色「删除」按钮；{release}；删除时这一项向左滑出，下面的项在 {dur}内平滑补上。',
		warning:
			'滑动删除是手机上的习惯，电脑上很少有人会去拖。桌面端还要另外给一个看得见的删除入口，删除后最好再给几秒「撤销」的机会。',
	},
	'pull-to-refresh': {
		demo: 'pull',
		hint: '在列表上按住往下拉试试；你不动时，会有一只鼠标自动演示',
		controls: [
			{
				id: 'dist',
				label: '触发距离',
				type: 'range',
				value: 70,
				min: 40,
				max: 120,
				step: 10,
				unit: 'px',
			},
			{
				id: 'indicator',
				label: '指示器',
				type: 'choice',
				value: 'arrow',
				options: [
					{ value: 'spin', label: '转圈', say: '一个随拉动距离逐渐画满的圆圈' },
					{ value: 'arrow', label: '箭头翻转', say: '一个向下的箭头，拉够距离时翻转朝上' },
				],
			},
			{
				id: 'bounce',
				label: '收回时',
				type: 'choice',
				value: 'spring',
				options: [
					{ value: 'smooth', label: '平滑', say: '平滑地' },
					{ value: 'spring', label: '回弹', say: '带一点回弹地' },
				],
			},
		],
		presets: [],
		prompt:
			'列表顶部支持下拉刷新：往下拉时内容跟着下移，越拉阻力越大，顶部露出{indicator}；拉过 {dist} 松手开始刷新，刷新时显示转圈，完成后内容{bounce}收回，新内容出现在最上面。没拉够就松手，直接收回。',
		warning:
			'下拉刷新只在列表已经滚到最顶上时才生效。列表中间往下拉应该是正常滚动，抢了滚动手势会让人非常抓狂。',
	},
};

export type MotionValues = Record<string, string | number>;

export function defaultMotionValues(profile: MotionProfile): MotionValues {
	return Object.fromEntries(profile.controls.map((control) => [control.id, control.value]));
}

/** 控件当前值的显示文字：0.5 秒、80ms、24px、40% */
export function formatMotionValue(control: MotionControl, value: string | number): string {
	const number = Number(value);
	if (control.unit === 's') return `${Number((number / 1000).toFixed(2))} 秒`;
	if (control.unit === 'ms') return `${number}ms`;
	if (control.unit === 'px') return `${number}px`;
	if (control.unit === '%') return `${number}%`;
	if (control.unit === 'deg') return `${number}°`;
	return String(value);
}

/** 按当前参数，把 prompt 模板写成一句完整的话 */
export function renderMotionPrompt(profile: MotionProfile, values: MotionValues): string {
	const sayings: Record<string, string> = {};
	for (const control of profile.controls) {
		const value = values[control.id] ?? control.value;
		if (control.type === 'choice') {
			sayings[control.id] = control.options?.find((option) => option.value === value)?.say ?? '';
		} else if (Number(value) === 0 && control.zeroSay) {
			sayings[control.id] = control.zeroSay;
		} else {
			const text = formatMotionValue(control, value);
			const level = control.levels?.find((item) => Number(value) <= item.upTo);
			const template = level?.say ?? control.say;
			sayings[control.id] = template ? template.replace('{v}', text) : text;
		}
	}
	// 视差的中景速度取背景和前景（100%）的中点
	if (values.speed !== undefined) sayings.mid = `${Math.round((Number(values.speed) + 100) / 2)}%`;
	const fill = (text: string) => text.replace(/\{(\w+)\}/g, (_, id: string) => sayings[id] ?? '');
	// 选项措辞里还可以再引用别的控件，比如「从下方 {dist} 淡入上浮」
	return fill(fill(profile.prompt));
}
