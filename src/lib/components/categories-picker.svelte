<script lang="ts">
	import type { Category } from '$lib/types/taxonomy';
	import Button from './ui/button.svelte';
	import Dialog from './ui/dialog.svelte';
	import Checkbox from './ui/checkbox.svelte';
	import Input from './ui/input.svelte';
	import { ChevronDown, Plus, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		value: number[];
		categories: Category[];
		buttonLabel?: string;
	};

	let {
		value = $bindable([]),
		categories = $bindable([]),
		buttonLabel = 'Categories'
	}: Props = $props();

	let open = $state(false);
	let draft = $state<number[]>([...value]);
	let filter = $state('');
	let creating = $state(false);

	$effect(() => {
		if (open) {
			draft = [...value];
			filter = '';
		}
	});

	const filtered = $derived(
		filter.trim()
			? categories.filter((c) => c.name.toLowerCase().includes(filter.trim().toLowerCase()))
			: categories
	);

	const exactMatch = $derived(
		!!filter.trim() &&
			categories.some((c) => c.name.toLowerCase() === filter.trim().toLowerCase())
	);

	const canCreate = $derived(!!filter.trim() && !exactMatch && !creating);

	const selectedNames = $derived(
		categories.filter((c) => value.includes(c.id)).map((c) => c.name)
	);

	function toggle(id: number, checked: boolean) {
		if (checked) {
			if (!draft.includes(id)) draft = [...draft, id];
		} else {
			draft = draft.filter((d) => d !== id);
		}
	}

	async function addCategory() {
		const name = filter.trim();
		if (!name) return;
		creating = true;
		try {
			const res = await fetch('/api/categories', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name })
			});
			if (!res.ok) {
				const msg = await res.text().catch(() => '');
				throw new Error(msg || `Server returned ${res.status}`);
			}
			const data = (await res.json()) as { category: Category };
			if (!categories.some((c) => c.id === data.category.id)) {
				categories = [...categories, data.category].sort((a, b) =>
					a.name.localeCompare(b.name)
				);
			}
			if (!draft.includes(data.category.id)) draft = [...draft, data.category.id];
			filter = '';
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : 'Could not add category');
		} finally {
			creating = false;
		}
	}

	function onFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canCreate) {
			e.preventDefault();
			addCategory();
		}
	}

	function commit() {
		value = [...draft];
		open = false;
	}

	function cancel() {
		open = false;
	}
</script>

<Button
	type="button"
	variant="outline"
	class="w-full justify-between"
	onclick={() => (open = true)}
>
	<span class="truncate text-left">
		{#if selectedNames.length === 0}
			<span class="text-muted-foreground">Select {buttonLabel.toLowerCase()}…</span>
		{:else if selectedNames.length <= 2}
			{selectedNames.join(', ')}
		{:else}
			{selectedNames.slice(0, 2).join(', ')} +{selectedNames.length - 2} more
		{/if}
	</span>
	<ChevronDown class="size-4 opacity-60" />
</Button>

<Dialog bind:open title={buttonLabel} description="Select all that apply.">
	<Input
		type="search"
		placeholder="Filter or type a new one…"
		bind:value={filter}
		onkeydown={onFilterKeydown}
		class="mt-1"
	/>

	<div class="-mx-2 max-h-72 overflow-y-auto px-2">
		{#if filtered.length === 0 && !canCreate}
			<p class="px-1 py-6 text-center text-sm text-muted-foreground">No matches.</p>
		{:else}
			<ul class="flex flex-col">
				{#each filtered as cat (cat.id)}
					{@const checked = draft.includes(cat.id)}
					<li>
						<label class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
							<Checkbox
								checked={checked}
								onCheckedChange={(v: boolean) => toggle(cat.id, v)}
							/>
							<span class="text-sm">{cat.name}</span>
						</label>
					</li>
				{/each}
			</ul>
		{/if}

		{#if canCreate}
			<button
				type="button"
				class="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2 text-left text-sm text-primary hover:bg-accent disabled:opacity-50"
				disabled={creating}
				onclick={addCategory}
			>
				{#if creating}
					<Loader2 class="size-4 animate-spin" />
				{:else}
					<Plus class="size-4" />
				{/if}
				<span>Add &ldquo;<span class="font-medium">{filter.trim()}</span>&rdquo;</span>
			</button>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="outline" onclick={cancel}>Cancel</Button>
		<Button onclick={commit}>Done</Button>
	{/snippet}
</Dialog>
