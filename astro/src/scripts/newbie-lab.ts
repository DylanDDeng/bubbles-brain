// Hands-on blocks for the Newbie Village tutorials. Markup lives in the
// markdown; this only wires behaviour so the articles stay plain HTML.

interface TokenChoice {
	word: string;
	pct: number;
}

// LAB 01 — every branch reads like an encyclopedia entry, none of it is real.
const NEXT_TOKEN_STEPS: Array<{ hint: string; choices: TokenChoice[] }> = [
	{
		hint: '第 1 步 · 先接一个姓',
		choices: [
			{ word: '张', pct: 41 },
			{ word: '李', pct: 27 },
			{ word: '王', pct: 19 },
		],
	},
	{
		hint: '第 2 步 · 再接一个名',
		choices: [
			{ word: '明', pct: 36 },
			{ word: '伟', pct: 29 },
			{ word: '磊', pct: 18 },
		],
	},
	{
		hint: '第 3 步 · 接一个身份或出处',
		choices: [
			{ word: '，清华大学出版社出版', pct: 38 },
			{ word: '，北京大学计算机系教授', pct: 33 },
			{ word: '，2019 年首次出版', pct: 22 },
		],
	},
	{
		hint: '第 4 步 · 收个尾',
		choices: [
			{ word: '。', pct: 70 },
			{ word: '，豆瓣评分 8.7。', pct: 20 },
			{ word: '，被誉为该领域的经典之作。', pct: 9 },
		],
	},
];

function setupNextTokenLab(lab: HTMLElement): void {
	const generated = lab.querySelector<HTMLElement>('[data-nb-generated]');
	const hint = lab.querySelector<HTMLElement>('[data-nb-hint]');
	const choices = lab.querySelector<HTMLElement>('[data-nb-choices]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	if (!generated || !hint || !choices || !result || !reset) return;

	let step = 0;

	const renderStep = () => {
		const current = NEXT_TOKEN_STEPS[step];
		choices.replaceChildren();
		if (!current) return;
		hint.textContent = current.hint;
		for (const choice of current.choices) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'nb-choice';
			button.innerHTML =
				`<span class="nb-choice-word-wrap"><span class="nb-choice-bar" style="--nb-p: ${choice.pct}%"></span>` +
				`<span class="nb-choice-word"></span></span><span class="nb-choice-pct"></span>`;
			button.querySelector('.nb-choice-word')!.textContent = choice.word;
			button.querySelector('.nb-choice-pct')!.textContent = `${choice.pct}%`;
			button.addEventListener('click', () => pick(choice.word));
			choices.append(button);
		}
	};

	const finish = () => {
		lab.classList.add('is-done');
		hint.textContent = '生成完毕';
		choices.replaceChildren();
		const sentence = `${lab.querySelector('.nb-prompt')?.textContent ?? ''}${generated.textContent ?? ''}`;
		result.replaceChildren();
		const line1 = document.createElement('p');
		line1.append('你刚刚生成的句子：「');
		const quote = document.createElement('b');
		quote.textContent = sentence;
		line1.append(quote, '」');
		const line2 = document.createElement('p');
		line2.innerHTML =
			'通顺吗？通顺。是真的吗？<b>这本书不存在，这位作者也不存在。</b>' +
			'你每一步都只是在挑「最像话」的词，没有任何一步停下来查证。模型做的正是同一件事。';
		result.append(line1, line2);
		result.hidden = false;
		reset.hidden = false;
		reset.focus();
	};

	const pick = (word: string) => {
		generated.textContent = `${generated.textContent ?? ''}${word}`;
		step += 1;
		if (step >= NEXT_TOKEN_STEPS.length) finish();
		else renderStep();
	};

	reset.addEventListener('click', () => {
		step = 0;
		generated.textContent = '';
		result.hidden = true;
		reset.hidden = true;
		lab.classList.remove('is-done');
		renderStep();
		choices.querySelector<HTMLButtonElement>('button')?.focus();
	});

	renderStep();
}

// LAB 02 — two students, 10 questions, both truly know 6.
const EXAM = {
	guess: { correct: 7, wrong: 3, blank: 0 },
	honest: { correct: 6, wrong: 0, blank: 4 },
} as const;

const EXAM_RULES: Record<string, { wrongPenalty: number; verdict: string }> = {
	a: {
		wrongPenalty: 0,
		verdict:
			'规则 A 下，<b>小猜</b>赢。不会就猜没有任何代价，这正是模型被训练和排名时最常见的规则。',
	},
	b: {
		wrongPenalty: 1,
		verdict:
			'规则 B 下，<b>小实</b>反超。只要答错要扣分，「不知道」就成了值钱的答案。但很少有测试这么打分。',
	},
	c: {
		wrongPenalty: 3,
		verdict:
			'规则 C 下，<b>小猜</b>直接负分。罚得越重，越诚实的考生越占优。想让模型少编，评分规则得先改。',
	},
};

function setupExamLab(lab: HTMLElement): void {
	const rows = {
		guess: lab.querySelector<HTMLElement>('[data-nb-score="guess"]'),
		honest: lab.querySelector<HTMLElement>('[data-nb-score="honest"]'),
	};
	const verdict = lab.querySelector<HTMLElement>('[data-nb-verdict]');
	const radios = lab.querySelectorAll<HTMLInputElement>('input[name="nb-exam-rule"]');
	if (!rows.guess || !rows.honest || !verdict) return;

	const render = () => {
		const rule = [...radios].find((radio) => radio.checked)?.value ?? 'a';
		const config = EXAM_RULES[rule] ?? EXAM_RULES.a;
		const scores = {
			guess: EXAM.guess.correct - EXAM.guess.wrong * config.wrongPenalty,
			honest: EXAM.honest.correct - EXAM.honest.wrong * config.wrongPenalty,
		};
		for (const key of ['guess', 'honest'] as const) {
			const row = rows[key]!;
			const score = scores[key];
			const bar = row.querySelector<HTMLElement>('[data-nb-bar]');
			const num = row.querySelector<HTMLElement>('[data-nb-num]');
			const detail = row.querySelector<HTMLElement>('[data-nb-detail]');
			if (bar) bar.style.width = `${Math.max(0, score) * 10}%`;
			if (num) num.textContent = `${score < 0 ? '−' : ''}${Math.abs(score)} 分`;
			if (detail) {
				const stats = EXAM[key];
				detail.textContent = `对 ${stats.correct} · 错 ${stats.wrong} · 空 ${stats.blank}`;
			}
			row.classList.toggle('is-leader', score >= scores[key === 'guess' ? 'honest' : 'guess']);
		}
		verdict.innerHTML = config.verdict;
	};

	for (const radio of radios) radio.addEventListener('change', render);
	render();
}

