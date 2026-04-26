<script lang="ts">
	import type { PageData } from './$types';
	import type { Item } from '$lib/server/db/schema';
	import Card from '$lib/components/ui/card.svelte';
	import ExpiryBadge from '$lib/components/expiry-badge.svelte';
	import { AlertTriangle, CalendarClock, PackageOpen, Pill, ChevronRight } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
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
		<p class="mt-2 text-2xl font-semibold tabular-nums">{data.inStock}</p>
		<p class="text-xs text-muted-foreground">of {data.totalCount} total</p>
	</Card>
	<Card class="p-4">
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground">Expiring ≤30d</span>
			<CalendarClock class="size-4 text-muted-foreground" />
		</div>
		<p class="mt-2 text-2xl font-semibold tabular-nums">
			{data.buckets.expired.length + data.buckets.critical.length + data.buckets.warning.length}
		</p>
		{#if data.buckets.expired.length > 0}
			<p class="text-xs text-destructive">{data.buckets.expired.length} already expired</p>
		{:else}
			<p class="text-xs text-muted-foreground">none expired</p>
		{/if}
	</Card>
</section>

{#snippet bucketSection(title: string, items: Item[], danger: boolean)}
	{#if items.length > 0}
		<section class="px-4 pt-4">
			<h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
				<AlertTriangle class={danger ? 'size-4 text-destructive' : 'size-4 text-warning'} />
				{title}
				<span class="text-muted-foreground">· {items.length}</span>
			</h2>
			<div class="grid gap-2">
				{#each items as it (it.id)}
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

{@render bucketSection('Already expired', data.buckets.expired, true)}
{@render bucketSection('Expiring within 7 days', data.buckets.critical, false)}
{@render bucketSection('Expiring within 30 days', data.buckets.warning, false)}

{#if data.lowStock.length > 0}
	<section class="px-4 pt-4">
		<h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
			<PackageOpen class="size-4 text-muted-foreground" />
			Low or out of stock
			<span class="text-muted-foreground">· {data.lowStock.length}</span>
		</h2>
		<div class="grid gap-2">
			{#each data.lowStock as it (it.id)}
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

{#if data.totalCount === 0}
	<section class="px-4 pt-8 text-center text-muted-foreground">
		<Pill class="mx-auto mb-3 size-10 opacity-40" />
		<p class="text-sm">No items yet — tap <span class="font-medium text-foreground">+</span> below to add your first one.</p>
	</section>
{/if}
