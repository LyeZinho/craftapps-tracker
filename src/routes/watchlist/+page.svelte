<script lang="ts">
	import { watchlist } from '#lib/watchlist.svelte';
	import StateBadge from '#lib/components/StateBadge.svelte';
	import { threadPath, timeAgo } from '#lib/utils';
	import type { TrackedState } from '#lib/types';

	let refreshing = $state(false);
	let refreshNote = $state<string | null>(null);

	const prs = $derived(watchlist.items.filter((i) => i.kind === 'pr'));
	const issues = $derived(watchlist.items.filter((i) => i.kind === 'issue'));

	async function refresh() {
		refreshing = true;
		refreshNote = null;
		try {
			const res = await fetch('/api/tracked', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					items: watchlist.items.map(({ repo, number, kind }) => ({ repo, number, kind }))
				})
			});
			if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
			const data = (await res.json()) as { items: TrackedState[]; failed: number };
			watchlist.applyTracked(data.items);
			refreshNote =
				data.failed > 0
					? `Updated ${data.items.length} items (${data.failed} couldn't be refreshed — they may be gone).`
					: `Updated ${data.items.length} items.`;
		} catch (e) {
			refreshNote = e instanceof Error ? e.message : 'Refresh failed.';
		} finally {
			refreshing = false;
		}
	}

</script>

<svelte:head><title>Watchlist — Craft Tracker</title></svelte:head>

<div class="section-head">
	<div>
		<h1>Watchlist</h1>
		<p class="page-sub">PRs and issues you're tracking across the org. Saved in this browser.</p>
	</div>
	{#if watchlist.count > 0}
		<div style="display: flex; gap: 8px">
			<button class="btn" onclick={refresh} disabled={refreshing}>
				{refreshing ? 'Refreshing…' : '↻ Refresh state'}
			</button>
			<button class="btn danger" onclick={() => watchlist.clear()}>Clear all</button>
		</div>
	{/if}
</div>

{#if refreshNote}
	<p class="page-sub">{refreshNote}</p>
{/if}

{#if watchlist.count === 0}
	<div class="empty">
		Nothing watched yet.<br />
		Open a <a href="/">repo</a> or <a href="/search">search</a> and hit “☆ Watch” on any PR or issue
		to track it here.
	</div>
{:else}
	{#if prs.length > 0}
		<section class="section">
			<div class="section-head"><h2>Pull requests ({prs.length})</h2></div>
			<ul class="list">
				{#each prs as item (`${item.repo}#${item.number}`)}
					<li>
						<div class="item-row">
							<div class="item-body">
								<a class="item-title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
								<div class="item-meta">
									<span class="mono">{item.repo}</span> · #{item.number} · updated {timeAgo(item.updatedAt)}
								</div>
							</div>
							<a class="thread-link" href={threadPath(item.repo, item.number)} title="Cross-references">⇄</a>
							<StateBadge state={item.state} />
							<button
								class="watch-btn"
								onclick={() => watchlist.remove('pr', item.repo, item.number)}
								title="Stop watching">✕</button
							>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if issues.length > 0}
		<section class="section">
			<div class="section-head"><h2>Issues ({issues.length})</h2></div>
			<ul class="list">
				{#each issues as item (`${item.repo}#${item.number}`)}
					<li>
						<div class="item-row">
							<div class="item-body">
								<a class="item-title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
								<div class="item-meta">
									<span class="mono">{item.repo}</span> · #{item.number} · updated {timeAgo(item.updatedAt)}
								</div>
							</div>
							<a class="thread-link" href={threadPath(item.repo, item.number)} title="Cross-references">⇄</a>
							<StateBadge state={item.state} />
							<button
								class="watch-btn"
								onclick={() => watchlist.remove('issue', item.repo, item.number)}
								title="Stop watching">✕</button
							>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}
