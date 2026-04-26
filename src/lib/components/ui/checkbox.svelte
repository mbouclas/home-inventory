<script lang="ts">
	import { Checkbox as C } from 'bits-ui';
	import { Check, Minus } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type Props = {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		id?: string;
		name?: string;
		value?: string;
		class?: string;
		onCheckedChange?: (v: boolean) => void;
	};

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		disabled = false,
		id,
		name,
		value,
		class: className,
		onCheckedChange
	}: Props = $props();
</script>

<C.Root
	{id}
	{name}
	{value}
	{disabled}
	bind:checked
	bind:indeterminate
	{onCheckedChange}
	class={cn(
		'peer inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-input bg-background shadow-xs',
		'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
		'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
		'disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
>
	{#snippet children({ checked: c, indeterminate: i })}
		{#if i}
			<Minus class="size-3.5" />
		{:else if c}
			<Check class="size-3.5" />
		{/if}
	{/snippet}
</C.Root>
