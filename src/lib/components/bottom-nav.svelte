<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, Pill, Plus, Search, Shapes } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type Props = { onAdd: () => void; onSearch: () => void };
	let { onAdd, onSearch }: Props = $props();

	const tabs = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/' },
		{ href: '/items', label: 'Items', icon: Pill, match: (p: string) => p.startsWith('/items') },
		{ href: '/categories', label: 'Categories', icon: Shapes, match: (p: string) => p.startsWith('/categories') }
	];
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	<div class="mx-auto grid max-w-md grid-cols-5 px-2 pt-1">
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
			onclick={onSearch}
			class="mx-auto flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-transform hover:text-foreground active:scale-95"
			aria-label="Search inventory"
		>
			<Search class="size-5" />
		</button>
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
