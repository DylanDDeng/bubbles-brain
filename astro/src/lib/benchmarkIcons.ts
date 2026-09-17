import inception from '../components/benchmark-icons/inception.svg?url';
import poolside from '../components/benchmark-icons/poolside.svg?url';
import ant from '../components/benchmark-icons/ant.svg?url';
import thinkingmachines from '../components/benchmark-icons/thinking-machines.svg?url';
import nvidia from '../components/benchmark-icons/nvidia.svg?url';
import mistral from '../components/benchmark-icons/mistral.svg?url';
import xiaomi from '../components/benchmark-icons/xiaomi.svg?url';
import minimax from '../components/benchmark-icons/minimax.svg?url';
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
	MiniMax: minimax,
	Xiaomi: xiaomi,
	Mistral: mistral,
	NVIDIA: nvidia,
	'Thinking Machines': thinkingmachines,
	'Ant Group': ant,
	Poolside: poolside,
	Inception: inception,
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
