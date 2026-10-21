import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gh } from '#lib/server/github';
import type { TrackedState } from '#lib/types';

interface TrackedRequestItem {
	repo: string;
	number: number;
	kind: 'pr' | 'issue';
}

interface TrackedResponseItem {
	title: string;
	state: string;
	merged?: boolean;
	updated_at: string;
	html_url: string;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	const body = (await request.json()) as { items?: TrackedRequestItem[] };
	const items = (body.items ?? []).slice(0, 25);

	const results = await Promise.allSettled(
		items.map(async (item): Promise<TrackedState> => {
			const data = await gh<TrackedResponseItem>(
				`/repos/${item.repo}/${item.kind === 'pr' ? 'pulls' : 'issues'}/${item.number}`,
				{ ttl: 0, fetch }
			);
			return {
				repo: item.repo,
				number: item.number,
				title: data.title,
				state: data.state,
				merged: data.merged ?? false,
				updatedAt: data.updated_at,
				url: data.html_url
			};
		})
	);

	const ok = results
		.filter((r): r is PromiseFulfilledResult<TrackedState> => r.status === 'fulfilled')
		.map((r) => r.value);

	return json({ items: ok, failed: results.length - ok.length });
};
