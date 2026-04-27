<script lang="ts">
	import { superForm, type SuperValidated } from "sveltekit-superforms";
	import { zod4 } from "sveltekit-superforms/adapters";
	import { fromAction } from "svelte/attachments";
	import { itemFormSchema, type ItemFormData } from "$lib/schemas/item";
	import type { Category } from "$lib/types/taxonomy";
	import { toast } from "svelte-sonner";
	import Input from "./ui/input.svelte";
	import Textarea from "./ui/textarea.svelte";
	import Label from "./ui/label.svelte";
	import Button from "./ui/button.svelte";
	import TagsInput from "./tags-input.svelte";
	import CategoriesPicker from "./categories-picker.svelte";
	import { Camera, Loader2, Sparkles } from "@lucide/svelte";

	type Props = {
		data: SuperValidated<ItemFormData>;
		photoUrl?: string | null;
		submitLabel?: string;
		successMessage?: string;
		categories: Category[];
		aiSuggested?: boolean;
	};

	let {
		data,
		photoUrl,
		submitLabel = "Save",
		successMessage = "Saved",
		categories,
		aiSuggested = false,
	}: Props = $props();

	function createItemForm() {
		return superForm(data, {
			validators: zod4(itemFormSchema),
			dataType: "json",
			resetForm: false,
			onUpdated({ form }) {
				if (form.valid && form.message) toast.success(form.message);
			},
		});
	}

	const { form, errors, enhance, submitting, message } = createItemForm();
	let splitLots = $state(false);
	let splitLotsInitialized = $state(false);
	let photoInput: HTMLInputElement;
	let localPhotoPreview = $state<string | null>(null);
	let uploadingPhoto = $state(false);
	let photoError = $state<string | null>(null);
	let displayPhotoUrl = $derived(localPhotoPreview ?? $form.photoUrl ?? photoUrl ?? null);

	$effect(() => {
		if (splitLotsInitialized) return;
		splitLots = (data.data.expiryLots?.length ?? 0) > 1;
		splitLotsInitialized = true;
	});

	function lotTotal() {
		return ($form.expiryLots ?? []).reduce(
			(sum, lot) => sum + (Number(lot.quantity) || 0),
			0,
		);
	}

	function syncBulkLot() {
		if (splitLots) return;
		const quantity = Number($form.quantity) || 0;
		$form.expiryLots = quantity > 0 ? [{ quantity, expiryDate: $form.expiryDate }] : [];
	}

	function enableSplitLots() {
		splitLots = true;
		if (($form.expiryLots ?? []).length === 0 && Number($form.quantity) > 0) {
			$form.expiryLots = [
				{ quantity: Number($form.quantity), expiryDate: $form.expiryDate },
			];
		}
	}

	function useBulkLot() {
		splitLots = false;
		const firstDate = $form.expiryLots?.[0]?.expiryDate ?? $form.expiryDate;
		$form.expiryDate = firstDate;
		syncBulkLot();
	}

	function addLot() {
		$form.expiryLots = [...($form.expiryLots ?? []), { quantity: 1, expiryDate: "" }];
		$form.quantity = lotTotal();
	}

	function removeLot(index: number) {
		$form.expiryLots = ($form.expiryLots ?? []).filter((_, i) => i !== index);
		$form.quantity = lotTotal();
	}

	function syncSplitQuantity() {
		$form.quantity = lotTotal();
		$form.expiryDate = $form.expiryLots?.[0]?.expiryDate;
	}

	function pickPhoto() {
		photoInput?.click();
	}

	async function uploadSelectedPhoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (localPhotoPreview) URL.revokeObjectURL(localPhotoPreview);
		localPhotoPreview = URL.createObjectURL(file);
		uploadingPhoto = true;
		photoError = null;

		try {
			const body = new FormData();
			body.append("photo", file);
			const response = await fetch("/api/photos", { method: "POST", body });
			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(text || `Upload failed (${response.status})`);
			}
			const uploaded = (await response.json()) as {
				photoUrl: string;
				photoPublicId: string;
			};
			$form.photoUrl = uploaded.photoUrl;
			$form.photoPublicId = uploaded.photoPublicId;
			if (localPhotoPreview) URL.revokeObjectURL(localPhotoPreview);
			localPhotoPreview = null;
		} catch (error) {
			photoError = error instanceof Error ? error.message : "Photo upload failed";
			$form.photoUrl = photoUrl ?? undefined;
			toast.error(photoError);
		} finally {
			uploadingPhoto = false;
			input.value = "";
		}
	}
</script>

