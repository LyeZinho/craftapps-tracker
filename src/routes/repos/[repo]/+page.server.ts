import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { gh, ORG, GitHubError } from '#lib/server/github';
import type { Commit, Pr, Repo, SearchIssue } from '#lib/types';

export const load: PageServerLoad = async ({ params }) => {
	const name = params.repo;
	try {
		const [repo, pulls, issues, commits, readme] = await Promise.allSettled([
			gh<Repo>(`/repos/${ORG}/${name}`, { ttl: 60_000 }),
			gh<Pr[]>(`/repos/${ORG}/${name}/pulls?state=open&per_page=50`, { ttl: 60_000 }),
			gh<SearchIssue[]>(`/repos/${ORG}/${name}/issues?state=open&per_page=50`, { ttl: 60_000 }),
			gh<Commit[]>(`/repos/${ORG}/${name}/commits?per_page=30`, { ttl: 60_000 }),
			gh<string>(`/repos/${ORG}/${name}/readme`, {
				ttl: 300_000,
				accept: 'application/vnd.github.html+json'
			})
		]);

		if (repo.status === 'rejected') {
			throw repo.reason;
		}

		// the issues endpoint also returns PRs — filter those out
		const openIssues =
			issues.status === 'fulfilled'
				? issues.value.filter((i) => !i.pull_request)
				: ([] as SearchIssue[]);

		return {
			fullName: `${ORG}/${name}`,
			repo: repo.value,
			openPrs: pulls.status === 'fulfilled' ? pulls.value : ([] as Pr[]),
			openIssues,
			commits: commits.status === 'fulfilled' ? commits.value : ([] as Commit[]),
			readmeHtml: readme.status === 'fulfilled' ? readme.value : null
		};
	} catch (e) {
		if (e instanceof GitHubError) error(e.status, `Can't load ${ORG}/${name}: ${e.message}`);
		throw e;
	}
};
