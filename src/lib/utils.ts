/** Extract the `owner/repo` full name from a search-result issue's repository_url. */
export function repoFullNameFromIssue(issue: { repository_url?: string }): string | undefined {
	if (!issue.repository_url) return undefined;
	const match = issue.repository_url.match(/repos\/(.+)$/);
	return match?.[1];
}

/** Human-friendly "x time ago" label. */
export function timeAgo(date: string): string {
	const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(date).toLocaleDateString();
}

/** App-internal path to the cross-mention thread view of an issue/PR. */
export function threadPath(repo: string, number: number): string {
	return `/thread/${repo}/${number}`;
}