<form method="POST" {@attach fromAction(enhance)} class="grid gap-4">
	<div class="grid gap-2">
		{#if displayPhotoUrl}
			<div class="overflow-hidden rounded-xl border bg-muted">
				<img
					src={displayPhotoUrl}
					alt=""
					class="aspect-square w-full object-cover"
				/>
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-2">
			<Button
				type="button"
				variant={displayPhotoUrl ? "outline" : "secondary"}
				onclick={pickPhoto}
				disabled={uploadingPhoto}
			>
				{#if uploadingPhoto}
					<Loader2 class="size-4 animate-spin" />
					Uploading photo...
				{:else}
					<Camera class="size-4" />
					{displayPhotoUrl ? "Replace photo" : "Add photo"}
				{/if}
			</Button>
			<p class="text-xs text-muted-foreground">
				Choose from your photos or take a new picture on mobile.
			</p>
		</div>
		{#if photoError}<p class="text-xs text-destructive">{photoError}</p>{/if}
		<input
			bind:this={photoInput}
			type="file"
			accept="image/*"
			class="hidden"
			onchange={uploadSelectedPhoto}
		/>
	</div>

	<div class="grid gap-1.5">
		<Label for="name">Name <span class="text-destructive">*</span></Label>
		<Input id="name" name="name" required bind:value={$form.name} />
		{#if $errors.name}<p class="text-xs text-destructive">
				{$errors.name}
			</p>{/if}
	</div>

	<div class="grid gap-3">
		<div class="grid gap-1.5">
			<Label for="dosage">Dosage</Label>
			<Input
				id="dosage"
				name="dosage"
				placeholder="500 mg"
				bind:value={$form.dosage}
			/>
		</div>
	</div>

	<div class="grid gap-3 rounded-xl border p-3">
		<div class="flex items-center justify-between gap-2">
			<div>
				<Label>Stock and expiry</Label>
				<p class="text-xs text-muted-foreground">
					Track quantity by expiry date.
				</p>
			</div>
			<div class="flex rounded-lg border p-0.5">
				<Button
					type="button"
					size="sm"
					variant={splitLots ? "ghost" : "secondary"}
					onclick={useBulkLot}
				>
					Bulk
				</Button>
				<Button
					type="button"
					size="sm"
					variant={splitLots ? "secondary" : "ghost"}
					onclick={enableSplitLots}
				>
					Split
				</Button>
			</div>
		</div>

		{#if splitLots}
			<div class="grid gap-2">
				{#each $form.expiryLots as lot, index}
					<div class="grid grid-cols-[5rem_1fr_auto] items-end gap-2">
						<div class="grid gap-1.5">
							<Label for={`lot-quantity-${index}`}>Qty</Label>
							<Input
								id={`lot-quantity-${index}`}
								type="number"
								min="1"
								inputmode="numeric"
								bind:value={lot.quantity}
								onchange={syncSplitQuantity}
							/>
						</div>
						<div class="grid gap-1.5">
							<Label for={`lot-expiry-${index}`}>Expiry date</Label>
							<Input
								id={`lot-expiry-${index}`}
								type="date"
								bind:value={lot.expiryDate}
								onchange={syncSplitQuantity}
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							class="mb-0.5"
							disabled={$form.expiryLots.length === 1}
							onclick={() => removeLot(index)}
						>
							Remove
						</Button>
					</div>
				{/each}
			</div>
			<Button type="button" variant="outline" onclick={addLot}>Add another date</Button>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				<div class="grid gap-1.5">
					<Label for="quantity">Quantity</Label>
					<Input
						id="quantity"
						name="quantity"
						type="number"
						min="0"
						inputmode="numeric"
						bind:value={$form.quantity}
						onchange={syncBulkLot}
					/>
				</div>
				<div class="grid gap-1.5">
					<Label for="expiryDate">Expiry date</Label>
					<Input
						id="expiryDate"
						name="expiryDate"
						type="date"
						bind:value={$form.expiryDate}
						onchange={syncBulkLot}
					/>
				</div>
			</div>
		{/if}

		{#if $errors.expiryLots}<p class="text-xs text-destructive">
				{$errors.expiryLots}
			</p>{/if}
	</div>

	<div class="grid gap-1.5">
		<Label for="barcode">Barcode</Label>
		<Input
			id="barcode"
			name="barcode"
			inputmode="numeric"
			bind:value={$form.barcode}
		/>
	</div>

	<div class="grid gap-1.5">
		<Label for="description">Description</Label>
		<Textarea
			id="description"
			name="description"
			rows={2}
			bind:value={$form.description}
		/>
	</div>

	<div class="grid gap-1.5">
		<Label for="usage">Usage instructions</Label>
		<Textarea id="usage" name="usage" rows={3} bind:value={$form.usage} />
	</div>

	{#if aiSuggested}
		<div
			class="-mb-2 flex items-center gap-1.5 text-xs text-muted-foreground"
		>
			<Sparkles class="size-3.5" />
			<span
				>AI-suggested categories and tags below — adjust as needed.</span
			>
		</div>
	{/if}

	<div class="grid gap-1.5">
		<Label>Categories</Label>
		<CategoriesPicker bind:value={$form.categoryIds} {categories} />
	</div>

	<div class="grid gap-1.5">
		<Label for="tags">Tags</Label>
		<TagsInput id="tags" bind:value={$form.tags} />
		<p class="text-xs text-muted-foreground">
			Type and press Enter to add. Suggestions appear as you type.
		</p>
	</div>

	<input type="hidden" name="photoUrl" value={$form.photoUrl ?? ""} />
	<input
		type="hidden"
		name="photoPublicId"
		value={$form.photoPublicId ?? ""}
	/>

	<Button type="submit" size="lg" disabled={$submitting || uploadingPhoto}>
		{uploadingPhoto ? "Uploading photo..." : $submitting ? "Saving…" : submitLabel}
	</Button>

	{#if $message}
		<p class="text-center text-sm text-muted-foreground">{$message}</p>
	{/if}
</form>
