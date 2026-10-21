<script lang="ts">
	import type { PageProps } from './$types';
	import ActivityFeed from '#lib/components/ActivityFeed.svelte';
	import RepoCard from '#lib/components/RepoCard.svelte';
	import { watchlist } from '#lib/watchlist.svelte';

	let { data }: PageProps = $props();

	let filter = $state('');

	const visibleRepos = $derived(
		filter.trim()
			? data.repos.filter((r) =>
					`${r.name} ${r.description ?? ''} ${(r.topics ?? []).join(' ')}`
						.toLowerCase()
						.includes(filter.trim().toLowerCase())
				)
			: data.repos
	);
</script>

<svelte:head><title>Dashboard — Craft Tracker</title></svelte:head>

{#if data.setupError}
	<h1>Setup needed</h1>
	<div class="error-box">
		<strong>Craft Tracker can't reach GitHub yet.</strong>
		<p>{data.setupError}</p>
		<code>
			echo 'GITHUB_TOKEN=ghp_yourtokenhere' >> .env<br />
			npm run dev
		</code>
	</div>
{:else}
	<h1>{data.org} overview</h1>
	<p class="page-sub">Everything happening across the org, in one place.</p>

	<div class="stats">
		<div class="stat">
			<div class="value">{data.repos.length}</div>
			<div class="label">Repositories</div>
		</div>
		<div class="stat">
			<div class="value">{data.openPrs.toLocaleString()}</div>
			<div class="label">Open PRs</div>
		</div>
		<div class="stat">
			<div class="value">{data.openIssues.toLocaleString()}</div>
			<div class="label">Open issues</div>
		</div>
		<div class="stat">
			<div class="value">{watchlist.count}</div>
			<div class="label">You're watching</div>
		</div>
	</div>

	<section class="section">
		<div class="section-head">
			<h2>Recent activity</h2>
			<a href="/search">Search everything →</a>
		</div>
		<div class="card">
			{#if data.feed.length === 0}
				<div class="empty">No recent activity found.</div>
			{:else}
				<ActivityFeed items={data.feed} max={40} />
			{/if}
		</div>
	</section>

	<section class="section">
		<div class="section-head">
			<h2>Repositories</h2>
			<input type="search" placeholder="Filter repos…" bind:value={filter} style="max-width: 240px" />
		</div>
		{#if visibleRepos.length === 0}
			<div class="empty">No repos match “{filter}”.</div>
		{:else}
			<div class="repo-grid">
				{#each visibleRepos as repo (repo.id)}
					<RepoCard {repo} />
				{/each}
			</div>
		{/if}
	</section>
{/if}
