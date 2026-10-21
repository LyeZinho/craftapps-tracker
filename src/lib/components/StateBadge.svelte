<script lang="ts">
	let { state }: { state: string } = $props();
</script>

<span class="badge {state}">{state}</span>
