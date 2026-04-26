<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
		variants: {
			variant: {
				default: 'bg-primary/10 text-primary ring-primary/20',
				secondary: 'bg-secondary text-secondary-foreground ring-border',
				destructive: 'bg-destructive/10 text-destructive ring-destructive/30',
				warning: 'bg-warning/15 text-warning ring-warning/30',
				success: 'bg-success/15 text-success ring-success/30',
				outline: 'text-foreground ring-border'
			}
		},
		defaultVariants: { variant: 'default' }
	});
	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class'> & {
		class?: string;
		variant?: BadgeVariant;
		children?: Snippet;
	};
	let { variant = 'default', class: className, children, ...rest }: Props = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)} {...rest}>
	{@render children?.()}
</span>
