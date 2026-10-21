<script lang="ts">
	import type { Repo } from '#lib/types';

	let { repo }: { repo: Repo } = $props();

	const LANG_COLORS: Record<string, string> = {
		Rust: '#dea584',
		JavaScript: '#f1e05a',
		Python: '#3572A5',
		TypeScript: '#3178c6',
		HTML: '#e34c26',
		CSS: '#563d7c'
	};
</script>

<a class="repo-card" href={`/repos/${repo.name}`}>
	<div class="repo-card-head">
		<span class="repo-name">{repo.name}</span>
		{#if repo.archived}<span class="badge archived">archived</span>{/if}
	</div>
	{#if repo.description}
		<p class="repo-desc">{repo.description}</p>
	{/if}
	<div class="repo-meta">
		{#if repo.language}
			<span class="lang"><span class="dot" style="background: {LANG_COLORS[repo.language] ?? '#8b949e'}"></span>{repo.language}</span>
		{/if}
		<span title="Stars">★ {repo.stargazers_count.toLocaleString()}</span>
		<span title="Open issues and PRs">◎ {repo.open_issues_count}</span>
		<span title="Last push">{new Date(repo.pushed_at).toLocaleDateString()}</span>
	</div>
</a>
