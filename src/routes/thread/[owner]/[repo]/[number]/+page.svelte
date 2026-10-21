<script lang="ts">
	import type { PageProps } from './$types';
	import MentionRow from '#lib/components/MentionRow.svelte';
	import StateBadge from '#lib/components/StateBadge.svelte';
	import WatchButton from '#lib/components/WatchButton.svelte';
	import { timeAgo } from '#lib/utils';

	let { data }: PageProps = $props();

	const t = $derived(data.thread);
</script>

<svelte:head>
	<title>{t.item.repo}#{t.item.number} cross-references — Craft Tracker</title>
</svelte:head>

<div class="repo-header">
	<div>
		<div class="item-meta" style="margin-bottom: 4px">
			<a href={t.item.url} target="_blank" rel="noreferrer" class="mono">{t.item.repo}</a>
			· {t.item.isPr ? 'pull request' : 'issue'} #{t.item.number}
		</div>
		<h1 style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
			{t.item.title}
			<StateBadge state={t.item.state} />
		</h1>
		{#if t.body}
			<details style="margin-top: 8px">
				<summary class="item-meta" style="cursor: pointer">Description</summary>
				<div class="body-preview">{t.body}</div>
			</details>
		{/if}
	</div>
	<div style="display: flex; gap: 8px; flex: none">
		<WatchButton
			kind={t.item.isPr ? 'pr' : 'issue'}
			repo={t.item.repo}
			number={t.item.number}
			title={t.item.title}
			url={t.item.url}
			state={t.item.state}
		/>
		<a class="btn" href={t.item.url} target="_blank" rel="noreferrer">On GitHub ↗</a>
	</div>
</div>

<div class="stats">
	<div class="stat">
		<div class="value">{t.inbound.length}</div>
		<div class="label">Mentioned by</div>
	</div>
	<div class="stat">
		<div class="value">{t.outbound.length}</div>
		<div class="label">References</div>
	</div>
	<div class="stat">
		<div class="value">{t.commits.length}</div>
		<div class="label">Commits linked</div>
	</div>
	<div class="stat">
		<div class="value">{t.mentionedUsers.length}</div>
		<div class="label">Users @-mentioned</div>
	</div>
</div>

<section class="section">
	<div class="section-head">
		<h2>Mentioned by ({t.inbound.length})</h2>
	</div>
	{#if t.inbound.length === 0}
		<div class="empty">Nothing references this item (based on the latest 100 timeline events).</div>
	{:else}
		<ul class="list">
			{#each t.inbound as ref (`${ref.repo}#${ref.number}`)}
				<MentionRow {ref} />
			{/each}
		</ul>
	{/if}
</section>

<section class="section">
	<div class="section-head">
		<h2>References ({t.outbound.length})</h2>
	</div>
	{#if t.outbound.length === 0}
		<div class="empty">This item doesn't reference any other issues or PRs.</div>
	{:else}
		<ul class="list">
			{#each t.outbound as ref (`${ref.repo}#${ref.number}`)}
				<MentionRow {ref} />
			{/each}
		</ul>
		{#if t.outboundTruncated}
			<p class="item-meta" style="margin-top: 8px">Only the first 20 references are resolved.</p>
		{/if}
	{/if}
</section>

<section class="section">
	<div class="section-head">
		<h2>Linked commits ({t.commits.length})</h2>
	</div>
	{#if t.commits.length === 0}
		<div class="empty">No commits reference this item.</div>
	{:else}
		<ul class="list">
			{#each t.commits as commit (commit.sha)}
				<li>
					<div class="item-body">
						<a class="item-title" href={commit.url} target="_blank" rel="noreferrer">
							{commit.message || commit.sha.slice(0, 7)}
						</a>
						<div class="item-meta">
							<span class="commit-sha">{commit.sha.slice(0, 7)}</span>
							· {commit.author ?? 'unknown'}
							{#if commit.date}· {timeAgo(commit.date)}{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if t.mentionedUsers.length > 0}
	<section class="section">
		<div class="section-head">
			<h2>Users @-mentioned ({t.mentionedUsers.length})</h2>
		</div>
		<div class="card" style="display: flex; flex-wrap: wrap; gap: 8px">
			{#each t.mentionedUsers as user (user)}
				<a class="badge kind" href={`https://github.com/${user}`} target="_blank" rel="noreferrer">
					@{user}
				</a>
			{/each}
		</div>
	</section>
{/if}

<p class="item-meta">
	Built from the GitHub timeline API (latest 100 events) + references parsed from the description
	and top comments.
	{#if t.item.repo && t.item.number}
		· <a href={`/repos/${t.item.repo.split('/')[1]}`}>Back to {t.item.repo}</a>
	{/if}
</p>
