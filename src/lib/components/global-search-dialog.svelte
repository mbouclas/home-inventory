<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, Tags, Shapes, Pill, ChevronRight } from '@lucide/svelte';
	import Sheet from '$lib/components/ui/sheet.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import type { InventoryItem } from '$lib/types/inventory';

	let { open = $bindable(false) }: { open?: boolean } = $props();
	let query = $state('');
	let searchText = $state('');
	const results = $derived(inventory.globalSearch(searchText));
	const hasQuery = $derived(searchText.trim().length > 0);
	const hasResults = $derived(results.items.length > 0 || results.categories.length > 0 || results.tags.length > 0);

	function runSearch() {
		searchText = query;
	}

	function closeAndGo(path: string) {
		open = false;
		goto(path);
	}
</script>

<Sheet bind:open title="Search inventory" description="Search item names, categories, and tags." class="gap-3">
	<div class="relative">
		<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			type="search"
			placeholder="Search medicine, category, or tag"
			class="pl-9"
			bind:value={query}
			oninput={runSearch}
			onkeyup={runSearch}
			autofocus
			aria-label="Global search"
		/>
	</div>

	{#if !inventory.ready}
		<p class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Loading inventory...</p>
	{:else if !hasQuery}
		<p class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Start typing to search across your inventory.</p>
	{:else if !hasResults}
		<p class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No matches for "{searchText.trim()}".</p>
	{:else}
		<div class="grid max-h-[62dvh] gap-4 overflow-y-auto pr-1">
			{#if results.items.length > 0}
				<section class="grid gap-2">
					<h3 class="flex items-center gap-2 text-sm font-semibold">
						<Pill class="size-4 text-muted-foreground" />
						Items
						<span class="text-muted-foreground">· {results.items.length}</span>
					</h3>
					<Card class="divide-y divide-border overflow-hidden p-0">
						{#each results.items as item (item.id)}
							<button type="button" class="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50" onclick={() => closeAndGo(`/items/${item.id}/edit`)}>
								{@render itemSummary(item)}
							</button>
						{/each}
					</Card>
				</section>
			{/if}

			{#if results.categories.length > 0}
				<section class="grid gap-2">
					<h3 class="flex items-center gap-2 text-sm font-semibold">
						<Shapes class="size-4 text-muted-foreground" />
						Categories
						<span class="text-muted-foreground">· {results.categories.length}</span>
					</h3>
					<div class="grid gap-2">
						{#each results.categories as category (category.id)}
							<Card class="overflow-hidden p-0">
								<button type="button" class="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50" onclick={() => closeAndGo(`/categories/${category.slug}`)}>
									<div class="min-w-0">
										<p class="truncate font-medium">{category.name}</p>
										<p class="text-xs text-muted-foreground">{category.items.length} {category.items.length === 1 ? 'item' : 'items'}</p>
									</div>
									<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
								</button>
								{#if category.items.length > 0}
									<div class="border-t border-border bg-muted/20 p-2">
										{#each category.items.slice(0, 3) as item (item.id)}
											<button type="button" class="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-background" onclick={() => closeAndGo(`/items/${item.id}/edit`)}>
												{@render itemSummary(item)}
											</button>
										{/each}
									</div>
								{/if}
							</Card>
						{/each}
					</div>
				</section>
			{/if}

			{#if results.tags.length > 0}
				<section class="grid gap-2">
					<h3 class="flex items-center gap-2 text-sm font-semibold">
						<Tags class="size-4 text-muted-foreground" />
						Tags
						<span class="text-muted-foreground">· {results.tags.length}</span>
					</h3>
					<div class="grid gap-2">
						{#each results.tags as tag (tag.id)}
							<Card class="overflow-hidden p-0">
								<div class="p-3">
									<p class="truncate font-medium">#{tag.name}</p>
									<p class="text-xs text-muted-foreground">{tag.items.length} {tag.items.length === 1 ? 'item' : 'items'}</p>
								</div>
								{#if tag.items.length > 0}
									<div class="border-t border-border bg-muted/20 p-2">
										{#each tag.items.slice(0, 4) as item (item.id)}
											<button type="button" class="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-background" onclick={() => closeAndGo(`/items/${item.id}/edit`)}>
												{@render itemSummary(item)}
											</button>
										{/each}
									</div>
								{/if}
							</Card>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	{/if}
</Sheet>

{#snippet itemSummary(item: InventoryItem)}
	<div class="min-w-0">
		<p class="truncate font-medium">{item.name}{item.dosage ? ` · ${item.dosage}` : ''}</p>
		<p class="text-xs text-muted-foreground">qty {item.quantity}</p>
	</div>
	<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
{/snippet}
