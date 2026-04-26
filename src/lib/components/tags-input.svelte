<script lang="ts">
	import { X } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type Suggestion = { id: number; name: string; slug: string };

	type Props = {
		value: string[];
		placeholder?: string;
		id?: string;
		class?: string;
	};

	let { value = $bindable([]), placeholder = 'Add tag…', id, class: className }: Props = $props();

	let query = $state('');
	let suggestions = $state<Suggestion[]>([]);
	let open = $state(false);
	let inputEl: HTMLInputElement | undefined;
	let activeIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let abortCtrl: AbortController | null = null;

	function normalize(s: string) {
		return s.trim().toLowerCase();
	}

	function addTag(raw: string) {
		const t = normalize(raw);
		if (!t) return;
		if (value.some((v) => normalize(v) === t)) return;
		if (value.length >= 20) return;
		value = [...value, t];
		query = '';
		suggestions = [];
		open = false;
		activeIndex = -1;
	}

	function removeTag(idx: number) {
		value = value.filter((_, i) => i !== idx);
	}

	async function fetchSuggestions(q: string) {
		abortCtrl?.abort();
		abortCtrl = new AbortController();
		try {
			const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=8`, {
				signal: abortCtrl.signal
			});
			if (!res.ok) return;
			const data = (await res.json()) as { tags: Suggestion[] };
			const taken = new Set(value.map(normalize));
			suggestions = data.tags.filter((t) => !taken.has(normalize(t.name)));
			activeIndex = suggestions.length > 0 ? 0 : -1;
			open = true;
		} catch (err) {
			if ((err as Error).name !== 'AbortError') console.error(err);
		}
	}

	function onInput(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		query = v;
		if (debounceTimer) clearTimeout(debounceTimer);
		const q = v.trim();
		if (!q) {
			suggestions = [];
			open = false;
			return;
		}
		debounceTimer = setTimeout(() => fetchSuggestions(q), 150);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (open && activeIndex >= 0 && suggestions[activeIndex]) {
				addTag(suggestions[activeIndex].name);
			} else if (query.trim()) {
				addTag(query);
			}
			return;
		}
		if (e.key === ',') {
			e.preventDefault();
			if (query.trim()) addTag(query);
			return;
		}
		if (e.key === 'Backspace' && !query && value.length > 0) {
			value = value.slice(0, -1);
			return;
		}
		if (e.key === 'ArrowDown' && open && suggestions.length > 0) {
			e.preventDefault();
			activeIndex = (activeIndex + 1) % suggestions.length;
			return;
		}
		if (e.key === 'ArrowUp' && open && suggestions.length > 0) {
			e.preventDefault();
			activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
			return;
		}
		if (e.key === 'Escape') {
			open = false;
			activeIndex = -1;
		}
	}

	function onBlur() {
		setTimeout(() => {
			open = false;
			activeIndex = -1;
		}, 120);
	}
</script>

<div class={cn('relative', className)}>
	<div
		class="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-ring"
	>
		{#each value as tag, i (tag + i)}
			<span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
				{tag}
				<button
					type="button"
					class="text-primary/70 hover:text-primary"
					aria-label="Remove {tag}"
					onclick={() => removeTag(i)}
				>
					<X class="size-3" />
				</button>
			</span>
		{/each}

		<input
			{id}
			bind:this={inputEl}
			type="text"
			value={query}
			oninput={onInput}
			onkeydown={onKeydown}
			onblur={onBlur}
			onfocus={() => {
				if (query.trim()) fetchSuggestions(query.trim());
			}}
			{placeholder}
			class="min-w-[6ch] flex-1 bg-transparent px-1 py-0.5 text-base outline-none placeholder:text-muted-foreground"
			autocomplete="off"
		/>
	</div>

	{#if open && suggestions.length > 0}
		<ul
			class="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover py-1 shadow-md"
			role="listbox"
		>
			{#each suggestions as s, i}
				<li>
					<button
						type="button"
						class={cn(
							'flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
							activeIndex === i && 'bg-accent text-accent-foreground'
						)}
						onmousedown={(e) => {
							e.preventDefault();
							addTag(s.name);
						}}
					>
						{s.name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
