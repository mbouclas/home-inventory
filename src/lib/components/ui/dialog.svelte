<script lang="ts">
	import { Dialog as D } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	type Props = {
		open?: boolean;
		title?: string;
		description?: string;
		trigger?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		contentClass?: string;
	};

	let {
		open = $bindable(false),
		title,
		description,
		trigger,
		children,
		footer,
		contentClass
	}: Props = $props();
</script>

<D.Root bind:open>
	{#if trigger}
		<D.Trigger>{@render trigger()}</D.Trigger>
	{/if}
	<D.Portal>
		<D.Overlay forceMount>
			{#snippet child({ props, open: o })}
				{#if o}
					<div {...props} class="fixed inset-0 z-50 bg-black/50" transition:fade={{ duration: 150 }}></div>
				{/if}
			{/snippet}
		</D.Overlay>
		<D.Content forceMount>
			{#snippet child({ props, open: o })}
				{#if o}
					<div
						{...props}
						class={[
							'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
							'w-[calc(100%-2rem)] max-w-md rounded-xl bg-background p-6 shadow-lg flex flex-col gap-3',
							contentClass
						].filter(Boolean).join(' ')}
						transition:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
					>
						{#if title}
							<D.Title class="text-lg font-semibold">{title}</D.Title>
						{/if}
						{#if description}
							<D.Description class="text-sm text-muted-foreground">{description}</D.Description>
						{/if}
						{@render children?.()}
						{#if footer}
							<div class="mt-2 flex justify-end gap-2">{@render footer()}</div>
						{/if}
					</div>
				{/if}
			{/snippet}
		</D.Content>
	</D.Portal>
</D.Root>
