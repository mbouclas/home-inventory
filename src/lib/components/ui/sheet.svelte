<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		open?: boolean;
		title?: string;
		description?: string;
		side?: 'bottom' | 'right';
		class?: string;
		children?: Snippet;
		trigger?: Snippet;
	};

	let {
		open = $bindable(false),
		title,
		description,
		side = 'bottom',
		class: className,
		children,
		trigger
	}: Props = $props();
</script>

<DialogPrimitive.Root bind:open>
	{#if trigger}
		<DialogPrimitive.Trigger>{@render trigger()}</DialogPrimitive.Trigger>
	{/if}
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay forceMount>
			{#snippet child({ props, open: o })}
				{#if o}
					<div
						{...props}
						class="fixed inset-0 z-50 bg-black/50"
						transition:fade={{ duration: 150 }}
					></div>
				{/if}
			{/snippet}
		</DialogPrimitive.Overlay>
		<DialogPrimitive.Content forceMount>
			{#snippet child({ props, open: o })}
				{#if o}
					<div
						{...props}
						class={cn(
							'fixed z-50 bg-background shadow-lg p-6 flex flex-col gap-4',
							side === 'bottom'
								? 'inset-x-0 bottom-0 rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto'
								: 'inset-y-0 right-0 w-full max-w-md',
							className
						)}
						transition:fly={{
							y: side === 'bottom' ? 400 : 0,
							x: side === 'right' ? 400 : 0,
							duration: 220,
							easing: cubicOut
						}}
					>
						{#if title}
							<DialogPrimitive.Title class="text-lg font-semibold">{title}</DialogPrimitive.Title>
						{/if}
						{#if description}
							<DialogPrimitive.Description class="text-sm text-muted-foreground"
								>{description}</DialogPrimitive.Description
							>
						{/if}
						{@render children?.()}
					</div>
				{/if}
			{/snippet}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
