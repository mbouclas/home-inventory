<script lang="ts">
	import { page } from '$app/state';
	import { LockKeyhole, Pill } from '@lucide/svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let { data, form } = $props();
	const redirectTo = $derived(page.url.searchParams.get('redirectTo') ?? '/');
	const title = $derived(data.needsSetup ? 'Create your pharmacy login' : 'Log in');
	const description = $derived(
		data.needsSetup
			? 'Set up the first account. Existing items will be assigned to this user.'
			: 'Use your local account to access the shared inventory.'
	);
</script>

<svelte:head>
	<title>{title} · Home Pharmacy</title>
</svelte:head>

<main class="grid min-h-dvh place-items-center bg-muted/30 px-4 py-8">
	<Card class="w-full max-w-sm p-6 shadow-lg">
		<div class="mb-6 grid gap-3 text-center">
			<div class="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
				{#if data.needsSetup}
					<Pill class="size-6" />
				{:else}
					<LockKeyhole class="size-6" />
				{/if}
			</div>
			<div class="grid gap-1">
				<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
				<p class="text-sm text-muted-foreground">{description}</p>
			</div>
		</div>

		<form method="POST" class="grid gap-4">
			<input type="hidden" name="redirectTo" value={redirectTo} />
			{#if data.needsSetup}
				<div class="grid gap-2">
					<Label for="name">Name</Label>
					<Input
						id="name"
						name="name"
						autocomplete="name"
						required
						value={form?.name ?? ''}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						value={form?.email ?? ''}
					/>
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="username">Username</Label>
				<Input
					id="username"
					name="username"
					autocomplete="username"
					required
					minlength={3}
					value={form?.username ?? ''}
				/>
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete={data.needsSetup ? 'new-password' : 'current-password'}
					required
					minlength={8}
				/>
			</div>

			{#if form?.message}
				<p class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.message}
				</p>
			{/if}

			<Button type="submit" size="lg">
				{data.needsSetup ? 'Create account' : 'Log in'}
			</Button>
		</form>
	</Card>
</main>
