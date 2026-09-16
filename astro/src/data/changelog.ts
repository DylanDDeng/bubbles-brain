export type ChangelogCategory = 'feature' | 'content' | 'polish';

export interface ChangelogItem {
	date: string;
	title: string;
	tag: string;
	type: ChangelogCategory;
	summary: string;
	highlights?: string[];
	/** Explicit content changes in a mixed feature/polish entry. */
	readingUpdates?: string[];
	links?: Array<{
		label: string;
		href: string;
	}>;
}

export const changelog: ChangelogItem[] = [
	{
		date: '2026-09-16',
		tag: '模型评测与 AI 术语',
		type: 'content',
		title: '新增 DeepSWE 评测与置信区间图解',
		summary:
			'Benchmarks 收录 DeepSWE v1.1 软件工程评测；AI 术语新增 Confidence Interval，用抽糖果的例子解释分数背后的不确定性。',
		highlights: [
			'DeepSWE 页面介绍任务、评测方式与阅读要点，整理官方快照中的 21 个模型成绩、推理设置和置信区间',
			'各评测表格增加模型品牌图标，缩小字体并调整行距，让模型与分数更容易对照',
			'置信区间配有样本量切换实验，演示抽样数量如何影响区间宽度，并解释 95% 置信水平的含义',
		],
		links: [
			{ label: '查看 DeepSWE', href: '/benchmarks/deepswe/' },
			{ label: '理解置信区间', href: '/vibe-coding/terms/confidence-interval/' },
		],
	},
	{
		date: '2026-09-15',
		tag: '精选阅读与筛选体验',
		type: 'content',
		title: '收录 OpenAI Astra Skills 与提示词指南',
		summary:
			'新增 OpenAI 官方博文《重新审视 GPT-6 Astra 的 Skills 与提示词》中英双语全文，讨论模型升级后如何调整 Skill 描述、上下文与任务完成标准。',
		highlights: [
			'中文版本保留技术细节、示例与原文出处，方便对照阅读',
			'栏目年份筛选改为与网站风格一致的下拉菜单，调整选中态，并支持键盘操作',
		],
		links: [
			{
				label: '阅读 Astra Skills 与提示词指南',
				href: '/highlights/2026-09-14-rethinking-skills-and-prompts-for-gpt-6-astra/',
			},
		],
	},
	{
		date: '2026-09-11',
		tag: '教程与栏目导航',
		type: 'feature',
		readingUpdates: ['/workbuddy-tutorials/workbuddy-feishu-workflow-guide/'],
		title: '新增 WorkBuddy 飞书实战，统一栏目目录入口',
		summary:
			'WorkBuddy 教程新增飞书工作流实战；各栏目的目录统一到首页对应分区，减少内容重复、入口混淆的问题。',
		highlights: [
			'通过群消息总结与 Skills 收藏、截图记账与数据看板、项目周报三个案例，介绍 WorkBuddy 与飞书的配合方式',
			'统一教程、精选阅读、Benchmarks 和 Vibe Coding 等栏目的目录入口，保留文章详情页地址',
			'移除旧栏目目录和旧年份归档页，修复旧目录缓存仍显示重复内容的问题',
		],
		links: [
			{
				label: '阅读 WorkBuddy 飞书实战',
				href: '/workbuddy-tutorials/workbuddy-feishu-workflow-guide/',
			},
			{ label: '浏览教程目录', href: '/#bc-tutorials' },
		],
	},
	{
		date: '2026-09-10',
		tag: '界面术语与视觉优化',
		type: 'polish',
		readingUpdates: ['/vibe-coding/terms/date-picker/'],
		title: '新增日期选择器图鉴，统一 Benchmarks 3D 封面',
		summary:
			'界面图鉴新增 Date Picker，介绍日期选择器的用途与常见形态；Benchmarks 换上与其他栏目一致的 3D 封面。',
		highlights: [
			'通过结构图、变体与辨认练习，说明日期选择器在界面中的用法',
			'统一评测栏目封面的建模风格，修复从详情页返回时光影发生跳变的问题',
		],
		links: [
			{ label: '了解 Date Picker', href: '/vibe-coding/terms/date-picker/' },
			{ label: '浏览 Benchmarks', href: '/#bc-benchmarks' },
		],
	},
	{
		date: '2026-09-09',
		tag: '模型评测与界面术语',
		type: 'feature',
		readingUpdates: ['/vibe-coding/terms/divider/'],
		title: 'Benchmarks 栏目上线，新增分割线图鉴',
		summary:
			'新增模型评测栏目，把榜单成绩与评测解释放在一起，帮助读者理解每项测试在测什么、分数应该怎么看。',
		highlights: [
			'评测详情提供中英双语说明、模型成绩、数据来源与阅读提示，支持表格排序',
			'接入首页栏目导航与知识搜索，阅读详情后可以返回对应栏目',
			'界面图鉴新增 Divider，解释分割线如何组织内容层次，以及不同形式的使用场景',
		],
		links: [
			{ label: '探索 Benchmarks', href: '/#bc-benchmarks' },
			{ label: '了解 Divider', href: '/vibe-coding/terms/divider/' },
		],
	},
	{
		date: '2026-09-07',
		tag: '首页与阅读体验',
		type: 'feature',
		title: 'BrainPod 首页上线，新增逐篇未读提示',
		summary:
			'首页改为可交互的 3D iPod 知识入口，配合栏目模型封面、滚动展开和屏幕内阅读，让浏览知识库多一种方式。',
		highlights: [
			'支持通过 iPod 菜单浏览栏目，滚动进入完整页面，并提供猫咪锁屏与本地时钟',
			'栏目列表和 iPod 菜单增加逐篇未读圆点，打开文章后更新已读状态；首次访问显示近三天的内容更新',
			'统一导航、正文排版与页脚，完善响应式图片，适配不同屏幕下的阅读',
		],
		links: [{ label: '体验 BrainPod 首页', href: '/' }],
	},
	{
		date: '2026-09-06',
		tag: '精选阅读',
		type: 'content',
		title: '新增 OpenAI 研究加速与 Slop-Creep 精选阅读',
		summary:
			'收录 OpenAI 关于 AI 研究加速的一手观察，以及 Brandon Sovran 对构建成本下降与思考的讨论；提供中文译文和原文出处。',
		links: [
			{
				label: '低质系统的蔓延：当构建比思考更便宜',
				href: '/highlights/2026-09-06-slop-creep-when-building-gets-cheaper/',
			},
			{
				label: '研究加速：从 OpenAI 内部看 AI 研究的变化',
				href: '/highlights/2026-09-06-research-acceleration-view-inside-openai/',
			},
		],
	},
	{
		date: '2026-09-04',
		readingUpdates: ['/highlights/2026-08-31-how-our-agents-build-on-brand-pages-with-design-md/'],
		tag: '搜索与阅读体验',
		type: 'feature',
		title: '全站知识搜索与文章阅读体验升级',
		summary:
			'知识搜索现已覆盖教程、精选阅读、术语、Skills、Design 与关于页；文章页同步升级图片呈现、阅读尺度和内容统计，并收录 Vercel 的 design.md 设计评测实践。',
		highlights: [
			'知识搜索扩展至 213 条全站内容，保留更新日志在索引之外',
			'文章正文采用更舒适的阅读宽度，图片与正文对齐并支持响应式加载和大图查看',
			'首页内容数字改为根据实际可阅读页面实时统计',
			'精选阅读新增 Vercel《Agent 如何用 design.md 构建符合品牌的页面》中英双语全文',
		],
		links: [
			{ label: '体验知识搜索', href: '/search/' },
			{
				label: '阅读 Vercel design.md 实践',
				href: '/highlights/2026-08-31-how-our-agents-build-on-brand-pages-with-design-md/',
			},
		],
	},
	{
		date: '2026-09-02',
		tag: '精选阅读',
		type: 'content',
		title: '收录 Anthropic 官方指南《为 Claude Fable 5.1 编写提示》',
		summary:
			'Anthropic 针对 Claude Fable 5.1 的官方实战提示指南：详解 Effort 参数调优、长任务持续汇报机制，以及工具批量调用、对话历史与视觉任务处理。',
		highlights: [
			'系统梳理 Fable 5.1 模型特性与思考预算（Thinking Effort）配置方法',
			'解析 Agent 长任务中避免过早退出的提示词约束模式',
			'收录完整中英双语对照版本与实战代码样例',
		],
		links: [
			{
				label: '阅读实战指南',
				href: '/highlights/2026-09-02-prompting-claude-fable-5-1/',
			},
		],
	},
	{
		date: '2026-08-31',
		readingUpdates: ['/newbie-tutorials/why-ai-forgets/'],
		tag: '交互与教程',
		type: 'polish',
		title: '侧边栏手风琴导航升级 & 新手村《AI 为什么会遗忘》',
		summary:
			'左侧主导航新增手风琴互斥折叠效果，大幅优化移动端浏览体验；新手村上线图解新篇《AI 为什么会遗忘》。',
		highlights: [
			'侧边栏多级菜单支持原生互斥展开，精简页面滚动距离',
			'新手村新增《AI 为什么会遗忘》，图解上下文窗口、注意力机制与 KV Cache 限制',
			'配套上线直觉互动实验，直观体验上下文截断的影响',
		],
		links: [
			{
				label: '阅读《AI 为什么会遗忘》',
				href: '/newbie-tutorials/why-ai-forgets/',
			},
		],
	},
	{
		date: '2026-08-30',
		tag: '新栏目上线',
		type: 'content',
		title: '「新手村」栏目正式上线',
		summary: '专为零技术背景读者打造，用直觉比喻、动图与交互小实验讲透大模型的核心工作原理。',
		highlights: [
			'首发上线《AI 为什么会胡说八道》《什么是知识库》等核心图解教程',
			'内置动态交互小实验，直观体验大模型概率采样与幻觉成因',
			'主站导航与知识库首页正式接入「新手村」独立专区',
		],
		links: [
			{
				label: '前往「新手村」体验',
				href: '/#bc-newbie-tutorials',
			},
		],
	},
	{
		date: '2026-08-29',
		tag: '关于页与术语',
		type: 'polish',
		title: '关于页上线微信交流渠道 & Token 术语图解完善',
		summary:
			'关于页正式上线微信「BubbleBrain小助手」二维码与读者交流渠道；Vibe Coding 术语专区完善 Token 换算与交互实验。',
		highlights: [
			'关于页（中/英）新增微信小助手二维码与交流渠道',
			'修正 Token 术语的中英字符换算逻辑并补齐定制动态图解',
		],
		links: [
			{ label: '查看关于页', href: '/about/' },
			{ label: '查看 Token 术语', href: '/vibe-coding/terms/token/' },
		],
	},
	{
		date: '2026-08-28',
		tag: '系统升级',
		type: 'polish',
		title: '接入 Umami 隐私友好访问统计',
		summary:
			'全站接入轻量、合规且不追踪个人隐私的 Umami 访问统计系统，完成 Cloudflare Pages 严格的 CSP 安全放行。',
		highlights: [
			'替代繁重且国内访问受限的传统分析工具，脚本体积仅 2KB 且无 Cookie',
			'严格配置 Content-Security-Policy，确保生产环境静态交付安全',
		],
	},
	{
		date: '2026-08-27',
		tag: '重大更新',
		type: 'feature',
		title: 'Vibe Coding「Design 专区」与「Skills 技能库」双上线',
		summary:
			'重磅推出 Vibe Coding 旗下两大专区：23+ 家知名科技品牌 DESIGN.md 规范库与 20+ 个生产级 Agent Skills 库。',
		highlights: [
			'上线 Design 专区：系统拆解 Stripe、Vercel、Apple、Linear 等知名品牌的视觉规范与设计哲学',
			'上线 Skills 专区：收录 agent-browser 等 20 个开箱即用的 AI Agent 技能',
			'提供一键复制的 Prompt 指令，帮助 AI 编码工具输出顶级工程代码',
		],
		links: [
			{ label: '浏览 Design 专区', href: '/#bc-vibe-coding-design' },
			{ label: '探索 Skills 技能库', href: '/#bc-vibe-coding-skills' },
		],
	},
	{
		date: '2026-08-24',
		tag: '视觉改版',
		type: 'feature',
		title: '知识库首页全新改版 V2',
		summary:
			'首页采用全新的动效视觉与 RicoUI 设计系统，上线知识库全局分类、术语交互式 Demo 与互动猫咪视线追踪。',
		highlights: [
			'引入动效 Editorial 风格排版，更加清爽聚焦',
			'集成 Canvas 视线追踪交互与文章数据统计看板',
			'上线全局知识分类索引与精选内容智能排序',
		],
		links: [{ label: '回到首页体验', href: '/' }],
	},
];
