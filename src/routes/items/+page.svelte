<script lang="ts">
	import { goto, invalidateAll } from "$app/navigation";
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { toast } from "svelte-sonner";
	import { Minus, Plus, Trash2, Search, Pill } from "@lucide/svelte";
	import Input from "$lib/components/ui/input.svelte";
	import Card from "$lib/components/ui/card.svelte";
	import Button from "$lib/components/ui/button.svelte";
	import Label from "$lib/components/ui/label.svelte";
	import Sheet from "$lib/components/ui/sheet.svelte";
	import ConfirmDialog from "$lib/components/ui/confirm-dialog.svelte";
	import ExpiryBadge from "$lib/components/expiry-badge.svelte";
	import { inventory } from "$lib/offline/inventory-store.svelte";
	import { cn } from "$lib/utils";

	let query = $derived(page.url.searchParams.get("q")?.trim() ?? "");
	let toDelete = $state<{ id: number; name: string } | null>(null);
	let addStockFor = $state<{ id: number; name: string } | null>(null);
	let addStockOpen = $state(false);
	let addStockSplit = $state(false);
	let addStockLots = $state<Array<{ quantity: number; expiryDate: string }>>([
		{ quantity: 1, expiryDate: "" },
	]);
	let confirmOpen = $derived(!!toDelete);
	let busyIds = new SvelteSet<number>();
	const items = $derived(inventory.filterItems(query));

	function formatLotDate(expiryDate: string | null) {
		if (!expiryDate) return "unknown expiry";
		return new Date(`${expiryDate}T00:00:00`).toLocaleDateString(undefined, {
			month: "short",
			year: "numeric",
		});
	}

	function lotSummary(item: (typeof items)[number]) {
		return item.expiryLots
			.map((lot) => `${lot.quantity} ${lot.quantity === 1 ? "expires" : "expire"} ${formatLotDate(lot.expiryDate)}`)
			.join(" · ");
	}

	function openAddStock(item: { id: number; name: string }) {
		addStockFor = item;
		addStockOpen = true;
		addStockSplit = false;
		addStockLots = [{ quantity: 1, expiryDate: "" }];
	}

	function addStockLot() {
		addStockLots = [...addStockLots, { quantity: 1, expiryDate: "" }];
	}

	function removeStockLot(index: number) {
		addStockLots = addStockLots.filter((_, i) => i !== index);
	}

	function normalizeAddLots() {
		return addStockLots
			.map((lot) => ({ quantity: Number(lot.quantity), expiryDate: lot.expiryDate || null }))
			.filter((lot) => Number.isInteger(lot.quantity) && lot.quantity > 0);
	}

	function onSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		const u = new URL(page.url);
		if (query) u.searchParams.set("q", query);
		else u.searchParams.delete("q");
		goto(u, { keepFocus: true, replaceState: true });
	}

	async function changeQty(id: number, delta: number) {
		busyIds.add(id);
		try {
			if (inventory.lastSyncedAt) {
				await inventory.changeQuantity(id, delta);
			} else {
				const res = await fetch(`/api/items/${id}/qty`, {
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ delta }),
				});
				if (!res.ok) throw new Error(await res.text());
				await invalidateAll();
			}
		} catch (e) {
			toast.error("Could not update quantity");
		} finally {
			busyIds.delete(id);
		}
	}

	async function submitAddStock() {
		if (!addStockFor) return;
		const lots = normalizeAddLots();
		if (lots.length === 0) {
			toast.error("Add at least one quantity");
			return;
		}

		const id = addStockFor.id;
		busyIds.add(id);
		try {
			if (inventory.lastSyncedAt) {
				await inventory.addStock(id, lots);
			} else {
				const res = await fetch(`/api/items/${id}/qty`, {
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ lots }),
				});
				if (!res.ok) throw new Error(await res.text());
				await invalidateAll();
			}
			toast.success("Stock added");
			addStockOpen = false;
			addStockFor = null;
		} catch (e) {
			toast.error("Could not add stock");
		} finally {
			busyIds.delete(id);
		}
	}

	async function doDelete() {
		if (!toDelete) return;
		const id = toDelete.id;
		if (inventory.lastSyncedAt) {
			await inventory.deleteItem(id);
		} else {
			const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
			if (!res.ok) {
				toast.error("Delete failed");
				return;
			}
			await invalidateAll();
		}
		toast.success("Deleted");
		toDelete = null;
	}

	onMount(() => {
		if (inventory.online && inventory.pendingCount === 0) void inventory.refreshSnapshot();

		const added = page.url.searchParams.get("added");
		if (added) {
			toast.success("Item saved");
			const u = new URL(page.url);
			u.searchParams.delete("added");
			history.replaceState({}, "", u);
		}
	});
</script>

<header
	class="sticky top-0 z-30 border-b border-border bg-background/90 px-4 pt-4 pb-3 backdrop-blur"
>
	<h1 class="mb-3 text-xl font-semibold">Items</h1>
	<form onsubmit={onSearchSubmit} class="relative">
		<Search
			class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Search by name or barcode"
			class="pl-9"
			bind:value={query}
			aria-label="Search"
		/>
	</form>
</header>

