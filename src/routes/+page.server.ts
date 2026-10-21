import type { PageServerLoad } from './$types';
import { gh, search, ORG, GitHubError } from '#lib/server/github';
import type { ActivityItem, OrgEvent, Repo, SearchIssue } from '#lib/types';

/** Merge issue/PR search results with org events into one deduped, date-sorted feed. */
function buildFeed(issues: SearchIssue[], events: OrgEvent[]): ActivityItem[] {
	const seen = new Set<string>();
	const items: ActivityItem[] = [];

	const push = (key: string, item: ActivityItem) => {
		if (seen.has(key)) return;
		seen.add(key);
		items.push(item);
	};

	for (const issue of issues) {
		push(issue.html_url, { type: issue.pull_request ? 'pr' : 'issue', date: issue.updated_at, issue });
	}

	for (const ev of events) {
		if (ev.type === 'PushEvent') {
			for (const c of ev.payload.commits ?? []) {
				push(`commit-${c.sha}`, {
					type: 'commit',
					date: ev.created_at,
					commit: {
						sha: c.sha,
						html_url: `https://github.com/${ev.repo.name}/commit/${c.sha}`,
						commit: { message: c.message, author: c.author ? { name: c.author.name, date: ev.created_at } : null },
						author: ev.actor ? { login: ev.actor.login, avatar_url: ev.actor.avatar_url } : null,
						repository: { full_name: ev.repo.name, name: ev.repo.name.split('/')[1] ?? ev.repo.name }
					}
				});
			}
		} else if (ev.type === 'PullRequestEvent' && ev.payload.pull_request?.html_url) {
			const pr = ev.payload.pull_request;
			push(pr.html_url, {
				type: 'pr',
				date: pr.updated_at ?? ev.created_at,
				issue: { ...pr, updated_at: pr.updated_at ?? ev.created_at }
			});
		} else if (ev.type === 'IssuesEvent' && ev.payload.issue?.html_url) {
			const issue = ev.payload.issue;
			push(issue.html_url, {
				type: 'issue',
				date: issue.updated_at ?? ev.created_at,
				issue: { ...issue, updated_at: issue.updated_at ?? ev.created_at }
			});
		}
	}

	return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const [repos, recentIssues, openPrs, openIssues, events] = await Promise.all([
			gh<Repo[]>(`/orgs/${ORG}/repos?per_page=100&sort=pushed&type=org`, {
				ttl: 120_000,
				fetch
			}),
			search<SearchIssue>(`org:${ORG}`, { perPage: 40, fetch }),
			search<SearchIssue>(`org:${ORG} type:pr is:open`, { perPage: 1, fetch }),
			search<SearchIssue>(`org:${ORG} type:issue is:open`, { perPage: 1, fetch }),
			gh<OrgEvent[]>(`/orgs/${ORG}/events?per_page=60`, { ttl: 60_000, fetch }).catch(
				() => [] as OrgEvent[]
			)
		]);

		return {
			org: ORG,
			repos,
			feed: buildFeed(recentIssues.items, events),
			openPrs: openPrs.total_count,
			openIssues: openIssues.total_count,
			setupError: undefined
		};
	} catch (e) {
		if (e instanceof GitHubError) {
			return {
				org: ORG,
				repos: [] as Repo[],
				feed: [] as ActivityItem[],
				openPrs: 0,
				openIssues: 0,
				setupError: e.message
			};
		}
		throw e;
	}
};
