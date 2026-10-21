<script lang="ts">
	import StateBadge from './StateBadge.svelte';
	import { repoFullNameFromIssue, threadPath, timeAgo } from '#lib/utils';
	import type { ActivityItem } from '#lib/types';

	let { items, max = 60 }: { items: ActivityItem[]; max?: number } = $props();
</script>

<ul class="activity">
	{#each items.slice(0, max) as item (item.type === 'commit' ? item.commit.sha : `${item.issue.pull_request ? 'pr' : 'issue'}-${item.issue.html_url}`)}
		<li class="activity-row">
			{#if item.type === 'commit'}
				{@const commit = item.commit}
				<span class="activity-icon commit" title="Commit">⑂</span>
				<div class="activity-body">
					<a href={commit.html_url} target="_blank" rel="noreferrer" class="activity-title">
						{commit.commit.message.split('\n')[0]}
					</a>
					<div class="activity-meta">
						<span class="mono">{commit.repository.full_name}</span>
						· commit <code>{commit.sha.slice(0, 7)}</code>
						· {commit.commit.author?.name ?? 'unknown'}
						· <span title={new Date(item.date).toLocaleString()}>{timeAgo(item.date)}</span>
					</div>
				</div>
			{:else}
				{@const issue = item.issue}
				{@const isPr = Boolean(issue.pull_request)}
				{@const repoName = repoFullNameFromIssue(issue)}
				<span class="activity-icon {isPr ? 'pr' : 'issue'}" title={isPr ? 'Pull request' : 'Issue'}>
					{isPr ? '⎇' : '●'}
				</span>
				<div class="activity-body">
					<a href={issue.html_url} target="_blank" rel="noreferrer" class="activity-title">
						{issue.title}
					</a>
					<div class="activity-meta">
						<span class="mono">{repoName ?? 'unknown-repo'}</span>
						· {isPr ? 'PR' : 'issue'} #{issue.number}
						· opened by {issue.user?.login ?? 'unknown'}
						· <span title={new Date(item.date).toLocaleString()}>{timeAgo(item.date)}</span>
					</div>
				</div>
				{#if repoName}
					<a class="thread-link" href={threadPath(repoName, issue.number)} title="Cross-references">⇄</a>
				{/if}
				<StateBadge state={isPr && issue.state === 'closed' ? 'merged' : issue.state} />
			{/if}
		</li>
	{/each}
</ul>
