import claude from '../components/benchmark-icons/claude.svg?url';
import deepseek from '../components/benchmark-icons/deepseek.svg?url';
import gemini from '../components/benchmark-icons/gemini.svg?url';
import grok from '../components/benchmark-icons/grok.svg?url';
import meta from '../components/benchmark-icons/meta.svg?url';
import moonshot from '../components/benchmark-icons/moonshot.svg?url';
import openai from '../components/benchmark-icons/openai.svg?url';
import qwen from '../components/benchmark-icons/qwen.svg?url';
import zhipu from '../components/benchmark-icons/zhipu.svg?url';

/** Shared brand marks for every reasoning setting of a model family. */
export const benchmarkIcons: Readonly<Record<string, string>> = {
	Anthropic: claude,
	OpenAI: openai,
	Google: gemini,
	DeepSeek: deepseek,
	xAI: grok,
	Meta: meta,
	'Moonshot AI': moonshot,
	Alibaba: qwen,
	'Z AI': zhipu,
};
