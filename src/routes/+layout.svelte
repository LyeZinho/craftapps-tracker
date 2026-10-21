<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { watchlist } from '#lib/watchlist.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/search', label: 'Search' },
		{ href: '/watchlist', label: 'Watchlist', badge: () => watchlist.count }
	];

	function active(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Craft Tracker — storytold</title>
</svelte:head>

<div class="shell">
	<header class="topbar">
		<a class="brand" href="/">
			<span class="logo">✦</span> Craft Tracker
			<span class="badge kind">storytold</span>
		</a>
		<nav class="main">
			{#each links as link (link.href)}
				<a href={link.href} class:active={active(link.href)}>
					{link.label}{#if link.badge && link.badge() > 0}<span class="count">{link.badge()}</span>{/if}
				</a>
			{/each}
		</nav>
	</header>

	<main class="page">
		{@render children()}
	</main>

	<footer class="site">One place for every storyTold repo, PR, issue and commit.</footer>
</div>
