<script lang="ts">
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import { Wifi, WifiOff, RefreshCw, AlertTriangle } from '@lucide/svelte';

	const lastSynced = $derived(
		inventory.lastSyncedAt ? new Date(inventory.lastSyncedAt).toLocaleString() : null
	);
</script>

{#if inventory.ready}
	<div class="mx-auto max-w-md px-4 pt-2">
		<div class="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground shadow-xs">
			{#if inventory.syncing}
				<RefreshCw class="size-3.5 animate-spin" />
			{:else if inventory.online}
				<Wifi class="size-3.5 text-primary" />
			{:else}
				<WifiOff class="size-3.5 text-warning" />
			{/if}

			<div class="min-w-0 flex-1">
				<p class="truncate">
					{#if inventory.syncing}
						Syncing offline copy…
					{:else if inventory.online}
						Online{inventory.pendingCount ? ` · ${inventory.pendingCount} pending` : ' · synced'}
					{:else}
						Offline · using cached inventory
					{/if}
				</p>
				{#if lastSynced}
					<p class="truncate opacity-75">Last synced {lastSynced}</p>
				{/if}
			</div>

			{#if inventory.lastError}
				<AlertTriangle class="size-3.5 text-destructive" aria-label="Sync error" />
			{/if}
		</div>
	</div>
{/if}
