import { describe, expect, it } from 'vitest';
import { brainPodParent, brainPodSections } from './brainpodSections';
import { buildBrainPodLibrary } from './brainpod';
import { buildKnowledgeSearchIndex } from './searchIndex';

describe('Collection room section hierarchy', () => {
	it('assigns every published collection to exactly one top-level section', async () => {
		const library = buildBrainPodLibrary(await buildKnowledgeSearchIndex({ locale: 'zh-CN' }));
		const children = brainPodSections.flatMap((section) => [...section.children]);
		expect(children).toHaveLength(new Set(children).size);
		expect(new Set(children)).toEqual(
			new Set(library.collections.map((collection) => collection.id)),
		);
	});
	it('preserves tutorial and Vibe Coding parents for existing deep links', () => {
		expect(brainPodParent('codex-tutorials')?.id).toBe('tutorials');
		expect(brainPodParent('vibe-coding-skills')?.id).toBe('vibe-coding');
		expect(brainPodParent('highlights')?.id).toBe('highlights');
		expect(brainPodParent('missing')).toBeUndefined();
	});
});
