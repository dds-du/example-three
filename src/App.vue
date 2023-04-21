<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
	<section class="wrapper">
		<HelloWorld />
	</section>
</template>

<style scoped>
header {
	line-height: 1.5;
}

.logo {
	display: block;
	margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
	.wrapper {
		width: 100%;
		height: 100%;
	}
}
</style>
