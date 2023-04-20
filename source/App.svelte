<script>
    import { onMount } from "svelte/internal";
    import { load } from './render.js';

    let domElement;

    onMount(() => {
        load(domElement);
    });
</script>

<div bind:this={domElement} />
