<script lang="ts">
	import { AlertDialog as A } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Button from './button.svelte';

	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		destructive?: boolean;
		onconfirm?: () => void | Promise<void>;
		trigger?: Snippet;
	};

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		destructive = false,
		onconfirm,
		trigger
	}: Props = $props();

	let busy = $state(false);
	async function handleConfirm() {
		busy = true;
		try {
			await onconfirm?.();
			open = false;
		} finally {
			busy = false;
		}
	}
</script>

<A.Root bind:open>
	{#if trigger}
		<A.Trigger>{@render trigger()}</A.Trigger>
	{/if}
	<A.Portal>
		<A.Overlay forceMount>
			{#snippet child({ props, open: o })}
				{#if o}
					<div {...props} class="fixed inset-0 z-50 bg-black/50" transition:fade={{ duration: 150 }}></div>
				{/if}
			{/snippet}
		</A.Overlay>
		<A.Content forceMount>
			{#snippet child({ props, open: o })}
				{#if o}
					<div
						{...props}
						class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-xl bg-background p-6 shadow-lg flex flex-col gap-3"
						transition:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
					>
						<A.Title class="text-lg font-semibold">{title}</A.Title>
						{#if description}
							<A.Description class="text-sm text-muted-foreground">{description}</A.Description>
						{/if}
						<div class="mt-2 flex justify-end gap-2">
							<A.Cancel>
								{#snippet child({ props })}
									<Button {...props} variant="outline">{cancelLabel}</Button>
								{/snippet}
							</A.Cancel>
							<Button
								variant={destructive ? 'destructive' : 'default'}
								disabled={busy}
								onclick={handleConfirm}
							>
								{busy ? 'Working…' : confirmLabel}
							</Button>
						</div>
					</div>
				{/if}
			{/snippet}
		</A.Content>
	</A.Portal>
</A.Root>
