<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
	{...rest}
>
	{@render children?.()}
</div>
