import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getThread } from '#lib/server/mentions';
import { GitHubError } from '#lib/server/github';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const repo = `${params.owner}/${params.repo}`;
	const number = Number(params.number);

	if (!Number.isInteger(number) || number <= 0) {
		error(400, `“${params.number}” is not a valid issue or PR number.`);
	}

	try {
		return { thread: await getThread(repo, number, fetch) };
	} catch (e) {
		if (e instanceof GitHubError) {
			error(e.status === 404 ? 404 : e.status, `Can't load ${repo}#${params.number}: ${e.message}`);
		}
		throw e;
	}
};
