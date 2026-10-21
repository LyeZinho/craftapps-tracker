<script lang="ts">
	import type { PageProps } from './$types';
	import WatchButton from '#lib/components/WatchButton.svelte';
	import { threadPath, timeAgo } from '#lib/utils';

	let { data }: PageProps = $props();

	const repo = $derived(data.repo);
</script>

<svelte:head><title>{repo.name} — Craft Tracker</title></svelte:head>

<div class="repo-header">
	<div>
		<h1><span class="owner">{data.fullName.split('/')[0]}/</span>{repo.name}</h1>
		{#if repo.description}
			<p class="page-sub" style="margin-bottom: 8px">{repo.description}</p>
		{/if}
		<div class="repo-meta">
			{#if repo.language}<span class="lang"><span class="dot" style="background: #dea584"></span>{repo.language}</span>{/if}
			<span title="Stars">★ {repo.stargazers_count.toLocaleString()}</span>
			<span title="Forks">⑂ {repo.forks_count.toLocaleString()}</span>
			<span title="Open issues and PRs">◎ {repo.open_issues_count} open</span>
			{#if repo.license && repo.license.spdx_id !== 'NOASSERTION'}<span>{repo.license.spdx_id}</span>{/if}
			{#each repo.topics as topic (topic)}<span class="badge kind">{topic}</span>{/each}
		</div>
	</div>
	<a class="btn" href={repo.html_url} target="_blank" rel="noreferrer">View on GitHub ↗</a>
</div>

<section class="section">
	<div class="section-head"><h2>Open pull requests ({data.openPrs.length})</h2></div>
	{#if data.openPrs.length === 0}
		<div class="empty">No open PRs. 🎉</div>
	{:else}
		<ul class="list">
			{#each data.openPrs as pr (pr.number)}
				<li>
					<div class="item-row">
						<div class="item-body">
							<a class="item-title" href={pr.html_url} target="_blank" rel="noreferrer">{pr.title}</a>
							{#if pr.draft}<span class="badge kind">draft</span>{/if}
							<div class="item-meta">
								#{pr.number} · opened by {pr.user?.login ?? 'unknown'} · updated {timeAgo(pr.updated_at)}
							</div>
						</div>
						<a class="thread-link" href={threadPath(data.fullName, pr.number)} title="Cross-references">⇄</a>
						<WatchButton
							kind="pr"
							repo={data.fullName}
							number={pr.number}
							title={pr.title}
							url={pr.html_url}
						/>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="section">
	<div class="section-head"><h2>Open issues ({data.openIssues.length})</h2></div>
	{#if data.openIssues.length === 0}
		<div class="empty">No open issues. 🎉</div>
	{:else}
		<ul class="list">
			{#each data.openIssues as issue (issue.number)}
				<li>
					<div class="item-row">
						<div class="item-body">
							<a class="item-title" href={issue.html_url} target="_blank" rel="noreferrer">{issue.title}</a>
							{#each issue.labels as label (label.name)}
								<span class="label-chip" style="background: #{label.color}">{label.name}</span>
							{/each}
							<div class="item-meta">
								#{issue.number} · opened by {issue.user?.login ?? 'unknown'} · updated {timeAgo(issue.updated_at)}
							</div>
						</div>
						<a class="thread-link" href={threadPath(data.fullName, issue.number)} title="Cross-references">⇄</a>
						<WatchButton
							kind="issue"
							repo={data.fullName}
							number={issue.number}
							title={issue.title}
							url={issue.html_url}
						/>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="section">
	<div class="section-head"><h2>Recent commits</h2></div>
	{#if data.commits.length === 0}
		<div class="empty">No recent commits.</div>
	{:else}
		<ul class="list">
			{#each data.commits as commit (commit.sha)}
				<li>
					<div class="item-body">
						<a class="item-title" href={commit.html_url} target="_blank" rel="noreferrer">
							{commit.commit.message.split('\n')[0]}
						</a>
						<div class="item-meta">
							<span class="commit-sha">{commit.sha.slice(0, 7)}</span>
							· {commit.commit.author?.name ?? 'unknown'}
							· {commit.commit.author ? timeAgo(commit.commit.author.date) : ''}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if data.readmeHtml}
	<section class="section">
		<div class="section-head"><h2>README</h2></div>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- rendered by GitHub's API -->
		<div class="readme">{@html data.readmeHtml}</div>
	</section>
{/if}
