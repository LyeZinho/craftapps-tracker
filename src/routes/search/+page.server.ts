import type { PageServerLoad } from './$types';
import { search, ORG, GitHubError } from '#lib/server/github';
import type { SearchCommit, SearchIssue } from '#lib/types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const tabParam = url.searchParams.get('tab');
	const tab: 'issues' | 'prs' | 'commits' =
		tabParam === 'commits' ? 'commits' : tabParam === 'prs' ? 'prs' : 'issues';

	if (!q) {
		return { q, tab, issues: [], prs: [], commits: [], counts: { issues: 0, prs: 0, commits: 0 }, error: undefined };
	}

	try {
		const [issues, prs, commits] = await Promise.all([
			search<SearchIssue>(`org:${ORG} is:issue ${q}`, { perPage: 30, fetch }),
			search<SearchIssue>(`org:${ORG} is:pr ${q}`, { perPage: 30, fetch }),
			search<SearchCommit>(`org:${ORG} ${q}`, { kind: 'commits', perPage: 30, fetch })
		]);
		return {
			q,
			tab,
			issues: issues.items,
			prs: prs.items,
			commits: commits.items,
			counts: {
				issues: issues.total_count,
				prs: prs.total_count,
				commits: commits.total_count
			},
			error: undefined
		};
	} catch (e) {
		if (e instanceof GitHubError) {
			return {
				q,
				tab,
				issues: [] as SearchIssue[],
				prs: [] as SearchIssue[],
				commits: [] as SearchCommit[],
				counts: { issues: 0, prs: 0, commits: 0 },
				error: e.message
			};
		}
		throw e;
	}
};
