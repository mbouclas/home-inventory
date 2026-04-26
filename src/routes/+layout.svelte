<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import BottomNav from '$lib/components/bottom-nav.svelte';
	import OfflineStatus from '$lib/components/offline-status.svelte';
	import Sheet from '$lib/components/ui/sheet.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { inventory } from '$lib/offline/inventory-store.svelte';
	import { Camera, PencilLine } from '@lucide/svelte';

	let { children } = $props();
	let addOpen = $state(false);

	function go(path: string) {
		addOpen = false;
		goto(path);
	}

	onMount(() => {
		void inventory.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<OfflineStatus />

<div class="mx-auto min-h-dvh max-w-md pb-24">
	{@render children()}
</div>

<BottomNav onAdd={() => (addOpen = true)} />

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

<Toaster richColors position="top-center" />
