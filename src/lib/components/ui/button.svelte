<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.98]",
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
				outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-11 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-9 rounded-md px-3 has-[>svg]:px-2.5',
				lg: 'h-12 rounded-md px-6 has-[>svg]:px-4 text-base',
				icon: 'size-11'
			}
		},
		defaultVariants: { variant: 'default', size: 'default' }
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = (HTMLButtonAttributes | HTMLAnchorAttributes) & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		children?: Snippet;
		class?: string;
	};

	let { variant = 'default', size = 'default', href, class: className, children, ...rest }: Props = $props();
</script>

{#if href}
	<a {href} class={cn(buttonVariants({ variant, size }), className)} {...rest as HTMLAnchorAttributes}>
		{@render children?.()}
	</a>
{:else}
	<button type="button" class={cn(buttonVariants({ variant, size }), className)} {...rest as HTMLButtonAttributes}>
		{@render children?.()}
	</button>
{/if}
