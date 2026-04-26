<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, Pill, Plus } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type Props = { onAdd: () => void };
	let { onAdd }: Props = $props();

	const tabs = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/' },
		{ href: '/items', label: 'Items', icon: Pill, match: (p: string) => p.startsWith('/items') }
	];
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	<div class="mx-auto grid max-w-md grid-cols-3 px-2 pt-1">
		{#each tabs as tab (tab.href)}
			{@const active = tab.match(page.url.pathname)}
			<a
				href={tab.href}
				class={cn(
					'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
					active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
				)}
			>
				<tab.icon class="size-5" />
				<span>{tab.label}</span>
			</a>
		{/each}
		<button
			type="button"
			onclick={onAdd}
			class="mx-auto -mt-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
			aria-label="Add item"
		>
			<Plus class="size-6" />
		</button>
	</div>
</nav>
