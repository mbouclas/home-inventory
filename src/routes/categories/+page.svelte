<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import { ChevronRight, Shapes } from '@lucide/svelte';

	const categories = $derived(inventory.categoryCounts);
</script>

<header class="px-4 pt-6 pb-4">
	<p class="text-xs uppercase tracking-wide text-muted-foreground">Browse</p>
	<h1 class="text-2xl font-semibold">Categories</h1>
</header>

<section class="grid gap-3 p-4 pt-0">
	{#if !inventory.ready}
		<div class="grid place-items-center gap-3 rounded-xl border border-dashed py-12 text-center text-muted-foreground">
			<Shapes class="size-8" />
			<p class="text-sm">Loading cached categories…</p>
		</div>
	{:else if categories.length === 0}
		<div class="grid place-items-center gap-3 rounded-xl border border-dashed py-12 text-center text-muted-foreground">
			<Shapes class="size-8" />
			<p class="text-sm">No categories yet.</p>
		</div>
	{/if}

	{#each categories as category (category.id)}
		<a href={`/categories/${category.slug}`} class="block">
			<Card class="flex items-center justify-between gap-3 p-4">
				<div class="min-w-0">
					<h2 class="truncate font-medium">{category.name}</h2>
					<p class="text-xs text-muted-foreground">
						{category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
					</p>
				</div>
				<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
			</Card>
		</a>
	{/each}
</section>
