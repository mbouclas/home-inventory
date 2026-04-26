<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Camera, ChevronLeft, Loader2 } from '@lucide/svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';

	let fileInput: HTMLInputElement;
	let preview = $state<string | null>(null);
	let busy = $state(false);

	function pick() {
		fileInput?.click();
	}

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		preview = URL.createObjectURL(file);
		busy = true;

		try {
			const fd = new FormData();
			fd.append('photo', file);
			const res = await fetch('/api/extract', { method: 'POST', body: fd });
			if (!res.ok) {
				const msg = await res.text().catch(() => '');
				throw new Error(msg || `Server returned ${res.status}`);
			}
			const data = (await res.json()) as {
				photoUrl: string;
				photoPublicId: string;
				fields: {
					name: string | null;
					dosage: string | null;
					description: string | null;
					usage: string | null;
					expiryDate: string | null;
					barcode: string | null;
				};
			};

			const params = new URLSearchParams();
			params.set('photoUrl', data.photoUrl);
			params.set('photoPublicId', data.photoPublicId);
			for (const [k, v] of Object.entries(data.fields)) {
				if (v) params.set(k, v);
			}
			params.set('quantity', '1');
			await goto(`/items/new?${params.toString()}`);
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : 'Extraction failed');
			busy = false;
			preview = null;
			input.value = '';
		}
	}
</script>

<header class="flex items-center gap-2 px-4 pt-4 pb-2">
	<a href="/items" class="text-muted-foreground"><ChevronLeft class="size-5" /></a>
	<h1 class="text-xl font-semibold">Add from photo</h1>
</header>

<section class="grid gap-4 px-4 pb-6">
	<Card class="grid place-items-center gap-3 p-6 text-center">
		{#if preview}
			<img src={preview} alt="" class="aspect-square w-full max-w-xs rounded-lg object-cover" />
		{:else}
			<div class="aspect-square w-full max-w-xs rounded-lg bg-muted grid place-items-center text-muted-foreground">
				<Camera class="size-10" />
			</div>
		{/if}

		{#if busy}
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 class="size-4 animate-spin" />
				<span>Reading the box…</span>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">
				Snap the front of the packaging — make sure name, dosage and expiry are visible.
			</p>
			<Button size="lg" onclick={pick}>
				<Camera class="size-5" />
				Take photo
			</Button>
		{/if}

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			capture="environment"
			class="hidden"
			onchange={onFile}
		/>
	</Card>

	<div class="text-center">
		<a href="/items/new" class="text-sm text-muted-foreground underline-offset-4 hover:underline">
			Skip and fill manually
		</a>
	</div>
</section>
