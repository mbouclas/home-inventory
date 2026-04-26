<script lang="ts">
	import Badge, { type BadgeVariant } from './ui/badge.svelte';
	import { expiryStatus, formatExpiryLabel } from '$lib/expiry';

	type Props = { expiry: string | null | undefined };
	let { expiry }: Props = $props();

	const map: Record<string, BadgeVariant> = {
		expired: 'destructive',
		critical: 'destructive',
		warning: 'warning',
		ok: 'success',
		unknown: 'outline'
	};

	const status = $derived(expiryStatus(expiry));
	const label = $derived(formatExpiryLabel(expiry));
</script>

<Badge variant={map[status]}>{label}</Badge>
