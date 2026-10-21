import { GITHUB_TOKEN, GITHUB_ORG } from '$app/env/private';

const API = 'https://api.github.com';

export const ORG = GITHUB_ORG;

const TOKEN = GITHUB_TOKEN;

export class GitHubError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
		this.name = 'GitHubError';
	}
}

interface CacheEntry {
	at: number;
	data: unknown;
	ttl: number;
}

const cache = new Map<string, CacheEntry>();

/** Raw GitHub API GET with a tiny in-memory TTL cache (default 60s). */
export async function gh<T>(
	path: string,
	opts: { ttl?: number; accept?: string } = {}
): Promise<T> {
	const ttl = opts.ttl ?? 60_000;
	const key = `${opts.accept ?? ''}|${path}`;

	if (ttl > 0) {
		const hit = cache.get(key);
		if (hit && Date.now() - hit.at < hit.ttl) return hit.data as T;
	}

	if (!TOKEN) {
		throw new GitHubError(
			'GITHUB_TOKEN is not set. Add it to a .env file to start tracking the org.',
			401
		);
	}

	const res = await fetch(API + path, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			Accept: opts.accept ?? 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
		throw new GitHubError('GitHub API rate limit exceeded. Try again in a few minutes.', 429);
	}

	if (!res.ok) {
		let message = `GitHub API error (${res.status})`;
		try {
			const body = (await res.json()) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			/* ignore */
		}
		throw new GitHubError(message, res.status);
	}

	const data =
		opts.accept === 'application/vnd.github.html+json' ? await res.text() : await res.json();

	if (ttl > 0) cache.set(key, { at: Date.now(), data, ttl });
	return data as T;
}

export async function search<T>(
	query: string,
	opts: { kind?: 'issues' | 'commits'; perPage?: number; page?: number } = {}
): Promise<{ total_count: number; items: T[] }> {
	const perPage = opts.perPage ?? 40;
	const page = opts.page ?? 1;
	const path =
		opts.kind === 'commits'
			? `/search/commits?q=${encodeURIComponent(query)}&sort=committer-date&order=desc&per_page=${perPage}&page=${page}`
			: `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${perPage}&page=${page}`;
	return gh(path, { ttl: 60_000 });
}
