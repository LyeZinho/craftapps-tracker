<script lang="ts">
	import StateBadge from './StateBadge.svelte';
	import WatchButton from './WatchButton.svelte';
	import { threadPath, timeAgo } from '#lib/utils';
	import type { ThreadItemRef } from '#lib/server/mentions';

	let { ref, compact = false }: { ref: ThreadItemRef; compact?: boolean } = $props();
</script>

<li>
	<div class="item-row">
		<div class="item-body">
			<a class="item-title" href={threadPath(ref.repo, ref.number)} title="View cross-references">
				{#if !compact}<span class="mono">{ref.repo}</span> <span class="muted">#{ref.number}</span> · {/if}{ref.title}
			</a>
			{#each ref.labels as label (label.name)}
				<span class="label-chip" style="background: #{label.color}">{label.name}</span>
			{/each}
			<div class="item-meta">
				{#if compact}
					<span class="mono">{ref.repo}</span> · #{ref.number} ·
				{/if}
				{ref.isPr ? 'PR' : 'issue'} · updated {timeAgo(ref.updatedAt)}
				· <a href={ref.url} target="_blank" rel="noreferrer">on GitHub ↗</a>
			</div>
		</div>
		<StateBadge state={ref.state} />
		<WatchButton
			kind={ref.isPr ? 'pr' : 'issue'}
			repo={ref.repo}
			number={ref.number}
			title={ref.title}
			url={ref.url}
			state={ref.state}
		/>
	</div>
</li>
