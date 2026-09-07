/**
 * 猫馆长 · 角色系统
 *
 * 全站唯一的角色：那只白猫。它是知识库的馆长，在每个栏目有自己的姿态和一句话，
 * 在 404、搜索无结果、文章末尾等位置出场。素材复用 static/images 里已有的六张猫图。
 */

export type CatPose = 'read' | 'sit' | 'wave' | 'stand' | 'crouch' | 'roll';

export interface CatEye {
	x: number;
	y: number;
	r: number;
}

/**
 * 露出爪子的姿态才有：整只猫朝鼠标探身。
 * pan 是最大平移（原图像素），tilt 是最大倾斜角（度），
 * pivot 是倾斜支点（原图像素），一般放在身体底部。
 */
export interface CatReach {
	pan: number;
	tilt: number;
	pivot: [number, number];
}

export interface CatPoseAsset {
	src: string;
	/** 头像裁切框：原图 1100×765 像素坐标与边长 */
	crop: { x: number; y: number; size: number };
	eyes: CatEye[];
	reach?: CatReach;
}

export const CAT_POSES: Record<CatPose, CatPoseAsset> = {
	read: {
		src: '/images/brain-cat.jpg',
		crop: { x: 470, y: 145, size: 370 },
		eyes: [
			{ x: 613.3, y: 313.4, r: 21.5 },
			{ x: 698, y: 326, r: 26 },
		],
		reach: { pan: 18, tilt: 3, pivot: [655, 560] },
	},
	sit: {
		src: '/images/cat-pose-1.jpg',
		crop: { x: 435, y: 50, size: 380 },
		eyes: [
			{ x: 582.3, y: 247.1, r: 24.2 },
			{ x: 667.2, y: 202.5, r: 23.8 },
		],
	},
	wave: {
		src: '/images/cat-pose-2.jpg',
		crop: { x: 190, y: 40, size: 450 },
		eyes: [
			{ x: 446, y: 186.4, r: 24 },
			{ x: 540, y: 210.4, r: 26.8 },
		],
		reach: { pan: 26, tilt: 5, pivot: [340, 520] },
	},
	stand: {
		src: '/images/cat-pose-3.jpg',
		crop: { x: 460, y: 20, size: 340 },
		eyes: [
			{ x: 591.2, y: 154.1, r: 17.8 },
			{ x: 664, y: 157, r: 20.8 },
		],
		reach: { pan: 20, tilt: 4, pivot: [630, 400] },
	},
	crouch: {
		src: '/images/cat-pose-4.jpg',
		crop: { x: 600, y: 280, size: 380 },
		eyes: [
			{ x: 722.3, y: 483.1, r: 28.5 },
			{ x: 837.6, y: 475.3, r: 23.8 },
		],
	},
	roll: {
		src: '/images/cat-pose-5.jpg',
		crop: { x: 60, y: 300, size: 420 },
		eyes: [
			{ x: 178, y: 501, r: 22.5 },
			{ x: 245.9, y: 460.7, r: 17.8 },
		],
		reach: { pan: 24, tilt: 5, pivot: [270, 760] },
	},
};

/** 馆长头像：从 cat-pose-1 裁出的正脸 */
export const CAT_CURATOR_AVATAR = '/images/cat-curator.jpg';

export interface CatLine {
	pose: CatPose;
	zh: string;
	en: string;
}

/** 各栏目的姿态与台词 */
export const CAT_SECTION_LINES: Record<string, CatLine> = {
	'newbie-tutorials': {
		pose: 'stand',
		zh: '第一次来？地图我拿着，你只管跟着走。',
		en: 'First time here? I have the map. Just follow me.',
	},
	'codex-tutorials': {
		pose: 'sit',
		zh: '我盯着终端，你盯着我就行。',
		en: 'I watch the terminal. You watch me.',
	},
	'pi-agent-tutorials': {
		pose: 'wave',
		zh: 'Pi 很小，一只爪子就能举起来。',
		en: 'Pi is small. One paw is enough to lift it.',
	},
	'workbuddy-tutorials': {
		pose: 'crouch',
		zh: '活儿来了。我先扑上去，你跟着学。',
		en: 'Work incoming. I pounce first, you follow.',
	},
	highlights: {
		pose: 'read',
		zh: '这些是我一篇篇翻过、觉得值得留下的。',
		en: 'I read every one of these. These are the keepers.',
	},
	'vibe-coding-terms': {
		pose: 'sit',
		zh: '一个词一个词翻给你看，不着急。',
		en: 'One word at a time. No rush.',
	},
	'vibe-coding-skills': {
		pose: 'crouch',
		zh: '这些技能我都试过爪子。',
		en: 'I have tested every one of these with my own paws.',
	},
	'vibe-coding-design': {
		pose: 'roll',
		zh: '色卡我叼来了，你来挑。',
		en: 'I fetched the swatches. You pick.',
	},
};

export const CAT_STATE_LINES = {
	notFound: {
		pose: 'roll' as CatPose,
		zh: '翻了个底朝天，也没找到这一页。',
		en: 'I turned the whole place upside down. This page is not here.',
	},
	searchEmpty: {
		pose: 'stand' as CatPose,
		zh: '这个我没翻到。换个词再试试？',
		en: 'Nothing under that word. Try another?',
	},
	read: {
		zh: 'Bubble 已读',
		en: 'Read by Bubble',
	},
};
