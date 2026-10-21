# Craft Tracker

One place for everything in the [storytold](https://github.com/orgs/storytold/repositories) GitHub
org — repositories, pull requests, issues and commits, in a single SvelteKit dashboard.

## Features

- **Dashboard** — org-wide stats, a merged activity feed (PRs + issues + commits across all repos,
  sorted by recency) and a filterable grid of every repository.
- **Repo detail pages** (`/repos/[repo]`) — open PRs, open issues, recent commits and the rendered
  README, each with one-click watching.
- **Cross-repo search** (`/search`) — one query searched across all issues, PRs and commits at once,
  with tabbed results and counts.
- **Cross-reference threads** (`/thread/[owner]/[repo]/[number]`) — the full mention web around any
  issue or PR: which items reference it (from the GitHub timeline API's `cross-referenced` events),
  which items it references (parsed from its description and top comments, including `#123`,
  `owner/repo#123` and github.com URLs — even cross-repo), which commits link to it
  (`referenced`/`committed` timeline events) and which users were @-mentioned. Reach it via the ⇄
  button on any issue/PR row.
- **Watchlist** (`/watchlist`) — star PRs/issues to track them; stored in your browser, with a
  "refresh state" button that pulls their latest status from GitHub.

## Setup

```sh
npm install
cp .env.example .env   # then put your GitHub token in .env
npm run dev
```

The token only needs **read access to public repositories** (no scopes for classic tokens). Without
it the GitHub API allows just 60 requests/hour, which is exhausted almost immediately.

Optional `.env` keys:

| Key           | Default     | Purpose                          |
| ------------- | ----------- | -------------------------------- |
| `GITHUB_TOKEN`| *(required)*| GitHub API auth                  |
| `GITHUB_ORG`  | `storytold` | Which org to track               |

## Notes

- API responses are cached in memory for 60–120 s, so page loads stay fast and well inside the
  5,000 req/hour core-API and 30 req/min search-API limits.
- The watchlist is per-browser (localStorage) — no backend database required.
