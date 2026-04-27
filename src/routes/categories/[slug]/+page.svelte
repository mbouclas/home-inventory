<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import ExpiryBadge from '$lib/components/expiry-badge.svelte';
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import { ChevronRight, Pill } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
	const items = $derived(inventory.lastSyncedAt ? inventory.itemsForCategorySlug(data.category.slug) : data.items);
</script>

<header class="px-4 pt-6 pb-4">
	<a href="/categories" class="text-xs font-medium text-muted-foreground hover:text-foreground">Categories</a>
	<h1 class="mt-1 text-2xl font-semibold">{data.category.name}</h1>
	<p class="text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
</header>

<section class="grid gap-3 p-4 pt-0">
	{#if items.length === 0}
		<div class="grid place-items-center gap-3 rounded-xl border border-dashed py-12 text-center text-muted-foreground">
			<Pill class="size-8" />
			<p class="text-sm">No items in this category yet.</p>
		</div>
	{/if}

	{#each items as item (item.id)}
		<a href={`/items/${item.id}/edit`} class="block">
			<Card class="flex items-center justify-between gap-3 p-3">
				<div class="flex min-w-0 items-center gap-3">
					{#if item.photoUrl}
						<img src={item.photoUrl} alt="" class="size-12 shrink-0 rounded-lg object-cover" />
					{:else}
						<div class="grid size-12 shrink-0 place-items-center rounded-lg bg-muted">
							<Pill class="size-5 text-muted-foreground" />
						</div>
					{/if}
					<div class="min-w-0">
						<p class="truncate font-medium">{item.name}{item.dosage ? ` · ${item.dosage}` : ''}</p>
						<div class="mt-1 flex items-center gap-2">
							<ExpiryBadge expiry={item.expiryDate} />
							<span class="text-xs text-muted-foreground">qty {item.quantity}</span>
						</div>
					</div>
				</div>
				<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
			</Card>
		</a>
	{/each}
</section>
