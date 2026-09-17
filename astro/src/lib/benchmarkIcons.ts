import aaSapiensAi from '../components/benchmark-icons/aa-sapiens-ai.svg?url';
import aaMbzuaiInstituteOfFoundationModels from '../components/benchmark-icons/aa-mbzuai-institute-of-foundation-models.svg?url';
import aaApodex from '../components/benchmark-icons/aa-apodex.svg?url';
import aaMultiverseComputing from '../components/benchmark-icons/aa-multiverse-computing.svg?url';
import aaMotifTechnologies from '../components/benchmark-icons/aa-motif-technologies.svg?url';
import aaChinaMobile from '../components/benchmark-icons/aa-china-mobile.png?url';
import aaAi9stars from '../components/benchmark-icons/aa-ai9stars.svg?url';
import aaNexAgi from '../components/benchmark-icons/aa-nex-agi.svg?url';
import aaUpstage from '../components/benchmark-icons/aa-upstage.svg?url';
import aaTencent from '../components/benchmark-icons/aa-tencent.svg?url';
import aaSkTelecom from '../components/benchmark-icons/aa-sk-telecom.svg?url';
import aaLongcat from '../components/benchmark-icons/aa-longcat.svg?url';
import aaStepfun from '../components/benchmark-icons/aa-stepfun.svg?url';
import aaLgAiResearch from '../components/benchmark-icons/aa-lg-ai-research.png?url';
import aaKwaikat from '../components/benchmark-icons/aa-kwaikat.svg?url';
import aaOpenbmb from '../components/benchmark-icons/aa-openbmb.svg?url';
import aaIbm from '../components/benchmark-icons/aa-ibm.svg?url';
import aaCohere from '../components/benchmark-icons/aa-cohere.svg?url';
import aaAmazon from '../components/benchmark-icons/aa-amazon.svg?url';
import aaArceeAi from '../components/benchmark-icons/aa-arcee-ai.svg?url';
import aaCeleris from '../components/benchmark-icons/aa-celeris.svg?url';
import aaLiquidAi from '../components/benchmark-icons/aa-liquid-ai.svg?url';
import aaNanbeige from '../components/benchmark-icons/aa-nanbeige.png?url';
import aaMicrosoft from '../components/benchmark-icons/aa-microsoft.svg?url';
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
	SpaceXAI: grok,
	Kimi: moonshot,
	InclusionAI: ant,
	'Sapiens AI': aaSapiensAi,
	'MBZUAI Institute of Foundation Models': aaMbzuaiInstituteOfFoundationModels,
	Apodex: aaApodex,
	'Multiverse Computing': aaMultiverseComputing,
	'Motif Technologies': aaMotifTechnologies,
	'China Mobile': aaChinaMobile,
	AI9Stars: aaAi9stars,
	'Nex AGI': aaNexAgi,
	Upstage: aaUpstage,
	Tencent: aaTencent,
	'SK Telecom': aaSkTelecom,
	LongCat: aaLongcat,
	StepFun: aaStepfun,
	'LG AI Research': aaLgAiResearch,
	KwaiKAT: aaKwaikat,
	OpenBMB: aaOpenbmb,
	IBM: aaIbm,
	Cohere: aaCohere,
	Amazon: aaAmazon,
	'Arcee AI': aaArceeAi,
	Celeris: aaCeleris,
	'Liquid AI': aaLiquidAi,
	Nanbeige: aaNanbeige,
	Microsoft: aaMicrosoft,

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
