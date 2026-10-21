import { browser } from '$app/env';
import type { TrackedState, WatchedItem, WatchKind } from '#lib/types';

const KEY = 'craft-tracker-watchlist-v1';

class Watchlist {
	items = $state<WatchedItem[]>([]);

	constructor() {
		if (browser) {
			this.#load();
			window.addEventListener('storage', (e) => {
				if (e.key === KEY && e.newValue) {
					try {
						this.items = JSON.parse(e.newValue);
					} catch {
						/* ignore malformed writes from other tabs */
					}
				}
			});
		}
	}

	#load() {
		try {
			const raw = localStorage.getItem(KEY);
			this.items = raw ? JSON.parse(raw) : [];
		} catch {
			this.items = [];
		}
	}

	#persist() {
		if (browser) localStorage.setItem(KEY, JSON.stringify(this.items));
	}

	has(kind: WatchKind, repo: string, number: number): boolean {
		return this.items.some((i) => i.kind === kind && i.repo === repo && i.number === number);
	}

	add(item: WatchedItem) {
		if (!this.has(item.kind, item.repo, item.number)) {
			this.items = [item, ...this.items];
			this.#persist();
		}
	}

	remove(kind: WatchKind, repo: string, number: number) {
		this.items = this.items.filter(
			(i) => !(i.kind === kind && i.repo === repo && i.number === number)
		);
		this.#persist();
	}

	toggle(item: WatchedItem) {
		if (this.has(item.kind, item.repo, item.number)) {
			this.remove(item.kind, item.repo, item.number);
		} else {
			this.add(item);
		}
	}

	/** Merge fresh state from the server back into the local snapshot. */
	applyTracked(states: TrackedState[]) {
		const byKey = new Map(states.map((s) => [`${s.repo}#${s.number}`, s]));
		this.items = this.items.map((i) => {
			const fresh = byKey.get(`${i.repo}#${i.number}`);
			if (!fresh) return i;
			return {
				...i,
				title: fresh.title,
				state: fresh.merged ? 'merged' : fresh.state,
				url: fresh.url,
				updatedAt: fresh.updatedAt
			};
		});
		this.#persist();
	}

	clear() {
		this.items = [];
		this.#persist();
	}

	get count(): number {
		return this.items.length;
	}
}

export const watchlist = new Watchlist();