<section class="grid gap-3 p-4">
	{#if !inventory.ready}
		<div
			class="grid place-items-center gap-3 rounded-xl border border-dashed py-12 text-center text-muted-foreground"
		>
			<Pill class="size-8" />
			<p class="text-sm">Loading cached items…</p>
		</div>
	{:else if items.length === 0}
		<div
			class="grid place-items-center gap-3 rounded-xl border border-dashed py-12 text-center text-muted-foreground"
		>
			<Pill class="size-8" />
			<p class="text-sm">
				No items yet — tap <span class="font-medium">+</span> to add one.
			</p>
		</div>
	{/if}

	{#each items as item (item.id)}
		{@const zero = item.quantity === 0}
		<Card class={cn("p-3", zero && "opacity-40 grayscale")}>
			<div class="flex items-start gap-3">
				{#if item.photoUrl}
					<img
						src={item.photoUrl}
						alt=""
						class="size-16 shrink-0 rounded-lg object-cover"
					/>
				{:else}
					<div
						class="grid size-16 shrink-0 place-items-center rounded-lg bg-muted"
					>
						<Pill class="size-6 text-muted-foreground" />
					</div>
				{/if}

				<a href={`/items/${item.id}/edit`} class="min-w-0 flex-1">
					<div class="flex items-baseline gap-2">
						<h2 class="truncate text-base font-medium">
							{item.name}
						</h2>
						{#if item.dosage}<span
								class="shrink-0 text-xs text-muted-foreground"
								>{item.dosage}</span
							>{/if}
					</div>
					{#if item.description}
						<p
							class="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
						>
							{item.description}
						</p>
					{/if}
					<div class="mt-1.5">
						<ExpiryBadge expiry={item.expiryDate} />
					</div>
					{#if item.expiryLots.length > 1}
						<p class="mt-1 text-xs text-muted-foreground">{lotSummary(item)}</p>
					{/if}
				</a>
			</div>

			<div
				class="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3"
			>
				<div class="flex items-center gap-2">
					<Button
						size="icon"
						variant="outline"
						class="size-9"
						aria-label="Decrement"
						disabled={busyIds.has(item.id) || item.quantity === 0}
						onclick={() => changeQty(item.id, -1)}
					>
						<Minus class="size-4" />
					</Button>
					<span class="w-8 text-center font-mono text-sm tabular-nums"
						>{item.quantity}</span
					>
					<Button
						size="icon"
						variant="outline"
						class="size-9"
						aria-label="Increment"
						disabled={busyIds.has(item.id)}
						onclick={() => openAddStock(item)}
					>
						<Plus class="size-4" />
					</Button>
				</div>

				<Button
					size="icon"
					variant="ghost"
					class="size-9 text-destructive"
					aria-label="Delete"
					onclick={() =>
						(toDelete = { id: item.id, name: item.name })}
				>
					<Trash2 class="size-4" />
				</Button>
			</div>
		</Card>
	{/each}
</section>

<Sheet
	bind:open={addStockOpen}
	title={`Add stock${addStockFor ? ` for ${addStockFor.name}` : ""}`}
	description="Set the expiry date for the new quantity."
>
	<div class="grid gap-4">
		<div class="flex rounded-lg border p-0.5">
			<Button
				type="button"
				size="sm"
				variant={addStockSplit ? "ghost" : "secondary"}
				onclick={() => {
					addStockSplit = false;
					addStockLots = [addStockLots[0] ?? { quantity: 1, expiryDate: "" }];
				}}
			>
				Bulk date
			</Button>
			<Button
				type="button"
				size="sm"
				variant={addStockSplit ? "secondary" : "ghost"}
				onclick={() => (addStockSplit = true)}
			>
				Individual dates
			</Button>
		</div>

		<div class="grid gap-3">
			{#each addStockLots as lot, index}
				<div class="grid grid-cols-[5rem_1fr_auto] items-end gap-2">
					<div class="grid gap-1.5">
						<Label for={`add-stock-qty-${index}`}>Qty</Label>
						<Input
							id={`add-stock-qty-${index}`}
							type="number"
							min="1"
							inputmode="numeric"
							bind:value={lot.quantity}
						/>
					</div>
					<div class="grid gap-1.5">
						<Label for={`add-stock-expiry-${index}`}>Expiry date</Label>
						<Input
							id={`add-stock-expiry-${index}`}
							type="date"
							bind:value={lot.expiryDate}
						/>
					</div>
					{#if addStockSplit}
						<Button
							type="button"
							variant="ghost"
							disabled={addStockLots.length === 1}
							onclick={() => removeStockLot(index)}
						>
							Remove
						</Button>
					{/if}
				</div>
			{/each}
		</div>

		{#if addStockSplit}
			<Button type="button" variant="outline" onclick={addStockLot}>Add another date</Button>
		{/if}

		<div class="flex justify-end gap-2">
			<Button
				type="button"
				variant="ghost"
				onclick={() => {
					addStockOpen = false;
					addStockFor = null;
				}}
			>
				Cancel
			</Button>
			<Button type="button" onclick={submitAddStock}>Add stock</Button>
		</div>
	</div>
</Sheet>

<ConfirmDialog
	bind:open={confirmOpen}
	title={`Delete ${toDelete?.name ?? "item"}?`}
	description="This cannot be undone."
	confirmLabel="Delete"
	destructive
	onconfirm={doDelete}
/>