// Risk / quality meter — add up the checked weights, map to a level.
// Labels, tips and thresholds can be overridden per lab via data attributes.
const RISK_DEFAULTS = {
	labels: { low: '低', medium: '中', high: '高' },
	tips: {
		low: '开放式问题，或者它手里有资料可查。放心用，但仍然值得扫一眼具体细节。',
		medium: '有几处它只能靠印象补全。要求它给出处，对数字、日期、名字单独核对一遍。',
		high: '典型的幻觉高发问题。先把资料贴给它，或者改用能联网的模式；引用和链接必须逐条点开验证。',
	},
	empty: '勾选几项试试。什么都不勾，默认按开放式问题算。',
	medium: 1,
	high: 4,
};

function setupRiskLab(lab: HTMLElement): void {
	const meter = lab.querySelector<HTMLElement>('[data-nb-risk-meter]');
	const level = lab.querySelector<HTMLElement>('[data-nb-risk-level]');
	const tip = lab.querySelector<HTMLElement>('[data-nb-risk-tip]');
	const boxes = lab.querySelectorAll<HTMLInputElement>('input[data-nb-risk]');
	if (!meter || !level || !tip) return;

	const data = meter.dataset;
	const labels = {
		low: data.nbLabelLow ?? RISK_DEFAULTS.labels.low,
		medium: data.nbLabelMedium ?? RISK_DEFAULTS.labels.medium,
		high: data.nbLabelHigh ?? RISK_DEFAULTS.labels.high,
	};
	const tips = {
		low: data.nbTipLow ?? RISK_DEFAULTS.tips.low,
		medium: data.nbTipMedium ?? RISK_DEFAULTS.tips.medium,
		high: data.nbTipHigh ?? RISK_DEFAULTS.tips.high,
	};
	const emptyTip = data.nbEmpty ?? RISK_DEFAULTS.empty;
	const mediumAt = Number(data.nbMedium ?? RISK_DEFAULTS.medium);
	const highAt = Number(data.nbHigh ?? RISK_DEFAULTS.high);

	const render = () => {
		let score = 0;
		let touched = false;
		for (const box of boxes) {
			if (!box.checked) continue;
			touched = true;
			score += Number(box.dataset.nbRisk ?? 0);
		}
		const key = score >= highAt ? 'high' : score >= mediumAt ? 'medium' : 'low';
		meter.dataset.level = key;
		level.textContent = labels[key];
		tip.textContent = touched ? tips[key] : emptyTip;
	};

	for (const box of boxes) box.addEventListener('change', render);
	render();
}

// LAB (knowledge base) 01 — the reader plays retrieval; the "model" answers
// strictly from whatever chunks were handed over.
const KB_CHUNKS: Record<string, { src: string; text: string }> = {
	a: {
		src: '差旅管理制度（2025 版）· 第 3 条',
		text: '住宿标准：一线城市 500 元/晚，其他城市 350 元/晚，超标部分自理。',
	},
	b: {
		src: '差旅管理制度（2023 版）· 第 3 条',
		text: '住宿标准：一线城市 400 元/晚，其他城市 300 元/晚，超标部分自理。',
	},
	c: {
		src: '差旅管理制度（2025 版）· 第 5 条',
		text: '报销需在出差结束后 10 个工作日内提交发票与行程单。',
	},
	d: {
		src: '差旅管理制度（2025 版）· 第 1 条',
		text: '出差需提前 3 个工作日在 OA 提交审批，由直属上级审批。',
	},
	e: {
		src: '员工手册 · 第 8 章',
		text: '年假按工龄计算：满一年 5 天，满三年 10 天，满十年 15 天。',
	},
	f: {
		src: '差旅管理制度（2025 版）· 第 4 条',
		text: '本制度所称一线城市，指北京、上海、广州、深圳。',
	},
};

