<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type Props = Omit<HTMLInputAttributes, 'class'> & { class?: string; value?: any };
	let { class: className, value = $bindable(), ...rest }: Props = $props();
</script>

<input
	bind:value
	class={cn(
		'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs',
		'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
		'disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium',
		className
	)}
	{...rest}
/>
