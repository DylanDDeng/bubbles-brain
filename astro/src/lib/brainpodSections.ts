/** The original site's navigation hierarchy, shared by the collection room. */
export const brainPodSections = [
	{
		id: 'tutorials',
		title: '教程',
		children: ['newbie-tutorials', 'codex-tutorials', 'pi-agent-tutorials', 'workbuddy-tutorials'],
	},
	{
		id: 'vibe-coding',
		title: 'Vibe Coding',
		children: ['vibe-coding-terms', 'vibe-coding-skills', 'vibe-coding-design'],
	},
	{ id: 'highlights', title: '精选阅读', children: ['highlights'] },
] as const;

export function brainPodParent(collection: string) {
	return brainPodSections.find((section) => section.children.some((id) => id === collection));
}