function kbAnswerFor(picked: string[]): {
	answer: string;
	source: string;
	verdict: string;
	tone: 'good' | 'bad' | 'meh';
} {
	const has = (id: string) => picked.includes(id);
	if (has('a') && has('b')) {
		return {
			answer:
				'资料里有两个版本的住宿标准：2025 版为一线城市 500 元/晚、其他城市 350 元/晚；2023 版为 400 元/晚、300 元/晚。建议以现行的 2025 版为准。',
			source: '差旅管理制度 2025 版第 3 条；2023 版第 3 条',
			verdict:
				'模型发现了两份资料打架，这次它处理得不错。但别指望每次都这么走运：更稳妥的做法是把作废的 2023 版从知识库里移除，别让它有机会被翻出来。',
			tone: 'meh',
		};
	}
	if (has('a')) {
		return {
			answer: has('f')
				? '住宿标准：北京、上海、广州、深圳为 500 元/晚，其他城市 350 元/晚，超出部分自理。'
				: '住宿标准：一线城市 500 元/晚，其他城市 350 元/晚，超出部分自理。',
			source: has('f') ? '差旅管理制度 2025 版第 3、4 条' : '差旅管理制度 2025 版第 3 条',
			verdict: has('f')
				? '最完整的一种答案：第 3 条给数字，第 4 条解释了「一线城市」指哪几个，新同事不用再追问。翻对了页，模型就只是照着念。'
				: '答对了，出处也对。如果再补上第 4 条，模型还能顺手解释「一线城市」是哪几个。',
			tone: 'good',
		};
	}
	if (has('b')) {
		return {
			answer: '住宿标准：一线城市 400 元/晚，其他城市 300 元/晚，超出部分自理。',
			source: '差旅管理制度 2023 版第 3 条',
			verdict:
				'注意：这个回答语气笃定、出处真实、格式完美，但数字是作废的。模型没有错，它认真读了你给它的资料；错的是被翻出来的那一页。知识库最常见的翻车方式就是这样。',
			tone: 'bad',
		};
	}
	return {
		answer:
			'所给资料里没有住宿标准的具体数字，只提到了审批流程、报销时限或与出差无关的内容。建议查阅差旅管理制度中的住宿条款。',
		source: '无',
		verdict:
			'没翻到对的页，模型老实说了「资料里没有」。这是好的表现——对比上一篇里凭印象硬答的裸模型，这是知识库带来的进步。但对新同事来说，问题还是没解决：检索这一步得修。',
		tone: 'meh',
	};
}

function setupRetrieveLab(lab: HTMLElement): void {
	const boxes = [...lab.querySelectorAll<HTMLInputElement>('input[data-nb-chunk]')];
	const hint = lab.querySelector<HTMLElement>('[data-nb-hint]');
	const submit = lab.querySelector<HTMLButtonElement>('[data-nb-submit]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	if (!hint || !submit || !reset || !result) return;

	const picked = () => boxes.filter((box) => box.checked).map((box) => box.dataset.nbChunk ?? '');

	const syncLimit = () => {
		const count = picked().length;
		for (const box of boxes) box.disabled = !box.checked && count >= 2;
		submit.disabled = count === 0;
		hint.textContent = count === 0 ? '最多选 2 段' : `已选 ${count} 段，最多 2 段`;
	};

	const show = () => {
		const ids = picked();
		const outcome = kbAnswerFor(ids);
		result.replaceChildren();
		result.dataset.tone = outcome.tone;

		const seen = document.createElement('p');
		seen.className = 'nb-kb-label';
		seen.textContent = '模型看到的输入';
		const input = document.createElement('div');
		input.className = 'nb-kb-input';
		const q = document.createElement('p');
		q.textContent = '问：出差住宿能报多少？';
		input.append(q);
		for (const id of ids) {
			const chunk = KB_CHUNKS[id];
			if (!chunk) continue;
			const block = document.createElement('p');
			const src = document.createElement('span');
			src.className = 'nb-chunk-src';
			src.textContent = chunk.src;
			block.append(src, chunk.text);
			input.append(block);
		}
		const ansLabel = document.createElement('p');
		ansLabel.className = 'nb-kb-label';
		ansLabel.textContent = '模型的回答';
		const answer = document.createElement('p');
		answer.className = 'nb-kb-answer';
		answer.textContent = outcome.answer;
		const source = document.createElement('p');
		source.className = 'nb-chunk-src';
		source.textContent = `出处：${outcome.source}`;
		const verdict = document.createElement('p');
		verdict.className = 'nb-kb-verdict';
		verdict.textContent = outcome.verdict;

		result.append(seen, input, ansLabel, answer, source, verdict);
		result.hidden = false;
		reset.hidden = false;
		submit.hidden = true;
		for (const box of boxes) box.disabled = true;
		reset.focus();
	};

	for (const box of boxes) box.addEventListener('change', syncLimit);
	submit.addEventListener('click', show);
	reset.addEventListener('click', () => {
		for (const box of boxes) box.checked = false;
		result.hidden = true;
		reset.hidden = true;
		submit.hidden = false;
		syncLimit();
		boxes[0]?.focus();
	});
	syncLimit();
}

// LAB (knowledge base) 02 — keyword match vs semantic neighbours.
const SEARCH_QUERIES: Array<{ text: string; keywords: string[]; semantic: string[] }> = [
	{ text: '住酒店能报多少钱', keywords: ['住酒店', '报多少'], semantic: ['a', 'b', 'f'] },
	{ text: '住宿标准', keywords: ['住宿标准'], semantic: ['a', 'b', 'f'] },
	{ text: '出差住宿费上限', keywords: ['住宿费', '上限'], semantic: ['a', 'b', 'f'] },
];
const SEARCH_ORDER = ['a', 'b', 'c', 'd', 'e', 'f'];

function setupSearchLab(lab: HTMLElement): void {
	const queries = lab.querySelector<HTMLElement>('[data-nb-queries]');
	const hits = lab.querySelector<HTMLElement>('[data-nb-hits]');
	const verdict = lab.querySelector<HTMLElement>('[data-nb-verdict]');
	const modes = lab.querySelectorAll<HTMLInputElement>('input[name="nb-search-mode"]');
	if (!queries || !hits || !verdict) return;

	let active = 0;
	const buttons: HTMLButtonElement[] = [];

	const render = () => {
		const query = SEARCH_QUERIES[active]!;
		const mode = [...modes].find((radio) => radio.checked)?.value ?? 'keyword';
		const ranked =
			mode === 'keyword'
				? SEARCH_ORDER.filter((id) =>
						query.keywords.some((word) => KB_CHUNKS[id]!.text.includes(word)),
					)
				: query.semantic;
		buttons.forEach((button, index) =>
			button.setAttribute('aria-pressed', String(index === active)),
		);

		hits.replaceChildren();
		for (const id of SEARCH_ORDER) {
			const chunk = KB_CHUNKS[id]!;
			const item = document.createElement('li');
			const rank = ranked.indexOf(id);
			item.className = rank >= 0 ? 'is-hit' : '';
			const badge = document.createElement('span');
			badge.className = 'nb-hit-badge';
			badge.textContent = rank >= 0 ? `第 ${rank + 1} 名` : '未命中';
			const body = document.createElement('span');
			body.className = 'nb-chunk-body';
			const src = document.createElement('span');
			src.className = 'nb-chunk-src';
			src.textContent = chunk.src;
			const text = document.createElement('span');
			text.textContent = chunk.text;
			body.append(src, text);
			item.append(badge, body);
			hits.append(item);
		}

		if (mode === 'keyword') {
			verdict.innerHTML =
				ranked.length === 0
					? `关键词搜索：<b>一段都没找到</b>。文档里写的是「住宿标准」，问题里一个字都没出现。模型什么都拿不到，只能凭印象答，或者说不知道。`
					: `关键词搜索：找到 ${ranked.length} 段，因为问题里恰好用了文档里的原词「住宿标准」。换个说法就搜不到了，试试另外两种问法。`;
		} else {
			verdict.innerHTML = `语义检索：三种问法都找到了同样的 3 段，因为比的是意思。但注意<b>第 2 名是 2023 年的旧版</b>——语义检索只管「像不像」，不管「还算不算数」。`;
		}
	};

	SEARCH_QUERIES.forEach((query, index) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'nb-pill';
		button.textContent = query.text;
		button.addEventListener('click', () => {
			active = index;
			render();
		});
		buttons.push(button);
		queries.append(button);
	});
	for (const radio of modes) radio.addEventListener('change', render);
	render();
}

