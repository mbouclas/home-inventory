<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import BottomNav from '$lib/components/bottom-nav.svelte';
	import GlobalSearchDialog from '$lib/components/global-search-dialog.svelte';
	import OfflineStatus from '$lib/components/offline-status.svelte';
	import Sheet from '$lib/components/ui/sheet.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import { Camera, PencilLine } from '@lucide/svelte';

	let { children, data } = $props();
	let addOpen = $state(false);
	let searchOpen = $state(false);

	function go(path: string) {
		addOpen = false;
		goto(path);
	}

	onMount(() => {
		const userKey = data.user ? String(data.user.id) : 'none';
		const previousUserKey = localStorage.getItem('home-pharmacy:user');
		localStorage.setItem('home-pharmacy:user', userKey);

		if (previousUserKey && previousUserKey !== userKey) {
			void inventory.clearLocalData().then(() => {
				if (data.user) return inventory.refreshSnapshot();
			});
			return;
		}

		if (data.user) void inventory.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<OfflineStatus />

	<div class="mx-auto min-h-dvh max-w-md pb-24">
		<div class="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
			<span>Signed in as {data.user.name || data.user.displayUsername}</span>
			<form method="POST" action="/logout">
				<Button type="submit" variant="ghost" size="sm">Log out</Button>
			</form>
		</div>
		{@render children()}
	</div>

	<BottomNav onAdd={() => (addOpen = true)} onSearch={() => (searchOpen = true)} />

	<GlobalSearchDialog bind:open={searchOpen} />

	<Sheet bind:open={addOpen} title="Add an item" description="Choose how to add it.">
		<div class="grid gap-3 pt-2">
			<Button size="lg" onclick={() => go('/items/import')}>
				<Camera class="size-5" />
				Take a photo
			</Button>
			<Button size="lg" variant="outline" onclick={() => go('/items/new')}>
				<PencilLine class="size-5" />
				Fill in manually
			</Button>
		</div>
	</Sheet>
{:else}
	{@render children()}
{/if}

<Toaster richColors position="top-center" />
