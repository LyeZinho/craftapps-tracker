export interface Repo {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	language: string | null;
	updated_at: string;
	pushed_at: string;
	archived: boolean;
	topics: string[];
	license: { spdx_id: string } | null;
}

export interface Label {
	name: string;
	color: string;
}

export interface SearchIssue {
	number: number;
	title: string;
	state: string;
	html_url: string;
	updated_at: string;
	created_at: string;
	comments: number;
	user: { login: string; avatar_url: string } | null;
	labels: Label[];
	body?: string;
	/** present when the item is a pull request */
	pull_request?: { url: string };
	repository_url?: string;
}

export interface Commit {
	sha: string;
	html_url: string;
	commit: {
		message: string;
		author: { name: string; date: string } | null;
	};
	author: { login: string; avatar_url: string } | null;
}

export interface SearchCommit extends Commit {
	repository: { full_name: string; name: string };
}

export interface Pr {
	number: number;
	title: string;
	state: string;
	html_url: string;
	updated_at: string;
	created_at: string;
	draft: boolean;
	user: { login: string; avatar_url: string } | null;
	labels: Label[];
}

export type ActivityItem =
	| { type: 'issue' | 'pr'; date: string; issue: SearchIssue }
	| { type: 'commit'; date: string; commit: SearchCommit };

export interface OrgEvent {
	id: string;
	type: string;
	actor: { login: string; avatar_url: string } | null;
	repo: { name: string };
	created_at: string;
	payload: {
		action?: string;
		commits?: { sha: string; message: string; author: { name: string } | null }[];
		issue?: SearchIssue;
		pull_request?: SearchIssue;
	};
}

export type WatchKind = 'pr' | 'issue';

export interface WatchedItem {
	kind: WatchKind;
	/** full repo name, e.g. `storytold/pdfcraft` */
	repo: string;
	number: number;
	title: string;
	state: string;
	url: string;
	updatedAt: string;
}

export interface TrackedState {
	repo: string;
	number: number;
	title: string;
	state: string;
	merged: boolean;
	updatedAt: string;
	url: string;
}