// LAB (context) 01 — a tiny 8000-token desk; the opening requirement gets
// evicted from the front once the desk overflows.
const DESK_CAPACITY = 8000;
const DESK_ITEMS: Record<string, { label: string; size: number }> = {
	ask: { label: '你的问题', size: 300 },
	chat: { label: '闲聊', size: 500 },
	long: { label: '它的长回答', size: 1500 },
	doc: { label: '长合同', size: 5200 },
};
const DESK_REQ = { key: 'req', label: '你的要求', size: 600 };

function setupDeskLab(lab: HTMLElement): void {
	const bar = lab.querySelector<HTMLElement>('[data-nb-desk-bar]');
	const used = lab.querySelector<HTMLElement>('[data-nb-desk-used]');
	const evictedBox = lab.querySelector<HTMLElement>('[data-nb-desk-evicted]');
	const ask = lab.querySelector<HTMLButtonElement>('[data-nb-desk-ask]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	const adders = lab.querySelectorAll<HTMLButtonElement>('[data-nb-desk-add]');
	if (!bar || !used || !evictedBox || !ask || !reset || !result) return;

	let blocks: Array<{ key: string; label: string; size: number }> = [];
	let evicted: string[] = [];

	const render = () => {
		const total = blocks.reduce((sum, block) => sum + block.size, 0);
		used.textContent = `已用 ${total} / ${DESK_CAPACITY} token`;
		bar.replaceChildren();
		for (const block of blocks) {
			const span = document.createElement('span');
			span.className = block.key === 'req' ? 'nb-desk-block is-req' : 'nb-desk-block';
			span.style.width = `${(block.size / DESK_CAPACITY) * 100}%`;
			span.title = `${block.label} · ${block.size} token`;
			const text = document.createElement('i');
			text.textContent = block.label;
			span.append(text);
			bar.append(span);
		}
		if (evicted.length > 0) {
			evictedBox.hidden = false;
			const hasReq = evicted.includes(DESK_REQ.label);
			evictedBox.textContent = `⚠ 已被挤出桌面：${evicted.join('、')}${hasReq ? '——包括你开头的要求' : ''}`;
		} else {
			evictedBox.hidden = true;
		}
	};

	const start = () => {
		blocks = [{ ...DESK_REQ }];
		evicted = [];
		result.hidden = true;
		render();
	};

	const add = (kind: string) => {
		const item = DESK_ITEMS[kind];
		if (!item) return;
		blocks.push({ key: kind, label: item.label, size: item.size });
		let total = blocks.reduce((sum, block) => sum + block.size, 0);
		while (total > DESK_CAPACITY && blocks.length > 1) {
			const gone = blocks.shift()!;
			evicted.push(gone.label);
			total -= gone.size;
		}
		result.hidden = true;
		render();
	};

	const answer = () => {
		const reqAlive = blocks.some((block) => block.key === 'req');
		result.replaceChildren();
		result.dataset.tone = reqAlive ? 'good' : 'bad';
		const line = document.createElement('p');
		line.className = 'nb-kb-answer';
		line.textContent = reqAlive
			? '回答：「你要求全程用中文，预算 3 万 5，不能超。」'
			: '回答：「从当前对话里，我没有看到你提过整体要求。需要我们现在定一个吗？」';
		const verdict = document.createElement('p');
		verdict.className = 'nb-kb-verdict';
		verdict.textContent = reqAlive
			? '那块橙色的要求还在桌上，它当然答得一字不差。再往桌上塞点大东西试试。'
			: '它没有撒谎，也没有装傻。那条消息已经被挤出桌面，对它来说等于从未存在过——这就是「聊着聊着忘了」的真相。';
		result.append(line, verdict);
		result.hidden = false;
	};

	for (const button of adders) {
		button.addEventListener('click', () => add(button.dataset.nbDeskAdd ?? ''));
	}
	ask.addEventListener('click', answer);
	reset.addEventListener('click', start);
	start();
}

// LAB (context) 02 — compaction keeps the gist and drops the details.
const COMPACT_ANSWERS: Record<
	string,
	{ answer: string; note: string; tone: 'good' | 'bad' | 'meh' }
> = {
	budget: {
		answer: '回答：「预算之前已经确定过了。如果需要，我先按 3 万左右来规划？」',
		note: '具体数字在压缩时丢了，摘要里只剩「已确定预算」。它嘴里那个「3 万左右」是现编的——语气很稳，数字是错的。长对话后期的数字错误，多半就是这么来的。',
		tone: 'bad',
	},
	color: {
		answer: '回答：「主色是深蓝色系。」',
		note: '大方向保住了，但色号 #1B3A6B 没了。设计稿会照着「深蓝」跑偏一点点——这种半对不对的答案最难被发现。',
		tone: 'meh',
	},
	lang: {
		answer: '回答：「后续全程用中文沟通。」',
		note: '这条在摘要里完整活了下来，答得没问题。压缩不是全丢，是保大意、丢细节。',
		tone: 'good',
	},
};

function setupCompactLab(lab: HTMLElement): void {
	const transcript = lab.querySelector<HTMLElement>('[data-nb-transcript]');
	const compact = lab.querySelector<HTMLButtonElement>('[data-nb-compact]');
	const summary = lab.querySelector<HTMLElement>('[data-nb-summary]');
	const questions = lab.querySelector<HTMLElement>('[data-nb-compact-questions]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	if (!transcript || !compact || !summary || !questions || !result || !reset) return;

	compact.addEventListener('click', () => {
		transcript.classList.add('is-compacted');
		compact.hidden = true;
		summary.hidden = false;
		questions.hidden = false;
		reset.hidden = false;
	});

	for (const button of questions.querySelectorAll<HTMLButtonElement>('[data-nb-q]')) {
		button.addEventListener('click', () => {
			const outcome = COMPACT_ANSWERS[button.dataset.nbQ ?? ''];
			if (!outcome) return;
			result.replaceChildren();
			result.dataset.tone = outcome.tone;
			const answer = document.createElement('p');
			answer.className = 'nb-kb-answer';
			answer.textContent = outcome.answer;
			const note = document.createElement('p');
			note.className = 'nb-kb-verdict';
			note.textContent = outcome.note;
			result.append(answer, note);
			result.hidden = false;
		});
	}

	reset.addEventListener('click', () => {
		transcript.classList.remove('is-compacted');
		compact.hidden = false;
		summary.hidden = true;
		questions.hidden = true;
		result.hidden = true;
		reset.hidden = true;
	});
}

// LAB (training) 01 — one fill-in-the-blank drill: each round nudges the
// probabilities toward the correct word.
const FILL_WORDS = ['垫子', '键盘', '月亮'];
const FILL_ROUNDS = [
	[28, 34, 38],
	[52, 26, 22],
	[71, 17, 12],
	[85, 9, 6],
];
const FILL_LABELS = [
	'还没开始训练 · 三个词差不多，纯瞎蒙',
	'第 1 轮之后 · 「垫子」的旋钮被拧大了一点',
	'第 2 轮之后 · 差距越拉越开',
	'第 3 轮之后 · 它已经很有把握了',
];

function setupFillLab(lab: HTMLElement): void {
	const bars = lab.querySelector<HTMLElement>('[data-nb-fill-bars]');
	const roundLabel = lab.querySelector<HTMLElement>('[data-nb-fill-round]');
	const step = lab.querySelector<HTMLButtonElement>('[data-nb-fill-step]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	if (!bars || !roundLabel || !step || !reset || !result) return;

	let round = 0;

	const render = () => {
		const probs = FILL_ROUNDS[round]!;
		roundLabel.textContent = FILL_LABELS[round] ?? '';
		bars.replaceChildren();
		FILL_WORDS.forEach((word, index) => {
			const row = document.createElement('div');
			row.className = index === 0 && round > 0 ? 'nb-score-row is-leader' : 'nb-score-row';
			const name = document.createElement('span');
			name.className = 'nb-score-name';
			name.textContent = word;
			const bar = document.createElement('span');
			bar.className = 'nb-score-bar';
			const fill = document.createElement('i');
			fill.style.width = `${probs[index]}%`;
			bar.append(fill);
			const num = document.createElement('span');
			num.className = 'nb-score-num';
			num.textContent = `${probs[index]}%`;
			row.append(name, bar, num);
			bars.append(row);
		});
	};

	step.addEventListener('click', () => {
		if (round >= FILL_ROUNDS.length - 1) return;
		round += 1;
		render();
		if (round === FILL_ROUNDS.length - 1) {
			step.hidden = true;
			reset.hidden = false;
			result.replaceChildren();
			result.dataset.tone = 'good';
			const line = document.createElement('p');
			line.className = 'nb-kb-verdict';
			line.textContent =
				'三轮下来，「垫子」从 28% 涨到 85%。真实训练就是这一个动作重复数万亿次——每道题都把几百亿个旋钮朝正确答案的方向拧一丝丝。没有人告诉它「猫喜欢垫子」，这条知识是从题里自己长出来的。';
			result.append(line);
			result.hidden = false;
		}
	});
	reset.addEventListener('click', () => {
		round = 0;
		step.hidden = false;
		reset.hidden = true;
		result.hidden = true;
		render();
	});
	render();
}

// LAB (training) 02 — the same model before and after instruction tuning.
const BASEVS_PROMPTS: Array<{ text: string; base: string; sft: string }> = [
	{
		text: '怎么煮出溏心蛋？',
		base: '怎么煎出完美的牛排？怎么烤出松软的面包？怎么熬一锅不腥的鱼汤？——以上选自《厨房新手最常问的 100 个问题》目录。',
		sft: '冷藏蛋回温后，水开下锅，中火煮 6 分半，捞出立刻过冰水，剥壳即可。想更溏心就 6 分钟，想更凝固就 7 分半。',
	},
	{
		text: '帮我写一句生日祝福',
		base: '帮我写一句道歉的话。帮我写一句毕业赠言。帮我写一句年会开场白。网友还搜索了：生日祝福文案大全、朋友圈生日九宫格……',
		sft: '当然：「新的一岁，愿你被生活温柔以待，也有底气奔向想去的地方——生日快乐！」需要更正式或更俏皮的版本吗？',
	},
	{
		text: '北京有什么好玩的？',
		base: '上海有什么好玩的？成都有什么好吃的？这类问题在旅游论坛平均每天出现三千次。本文将分析「有什么好玩的」句式的传播规律……',
		sft: '看你偏好：第一次来走故宫—景山—后海一线；喜欢逛展去 798 和国博；想遛弯儿选颐和园或地坛。需要我按天数排个路线吗？',
	},
];

function setupBasevsLab(lab: HTMLElement): void {
	const prompts = lab.querySelector<HTMLElement>('[data-nb-basevs-prompts]');
	const out = lab.querySelector<HTMLElement>('[data-nb-basevs-out]');
	const verdict = lab.querySelector<HTMLElement>('[data-nb-basevs-verdict]');
	const modes = lab.querySelectorAll<HTMLInputElement>('input[name="nb-basevs-mode"]');
	if (!prompts || !out || !verdict) return;

	let active = 0;
	const buttons: HTMLButtonElement[] = [];

	const render = () => {
		const prompt = BASEVS_PROMPTS[active]!;
		const mode = [...modes].find((radio) => radio.checked)?.value ?? 'base';
		buttons.forEach((button, index) =>
			button.setAttribute('aria-pressed', String(index === active)),
		);
		out.replaceChildren();
		const q = document.createElement('p');
		q.textContent = `你：${prompt.text}`;
		const a = document.createElement('p');
		a.textContent = `它：${mode === 'base' ? prompt.base : prompt.sft}`;
		out.append(q, a);
		verdict.innerHTML =
			mode === 'base'
				? '它没有坏——它在做预训练教它的唯一一件事：<b>接着写</b>。你的问题对它来说不是问题，只是「一段开头」。'
				: '同一个模型、同一肚子知识。几万条示范对话之后，它学会的是「这是提问，该回答」——微调教的是应对方式，不是新知识。';
	};

	BASEVS_PROMPTS.forEach((prompt, index) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'nb-pill';
		button.textContent = prompt.text;
		button.addEventListener('click', () => {
			active = index;
			render();
		});
		buttons.push(button);
		prompts.append(button);
	});
	for (const radio of modes) radio.addEventListener('change', render);
	render();
}

// LAB (training) 03 — the reader labels preference pairs, then the traps are revealed.
interface RankOption {
	text: string;
	trap: boolean;
}
const RANK_ROUNDS: Array<{ q: string; a: RankOption; b: RankOption; reveal: string }> = [
	{
		q: '地球到月球有多远？',
		a: { text: '大约 38 万公里。', trap: false },
		b: {
			text: '平均约 38 万公里。月球轨道是椭圆的，最近约 36.3 万公里，最远约 40.6 万公里。',
			trap: false,
		},
		reveal:
			'这道没有陷阱，纯粹是口味题：简洁还是详尽。几十万道这样的选择，决定了模型日常「话多还是话少」。',
	},
	{
		q: '《记忆之城》这本书的作者是谁？',
		a: {
			text: '《记忆之城》的作者是张远，2018 年由人民文学出版社出版，曾获茅盾文学奖提名。',
			trap: true,
		},
		b: {
			text: '我不确定有这本书，也可能它比较冷门。建议核对一下书名，或者告诉我更多信息。',
			trap: false,
		},
		reveal:
			'陷阱题：A 的书、作者、奖项全是编的，但它「长得」特别像好答案。选了 A，就是给「一本正经地编造」投了一票。',
	},
	{
		q: '我最近总是失眠，怎么办？',
		a: {
			text: '固定作息、睡前一小时放下手机、下午之后别喝咖啡。持续几周没改善的话，建议看医生。',
			trap: false,
		},
		b: { text: '失眠说明你肝火旺。每天三杯苦瓜汁，一周痊愈。', trap: true },
		reveal: '陷阱题：B 说得斩钉截铁，可惜是危险的偏方。「自信」和「靠谱」经常不是一回事。',
	},
];

function setupRankLab(lab: HTMLElement): void {
	const stage = lab.querySelector<HTMLElement>('[data-nb-rank]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	if (!stage || !result || !reset) return;

	let picks: Array<'a' | 'b'> = [];

	const renderRound = () => {
		const round = RANK_ROUNDS[picks.length];
		stage.replaceChildren();
		if (!round) return;
		const hint = document.createElement('p');
		hint.className = 'nb-lab-hint';
		hint.textContent = `第 ${picks.length + 1} / ${RANK_ROUNDS.length} 题 · 哪个回答更好？`;
		const q = document.createElement('p');
		q.className = 'nb-rank-q';
		q.textContent = `问：${round.q}`;
		stage.append(hint, q);
		(['a', 'b'] as const).forEach((key) => {
			const option = round[key];
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'nb-rank-option';
			const tag = document.createElement('span');
			tag.className = 'nb-rank-tag';
			tag.textContent = key.toUpperCase();
			const text = document.createElement('span');
			text.textContent = option.text;
			button.append(tag, text);
			button.addEventListener('click', () => {
				picks.push(key);
				if (picks.length >= RANK_ROUNDS.length) finish();
				else renderRound();
			});
			stage.append(button);
		});
	};

	const finish = () => {
		stage.replaceChildren();
		result.replaceChildren();
		let traps = 0;
		RANK_ROUNDS.forEach((round, index) => {
			const pick = picks[index]!;
			const picked = round[pick];
			if (picked.trap) traps += 1;
			const row = document.createElement('p');
			const head = document.createElement('b');
			head.textContent = `第 ${index + 1} 题你选了 ${pick.toUpperCase()}${picked.trap ? ' ⚠ ' : ' ✓ '}`;
			row.append(head, round.reveal);
			result.append(row);
		});
		const verdict = document.createElement('p');
		verdict.className = 'nb-kb-verdict';
		verdict.textContent =
			traps === 0
				? '两道陷阱题你都避开了——但真实标注现场没有「揭晓答案」这一步：几十万道题、按件计酬，没时间逐条查证，「看起来更专业」的版本天然占便宜。'
				: `你有 ${traps} 票投给了「自信但有问题」的回答。别难过，真实标注员也常这样——而这些口味会被打分器原样学走，再放大进模型的每一次回答。第一篇里它「宁可编也不说不知道」，就是这么被一票一票教出来的。`;
		result.dataset.tone = traps === 0 ? 'good' : 'bad';
		result.append(verdict);
		result.hidden = false;
		reset.hidden = false;
	};

	reset.addEventListener('click', () => {
		picks = [];
		result.hidden = true;
		reset.hidden = true;
		renderRound();
	});
	renderRound();
}

// LAB (prompt) 01 — the same "intern", briefed two ways: one vague line vs
// background + task + requirements. The reader flips between the two briefs.
interface PromptFixCase {
	label: string;
	badPrompt: string;
	badOutput: string;
	badVerdict: string;
	goodPrompt: string;
	goodOutput: string;
	goodVerdict: string;
}
const PROMPT_FIX_CASES: PromptFixCase[] = [
	{
		label: '写周报',
		badPrompt: '帮我写个周报。',
		badOutput:
			'本周工作顺利推进，各项任务有序开展，团队协作良好。下一步将继续努力，确保各项指标圆满完成……',
		badVerdict:
			'没有一个字是错的，也没有一个字是非你不可的。它不知道你的岗位、你的领导、你本周做过什么，只能交出一份「万能周报」——万能的另一面，就是没用。',
		goodPrompt:
			'我是电商运营，给直属领导写周报。本周直播 3 场，GMV 42 万、比上周涨 15%，退货率升到 8% 是主要问题。分「成果 / 问题 / 下周计划」三段，每段不超过三行，语气务实。',
		goodOutput:
			'【成果】直播 3 场，GMV 42 万，环比 +15%。【问题】退货率升至 8%，主因是爆款 L 码缺货导致误拍。【下周计划】跟供应链对齐补货节奏，试播一场午间场。',
		goodVerdict:
			'背景（电商运营、给领导看）、任务（素材：直播、GMV、退货率）、要求（三段式、每段三行、务实）——三样齐了，交回来的就是改个称呼能直接发的东西。',
	},
	{
		label: '问旅行建议',
		badPrompt: '周末去哪玩好？',
		badOutput:
			'推荐几个热门目的地：杭州西湖风景秀丽，成都美食众多，厦门文艺清新，西安历史底蕴深厚……',
		badVerdict:
			'「好」是谁的好？和谁去、从哪出发、玩几天、预算多少——它一概不知，只能背一份大众榜单。',
		goodPrompt:
			'我和爸妈（60 多岁）从上海出发，周末两天。想要高铁 2 小时内、走路少、能吃本帮或江浙菜的地方，预算人均 800。',
		goodOutput:
			'首选苏州：高铁 25 分钟，拙政园有电瓶车、少走路，平江路吃苏帮菜，住观前街附近出行方便；备选无锡，鼋头渚坐船省脚力。两天人均 700 左右够用。',
		goodVerdict:
			'「和谁去、从哪出发、几天、预算」是背景，「推荐地方」是任务，「高铁 2 小时内、走路少」是要求。约束够清楚，它甚至主动给了备选。',
	},
	{
		label: '改文案',
		badPrompt: '帮我把这段话改得好一点。',
		badOutput:
			'改好啦：「这款保温杯采用先进技术，保温性能出色，设计精美，是您生活的好伴侣。」',
		badVerdict:
			'「好一点」是哪一点？它只能按最大公约数改——结果是同义改写，还顺手加了句广告腔。',
		goodPrompt:
			'这是保温杯电商详情页的文案，目标用户是 25–35 岁通勤女性。改得更口语，突出「12 小时保温」这个卖点，控制在 80 字以内。',
		goodOutput:
			'早八灌的热美式，加班到九点还是烫的。这只杯子能扛 12 小时——通勤路上、会议室里、健身房更衣室，热水自由，一只就够。',
		goodVerdict:
			'用途（详情页）、读者（通勤女性）、卖点（12 小时）、限制（80 字、口语）——要求越具体，它的发挥越对你的胃口。',
	},
];

function setupPromptFixLab(lab: HTMLElement): void {
	const cases = lab.querySelector<HTMLElement>('[data-nb-pf-cases]');
	const out = lab.querySelector<HTMLElement>('[data-nb-pf-out]');
	const verdict = lab.querySelector<HTMLElement>('[data-nb-pf-verdict]');
	const modes = lab.querySelectorAll<HTMLInputElement>('input[name="nb-pf-mode"]');
	if (!cases || !out || !verdict) return;

	let active = 0;
	const buttons: HTMLButtonElement[] = [];

	const render = () => {
		const current = PROMPT_FIX_CASES[active]!;
		const mode = [...modes].find((radio) => radio.checked)?.value ?? 'bad';
		buttons.forEach((button, index) =>
			button.setAttribute('aria-pressed', String(index === active)),
		);
		out.replaceChildren();
		const q = document.createElement('p');
		q.textContent = `你：${mode === 'bad' ? current.badPrompt : current.goodPrompt}`;
		const a = document.createElement('p');
		a.textContent = `它：${mode === 'bad' ? current.badOutput : current.goodOutput}`;
		out.append(q, a);
		verdict.textContent = mode === 'bad' ? current.badVerdict : current.goodVerdict;
	};

	PROMPT_FIX_CASES.forEach((item, index) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'nb-pill';
		button.textContent = item.label;
		button.addEventListener('click', () => {
			active = index;
			render();
		});
		buttons.push(button);
		cases.append(button);
	});
	for (const radio of modes) radio.addEventListener('change', render);
	render();
}

// LAB (prompt) 02 — prompt clinic: pick the stronger brief in each pair,
// then the diagnosis is revealed.
interface ClinicOption {
	text: string;
	better: boolean;
}
const CLINIC_ROUNDS: Array<{ q: string; a: ClinicOption; b: ClinicOption; reveal: string }> = [
	{
		q: '想让 AI 帮忙定一份健身计划',
		a: { text: '帮我制定一个健身计划。', better: false },
		b: {
			text: '我 28 岁，办公室久坐，想三个月减掉 5 公斤。每周能练 3 次、每次 40 分钟，家里只有一副哑铃。帮我排一份训练计划。',
			better: true,
		},
		reveal:
			'B 把背景（28 岁、久坐、只有哑铃）、任务（三个月减 5 公斤）、要求（每周 3 次、每次 40 分钟）全交代了。A 只会换回一份「适用于所有人」的模板——适用于所有人，等于不适用于你。',
	},
	{
		q: '想让 AI 检查一份租房合同',
		a: {
			text: '你是资深法务顾问。我会贴一份房屋租赁合同，请逐条找出对租客不利的条款，按风险从高到低列出来，每条说明理由。',
			better: true,
		},
		b: { text: '看看这个合同有没有问题。', better: false },
		reveal:
			'「资深法务顾问」这个角色只是锦上添花，真正起作用的是后面三个要求：逐条、从高到低、说明理由。光给角色不派活，等于只告诉实习生职称、不交代工作。',
	},
	{
		q: '第一次的回答不满意，接下来怎么做更好',
		a: { text: '删掉这个对话，重开一个，把提示词写得更长更详细。', better: false },
		b: {
			text: '直接回复：「方向对了，但语气太正式；我们没有线下门店，第二点改掉。」',
			better: true,
		},
		reveal:
			'提示词是聊出来的。一条具体反馈，比重写整段提示词省力得多、也准得多——它最擅长的就是照着你的反馈修正。',
	},
];

function setupPromptClinicLab(lab: HTMLElement): void {
	const stage = lab.querySelector<HTMLElement>('[data-nb-clinic]');
	const result = lab.querySelector<HTMLElement>('[data-nb-result]');
	const reset = lab.querySelector<HTMLButtonElement>('[data-nb-reset]');
	if (!stage || !result || !reset) return;

	let picks: Array<'a' | 'b'> = [];

	const renderRound = () => {
		const round = CLINIC_ROUNDS[picks.length];
		stage.replaceChildren();
		if (!round) return;
		const hint = document.createElement('p');
		hint.className = 'nb-lab-hint';
		hint.textContent = `第 ${picks.length + 1} / ${CLINIC_ROUNDS.length} 题 · 哪句交代更管用？`;
		const q = document.createElement('p');
		q.className = 'nb-rank-q';
		q.textContent = round.q;
		stage.append(hint, q);
		(['a', 'b'] as const).forEach((key) => {
			const option = round[key];
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'nb-rank-option';
			const tag = document.createElement('span');
			tag.className = 'nb-rank-tag';
			tag.textContent = key.toUpperCase();
			const text = document.createElement('span');
			text.textContent = option.text;
			button.append(tag, text);
			button.addEventListener('click', () => {
				picks.push(key);
				if (picks.length >= CLINIC_ROUNDS.length) finish();
				else renderRound();
			});
			stage.append(button);
		});
	};

	const finish = () => {
		stage.replaceChildren();
		result.replaceChildren();
		let right = 0;
		CLINIC_ROUNDS.forEach((round, index) => {
			const pick = picks[index]!;
			const picked = round[pick];
			if (picked.better) right += 1;
			const row = document.createElement('p');
			const head = document.createElement('b');
			head.textContent = `第 ${index + 1} 题你选了 ${pick.toUpperCase()}${picked.better ? ' ✓ ' : ' ⚠ '}`;
			row.append(head, round.reveal);
			result.append(row);
		});
		const verdict = document.createElement('p');
		verdict.className = 'nb-kb-verdict';
		verdict.textContent =
			right === CLINIC_ROUNDS.length
				? '三题全对——你已经掌握了核心判断：凡是它必须知道又不该猜的，都说出来；不满意就给反馈，而不是推倒重来。'
				: `你选对了 ${right} / ${CLINIC_ROUNDS.length} 题。回头看选错的那道：差的提示词往往只差一句话——把背景、任务、要求补上，或者把「重来」换成「给反馈」。`;
		result.dataset.tone = right === CLINIC_ROUNDS.length ? 'good' : 'meh';
		result.append(verdict);
		result.hidden = false;
		reset.hidden = false;
	};

	reset.addEventListener('click', () => {
		picks = [];
		result.hidden = true;
		reset.hidden = true;
		renderRound();
	});
	renderRound();
}

function setupNewbieLabs(): void {
	for (const lab of document.querySelectorAll<HTMLElement>('[data-nb-lab]')) {
		if (lab.dataset.nbReady === 'true') continue;
		lab.dataset.nbReady = 'true';
		lab.classList.add('is-ready');
		const kind = lab.dataset.nbLab;
		if (kind === 'next-token') setupNextTokenLab(lab);
		else if (kind === 'exam') setupExamLab(lab);
		else if (kind === 'risk') setupRiskLab(lab);
		else if (kind === 'retrieve') setupRetrieveLab(lab);
		else if (kind === 'search') setupSearchLab(lab);
		else if (kind === 'desk') setupDeskLab(lab);
		else if (kind === 'compact') setupCompactLab(lab);
		else if (kind === 'fill') setupFillLab(lab);
		else if (kind === 'basevs') setupBasevsLab(lab);
		else if (kind === 'rank') setupRankLab(lab);
		else if (kind === 'promptfix') setupPromptFixLab(lab);
		else if (kind === 'promptclinic') setupPromptClinicLab(lab);
	}
}

setupNewbieLabs();
document.addEventListener('astro:page-load', setupNewbieLabs);
