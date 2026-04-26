<script lang="ts">
	import type { PageData } from './$types';
	import ItemForm from '$lib/components/item-form.svelte';
	import { ChevronLeft } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<header class="flex items-center gap-2 px-4 pt-4 pb-2">
	<a href="/items" class="text-muted-foreground"><ChevronLeft class="size-5" /></a>
	<h1 class="text-xl font-semibold">New item</h1>
</header>

<section class="px-4 pb-6">
	<ItemForm data={data.form} photoUrl={data.form.data.photoUrl} submitLabel="Save item" />
</section>
