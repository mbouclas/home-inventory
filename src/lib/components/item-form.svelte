<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { itemFormSchema, type ItemFormData } from '$lib/schemas/item';
	import { toast } from 'svelte-sonner';
	import Input from './ui/input.svelte';
	import Textarea from './ui/textarea.svelte';
	import Label from './ui/label.svelte';
	import Button from './ui/button.svelte';

	type Props = {
		data: SuperValidated<ItemFormData>;
		photoUrl?: string | null;
		submitLabel?: string;
		successMessage?: string;
	};

	let { data, photoUrl, submitLabel = 'Save', successMessage = 'Saved' }: Props = $props();

	const { form, errors, enhance, submitting, message } = superForm(data, {
		validators: zod4(itemFormSchema),
		dataType: 'json',
		resetForm: false,
		onUpdated({ form }) {
			if (form.valid && form.message) toast.success(form.message);
		}
	});
</script>

<form method="POST" use:enhance class="grid gap-4">
	{#if photoUrl}
		<div class="overflow-hidden rounded-xl border bg-muted">
			<img src={photoUrl} alt="" class="aspect-square w-full object-cover" />
		</div>
	{/if}

	<div class="grid gap-1.5">
		<Label for="name">Name <span class="text-destructive">*</span></Label>
		<Input id="name" name="name" required bind:value={$form.name} />
		{#if $errors.name}<p class="text-xs text-destructive">{$errors.name}</p>{/if}
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="grid gap-1.5">
			<Label for="dosage">Dosage</Label>
			<Input id="dosage" name="dosage" placeholder="500 mg" bind:value={$form.dosage} />
		</div>
		<div class="grid gap-1.5">
			<Label for="quantity">Quantity</Label>
			<Input id="quantity" name="quantity" type="number" min="0" inputmode="numeric" bind:value={$form.quantity} />
		</div>
	</div>

	<div class="grid gap-1.5">
		<Label for="expiryDate">Expiry date</Label>
		<Input id="expiryDate" name="expiryDate" type="date" bind:value={$form.expiryDate} />
		{#if $errors.expiryDate}<p class="text-xs text-destructive">{$errors.expiryDate}</p>{/if}
	</div>

	<div class="grid gap-1.5">
		<Label for="barcode">Barcode</Label>
		<Input id="barcode" name="barcode" inputmode="numeric" bind:value={$form.barcode} />
	</div>

	<div class="grid gap-1.5">
		<Label for="description">Description</Label>
		<Textarea id="description" name="description" rows={2} bind:value={$form.description} />
	</div>

	<div class="grid gap-1.5">
		<Label for="usage">Usage instructions</Label>
		<Textarea id="usage" name="usage" rows={3} bind:value={$form.usage} />
	</div>

	<input type="hidden" name="photoUrl" value={$form.photoUrl ?? ''} />
	<input type="hidden" name="photoPublicId" value={$form.photoPublicId ?? ''} />

	<Button type="submit" size="lg" disabled={$submitting}>
		{$submitting ? 'Saving…' : submitLabel}
	</Button>

	{#if $message}
		<p class="text-center text-sm text-muted-foreground">{$message}</p>
	{/if}
</form>
