/**
 * The questions the home search box types out, one after another. Each visit starts somewhere
 * else, so a returning reader sees a new one. Every question links to the page that answers it;
 * keep them short enough to fit the box on a phone (about 16 characters).
 */
export interface HomeQuestion {
	ask: string;
	href: string;
}

export const homeQuestions: HomeQuestion[] = [
	{ ask: '上下文窗口为什么会满？', href: '/vibe-coding/terms/context-window/' },
	{ ask: '大模型为什么会胡说八道？', href: '/newbie-tutorials/why-llms-hallucinate/' },
	{ ask: 'AI 为什么聊着聊着就忘了？', href: '/newbie-tutorials/why-ai-forgets/' },
	{ ask: '大模型是怎么训练出来的？', href: '/newbie-tutorials/how-llms-are-trained/' },
	{ ask: '知识库到底是什么？', href: '/newbie-tutorials/what-is-a-knowledge-base/' },
	{ ask: 'AI 这么多，我该用哪个？', href: '/newbie-tutorials/which-ai-should-i-use/' },
	{ ask: 'MCP 到底是什么？', href: '/vibe-coding/terms/mcp/' },
	{ ask: 'Skill 和提示词有什么不同？', href: '/vibe-coding/terms/skill/' },
	{ ask: '零样本和少样本差在哪？', href: '/vibe-coding/terms/few-shot/' },
	{ ask: '智能体和聊天机器人差在哪？', href: '/vibe-coding/terms/agent/' },
	{ ask: 'AI 为什么不知道最近发生的事？', href: '/vibe-coding/terms/knowledge-cutoff/' },
	{ ask: '「深度思考」什么时候该开？', href: '/vibe-coding/terms/reasoning-model/' },
	{ ask: '模型名里的 7B 是什么意思？', href: '/vibe-coding/terms/parameters/' },
	{ ask: '开源模型能在自己电脑上跑吗？', href: '/vibe-coding/terms/open-source/' },
	{ ask: 'RAG 是怎么查资料的？', href: '/vibe-coding/terms/rag/' },
	{ ask: '一个 token 有多长？', href: '/vibe-coding/terms/token/' },
	{ ask: '向量数据库存的是什么？', href: '/vibe-coding/terms/vector-database/' },
	{ ask: '什么是氛围编程？', href: '/vibe-coding/terms/vibe-coding/' },
	{ ask: 'Git 工作树有什么用？', href: '/vibe-coding/terms/worktree/' },
	{ ask: '检查点能帮我撤回什么？', href: '/vibe-coding/terms/checkpoint/' },
	{ ask: '前端说的水合是什么？', href: '/vibe-coding/terms/hydration/' },
	{ ask: '环境变量是做什么的？', href: '/vibe-coding/terms/environment-variable/' },
	{ ask: '置信区间该怎么看？', href: '/vibe-coding/terms/confidence-interval/' },
	{ ask: '命令面板是什么？', href: '/vibe-coding/terms/command-palette/' },
	{ ask: 'Codex App 怎么上手？', href: '/codex-tutorials/codex-app-beginner-guide/' },
	{ ask: 'Pi 是怎么压缩上下文的？', href: '/pi-agent-tutorials/pi-agent-compaction/' },
	{ ask: '各家模型画的埃菲尔铁塔？', href: '/benchmarks/cases/?q=埃菲尔' },
];
