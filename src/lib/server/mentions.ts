import { gh } from './github';

export interface ThreadItemRef {
	repo: string;
	number: number;
	title: string;
	state: string;
	isPr: boolean;
	url: string;
	labels: { name: string; color: string }[];
	updatedAt: string;
}

export interface CommitRef {
	sha: string;
	message: string;
	url: string;
	author: string | null;
	date: string | null;
}

export interface ThreadData {
	item: ThreadItemRef;
	body: string | null;
	/** items that mention this one (timeline `cross-referenced` events) */
	inbound: ThreadItemRef[];
	/** items this one mentions (parsed from body + comments) */
	outbound: ThreadItemRef[];
	/** true when more refs were found than the resolution cap */
	outboundTruncated: boolean;
	/** commits that reference/close this item (timeline `referenced`/`committed` events) */
	commits: CommitRef[];
	/** users @-mentioned in comments (`mentioned` events) */
	mentionedUsers: string[];
}

interface RawIssue {
	number: number;
	title: string;
	state: string;
	html_url: string;
	updated_at: string;
	body?: string | null;
	labels?: { name: string; color: string }[];
	user?: { login: string } | null;
	pull_request?: unknown;
	repository_url?: string;
}

interface TimelineEvent {
	event: string;
	actor?: { login: string } | null;
	created_at?: string;
	commit_id?: string | null;
	sha?: string;
	message?: string;
	author?: { login?: string } | null;
	source?: { issue?: RawIssue };
}

function toRef(repo: string, i: RawIssue): ThreadItemRef {
	return {
		repo,
		number: i.number,
		title: i.title,
		state: i.state,
		isPr: Boolean(i.pull_request),
		url: i.html_url,
		labels: (i.labels ?? []).map((l) => ({ name: l.name, color: l.color })),
		updatedAt: i.updated_at
	};
}

function repoFromUrl(repositoryUrl: string | undefined, fallback: string): string {
	if (!repositoryUrl) return fallback;
	const m = repositoryUrl.match(/repos\/(.+)$/);
	return m ? m[1] : fallback;
}

/**
 * Find issue/PR references in markdown text:
 * `#123` (same repo), `owner/repo#123`, and full github.com issue/PR URLs.
 */
export function parseRefs(text: string, currentRepo: string): { repo: string; number: number }[] {
	const found = new Map<string, { repo: string; number: number }>();
	const add = (repo: string, number: number) => {
		if (Number.isInteger(number) && number > 0) found.set(`${repo}#${number}`, { repo, number });
	};

	// full URLs: https://github.com/owner/repo/(issues|pull)/123
	for (const m of text.matchAll(/github\.com\/([\w.-]+\/[\w.-]+)\/(?:pull|issues)\/(\d+)/gi)) {
		add(m[1], Number(m[2]));
	}

	// owner/repo#123
	for (const m of text.matchAll(/([\w.-]+\/[\w.-]+)#(\d+)/g)) {
		add(m[1], Number(m[2]));
	}

	// bare #123 (same repo) — skip code spans to reduce noise
	const stripped = text.replace(/`[^`]*`/g, ' ');
	for (const m of stripped.matchAll(/#(\d+)/g)) {
		add(currentRepo, Number(m[1]));
	}

	return [...found.values()];
}

const MAX_OUTBOUND = 20;

/** Resolve parsed refs to real items, tolerating missing/inaccessible ones. */
async function resolveRefs(
	refs: { repo: string; number: number }[],
	requestFetch?: typeof fetch
): Promise<ThreadItemRef[]> {
	const capped = refs.slice(0, MAX_OUTBOUND);
	const results = await Promise.allSettled(
		capped.map(async ({ repo, number }) => {
			const data = await gh<RawIssue>(`/repos/${repo}/issues/${number}`, {
				ttl: 60_000,
				fetch: requestFetch
			});
			return toRef(repo, data);
		})
	);
	return results
		.filter((r): r is PromiseFulfilledResult<ThreadItemRef> => r.status === 'fulfilled')
		.map((r) => r.value);
}

/**
 * Build the cross-mention picture for one issue/PR:
 * who mentions it, what it mentions, and which commits reference it.
 */
export async function getThread(
	repo: string,
	number: number,
	requestFetch?: typeof fetch
): Promise<ThreadData> {
	const [issue, timeline, comments] = await Promise.all([
		gh<RawIssue>(`/repos/${repo}/issues/${number}`, { ttl: 60_000, fetch: requestFetch }),
		gh<TimelineEvent[]>(
			`/repos/${repo}/issues/${number}/timeline?per_page=100&exclude=labeled,subscribed,commented`,
			{ ttl: 60_000, fetch: requestFetch }
		).catch(() => [] as TimelineEvent[]),
		gh<{ body?: string | null }[]>(
			`/repos/${repo}/issues/${number}/comments?per_page=30`,
			{ ttl: 60_000, fetch: requestFetch }
		).catch(() => [] as { body?: string | null }[])
	]);

	const item = toRef(repo, issue);

	// inbound: other issues/PRs whose text references this item
	const inbound = new Map<string, ThreadItemRef>();
	const commits = new Map<string, CommitRef>();
	const mentionedUsers = new Set<string>();

	for (const ev of timeline) {
		if (ev.event === 'cross-referenced' && ev.source?.issue?.html_url) {
			const src = ev.source.issue;
			const srcRepo = repoFromUrl(src.repository_url, repo);
			inbound.set(`${srcRepo}#${src.number}`, toRef(srcRepo, src));
		} else if (ev.event === 'referenced' && ev.commit_id) {
			commits.set(ev.commit_id, {
				sha: ev.commit_id,
				message: 'referenced this issue',
				url: `https://github.com/${repo}/commit/${ev.commit_id}`,
				author: ev.actor?.login ?? null,
				date: ev.created_at ?? null
			});
		} else if (ev.event === 'committed' && ev.sha) {
			commits.set(ev.sha, {
				sha: ev.sha,
				message: (ev.message ?? '').split('\n')[0],
				url: `https://github.com/${repo}/commit/${ev.sha}`,
				author: ev.author?.login ?? null,
				date: ev.created_at ?? null
			});
		} else if (ev.event === 'mentioned' && ev.actor?.login) {
			mentionedUsers.add(ev.actor.login);
		}
	}

	// outbound: refs in the body and in comments
	const text = [issue.body ?? '', ...comments.map((c) => c.body ?? '')].join('\n');
	const refs = parseRefs(text, repo);
	const outbound = await resolveRefs(refs, requestFetch);

	return {
		item,
		body: issue.body ?? null,
		inbound: [...inbound.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
		outbound,
		outboundTruncated: refs.length > MAX_OUTBOUND,
		commits: [...commits.values()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
		mentionedUsers: [...mentionedUsers]
	};
}
