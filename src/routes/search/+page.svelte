<script lang="ts">
	import type { PageProps } from './$types';
	import WatchButton from '#lib/components/WatchButton.svelte';
	import StateBadge from '#lib/components/StateBadge.svelte';
	import { repoFullNameFromIssue, timeAgo } from '#lib/utils';

	let { data }: PageProps = $props();

	let query = $state('');
	$effect(() => {
		query = data.q;
	});

	const tabs = $derived([
		{ id: 'issues' as const, label: 'Issues', count: data.counts.issues },
		{ id: 'prs' as const, label: 'Pull requests', count: data.counts.prs },
		{ id: 'commits' as const, label: 'Commits', count: data.counts.commits }
	]);

	function tabUrl(tab: string, q: string): string {
		const params = new URLSearchParams({ tab, q });
		return `/search?${params}`;
	}
</script>

<svelte:head><title>Search — Craft Tracker</title></svelte:head>

<h1>Cross-repo search</h1>
<p class="page-sub">One query across every issue, PR and commit in the org.</p>

<form class="search-form" action="/search" method="GET">
	<input type="search" name="q" placeholder="e.g. font rendering, pdf, merge conflict…" bind:value={query} />
	<input type="hidden" name="tab" value={data.tab} />
	<button class="btn primary" type="submit">Search</button>
</form>

{#if data.error}
	<div class="error-box">{data.error}</div>
{/if}

{#if data.q && !data.error}
	<div class="tabs">
		{#each tabs as tab (tab.id)}
			<a href={tabUrl(tab.id, data.q)} class:active={data.tab === tab.id}>
				{tab.label}<span class="count">({tab.count.toLocaleString()})</span>
			</a>
		{/each}
	</div>

	{#if data.tab === 'issues'}
		{#if data.issues.length === 0}
			<div class="empty">No issues match “{data.q}”.</div>
		{:else}
			<ul class="list">
				{#each data.issues as issue (issue.html_url)}
					<li>
						<div class="item-row">
							<div class="item-body">
								<a class="item-title" href={issue.html_url} target="_blank" rel="noreferrer">{issue.title}</a>
								<div class="item-meta">
									<span class="mono">{repoFullNameFromIssue(issue) ?? ''}</span>
									· #{issue.number} · by {issue.user?.login ?? 'unknown'} · updated {timeAgo(issue.updated_at)}
								</div>
							</div>
							<StateBadge state={issue.state} />
							<WatchButton
								kind="issue"
								repo={repoFullNameFromIssue(issue) ?? ''}
								number={issue.number}
								title={issue.title}
								url={issue.html_url}
							/>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if data.tab === 'prs'}
		{#if data.prs.length === 0}
			<div class="empty">No PRs match “{data.q}”.</div>
		{:else}
			<ul class="list">
				{#each data.prs as pr (pr.html_url)}
					<li>
						<div class="item-row">
							<div class="item-body">
								<a class="item-title" href={pr.html_url} target="_blank" rel="noreferrer">{pr.title}</a>
								<div class="item-meta">
									<span class="mono">{repoFullNameFromIssue(pr) ?? ''}</span>
									· #{pr.number} · by {pr.user?.login ?? 'unknown'} · updated {timeAgo(pr.updated_at)}
								</div>
							</div>
							<StateBadge state={pr.state} />
							<WatchButton
								kind="pr"
								repo={repoFullNameFromIssue(pr) ?? ''}
								number={pr.number}
								title={pr.title}
								url={pr.html_url}
							/>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		{#if data.commits.length === 0}
			<div class="empty">No commits match “{data.q}”.</div>
		{:else}
			<ul class="list">
				{#each data.commits as commit (commit.sha)}
					<li>
						<div class="item-body">
							<a class="item-title" href={commit.html_url} target="_blank" rel="noreferrer">
								{commit.commit.message.split('\n')[0]}
							</a>
							<div class="item-meta">
								<span class="mono">{commit.repository.full_name}</span>
								· <span class="commit-sha">{commit.sha.slice(0, 7)}</span>
								· {commit.commit.author?.name ?? 'unknown'}
								· {commit.commit.author ? timeAgo(commit.commit.author.date) : ''}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
{:else if !data.error}
	<div class="empty">
		Search across all storytold repos at once — try “svg”, “export”, “undo”, or a repo name.
	</div>
{/if}
