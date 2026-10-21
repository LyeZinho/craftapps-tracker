<script lang="ts">
	import { watchlist } from '#lib/watchlist.svelte';
	import type { WatchKind } from '#lib/types';

	let {
		kind,
		repo,
		number,
		title,
		url,
		state = 'open'
	}: {
		kind: WatchKind;
		repo: string;
		number: number;
		title: string;
		url: string;
		state?: string;
	} = $props();

	const watched = $derived(watchlist.has(kind, repo, number));

	function toggle() {
		watchlist.toggle({ kind, repo, number, title, state, url, updatedAt: new Date().toISOString() });
	}
</script>

<button class="watch-btn" class:on={watched} onclick={toggle} title={watched ? 'Stop watching' : 'Watch this item'}>
	{watched ? '★ Watching' : '☆ Watch'}
</button>
