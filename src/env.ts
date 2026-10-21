import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GITHUB_TOKEN: {
		description: 'GitHub personal access token (read access to public repos)',
		// optional: the app shows a setup hint when missing
		schema: (value) => value || undefined
	},
	GITHUB_ORG: {
		description: 'GitHub org to track',
		schema: (value) => value || 'storytold'
	}
});
