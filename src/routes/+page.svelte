<script lang="ts">
	import type { PageData } from './$types';
	import type { InventoryItem } from '$lib/types/inventory';
	import Card from '$lib/components/ui/card.svelte';
	import ExpiryBadge from '$lib/components/expiry-badge.svelte';
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import { AlertTriangle, CalendarClock, PackageOpen, Pill, ChevronRight, Shapes } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
	const dashboard = $derived(
		inventory.lastSyncedAt && (!inventory.online || inventory.pendingCount > 0) ? inventory.dashboard : data
	);
</script>

<header class="px-4 pt-6 pb-4">
	<p class="text-xs uppercase tracking-wide text-muted-foreground">Home Pharmacy</p>
	<h1 class="text-2xl font-semibold">Dashboard</h1>
</header>

<section class="grid grid-cols-2 gap-3 px-4 pb-2">
	<Card class="p-4">
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground">Items in stock</span>
			<Pill class="size-4 text-muted-foreground" />
		</div>
		<p class="mt-2 text-2xl font-semibold tabular-nums">{dashboard.inStock}</p>
		<p class="text-xs text-muted-foreground">of {dashboard.totalCount} total</p>
	</Card>
	<Card class="p-4">
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground">Expiring ≤30d</span>
			<CalendarClock class="size-4 text-muted-foreground" />
		</div>
		<p class="mt-2 text-2xl font-semibold tabular-nums">
			{dashboard.buckets.expired.length + dashboard.buckets.critical.length + dashboard.buckets.warning.length}
		</p>
		{#if dashboard.buckets.expired.length > 0}
			<p class="text-xs text-destructive">{dashboard.buckets.expired.length} already expired</p>
		{:else}
			<p class="text-xs text-muted-foreground">none expired</p>
		{/if}
	</Card>
</section>

{#if dashboard.topCategories.length > 0}
	<section class="px-4 pt-4">
		<div class="mb-2 flex items-center justify-between gap-3">
			<h2 class="flex items-center gap-2 text-sm font-semibold">
				<Shapes class="size-4 text-muted-foreground" />
				Top categories
			</h2>
			<a href="/categories" class="text-xs font-medium text-muted-foreground hover:text-foreground">View all</a>
		</div>
		<Card class="divide-y divide-border overflow-hidden p-0">
			{#each dashboard.topCategories as category (category.id)}
				<a href={`/categories/${category.slug}`} class="flex items-center justify-between gap-3 p-3 hover:bg-muted/50">
					<div class="min-w-0">
						<p class="truncate font-medium">{category.name}</p>
						<p class="text-xs text-muted-foreground">
							{category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
						</p>
					</div>
					<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
				</a>
			{/each}
		</Card>
	</section>
{/if}

{#snippet bucketSection(title: string, items: InventoryItem[], danger: boolean)}
	{#if items.length > 0}
		<section class="px-4 pt-4">
			<h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
				<AlertTriangle class={danger ? 'size-4 text-destructive' : 'size-4 text-warning'} />
				{title}
				<span class="text-muted-foreground">· {items.length}</span>
			</h2>
			<div class="grid gap-2">
				{#each items as it (`${it.id}-${it.expiryDate ?? 'unknown'}-${it.quantity}`)}
					<a href={`/items/${it.id}/edit`} class="block">
						<Card class="flex items-center justify-between gap-3 p-3">
							<div class="min-w-0">
								<p class="truncate font-medium">{it.name}{it.dosage ? ` · ${it.dosage}` : ''}</p>
								<div class="mt-0.5 flex items-center gap-2">
									<ExpiryBadge expiry={it.expiryDate} />
									<span class="text-xs text-muted-foreground">qty {it.quantity}</span>
								</div>
							</div>
							<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
						</Card>
					</a>
				{/each}
			</div>
		</section>
	{/if}
{/snippet}

{@render bucketSection('Already expired', dashboard.buckets.expired, true)}
{@render bucketSection('Expiring within 7 days', dashboard.buckets.critical, false)}
{@render bucketSection('Expiring within 30 days', dashboard.buckets.warning, false)}

{#if dashboard.lowStock.length > 0}
	<section class="px-4 pt-4">
		<h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
			<PackageOpen class="size-4 text-muted-foreground" />
			Low or out of stock
			<span class="text-muted-foreground">· {dashboard.lowStock.length}</span>
		</h2>
		<div class="grid gap-2">
			{#each dashboard.lowStock as it (it.id)}
				<a href={`/items/${it.id}/edit`} class="block">
					<Card class={'flex items-center justify-between gap-3 p-3 ' + (it.quantity === 0 ? 'opacity-50' : '')}>
						<div class="min-w-0">
							<p class="truncate font-medium">{it.name}{it.dosage ? ` · ${it.dosage}` : ''}</p>
							<p class="text-xs text-muted-foreground">qty {it.quantity}</p>
						</div>
						<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
					</Card>
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if dashboard.totalCount === 0}
	<section class="px-4 pt-8 text-center text-muted-foreground">
		<Pill class="mx-auto mb-3 size-10 opacity-40" />
		<p class="text-sm">No items yet — tap <span class="font-medium text-foreground">+</span> below to add your first one.</p>
	</section>
{/if}
