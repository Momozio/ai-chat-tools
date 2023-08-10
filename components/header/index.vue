<template>
	<div class="header">
		<!-- left -->
		<div class="left-box">
			<!-- logo -->
			<div class="logo" @click="router.push('/')">
				<div class="logo-label">gpt tools</div>
			</div>
		</div>

		<!-- right -->
		<div class="right-box"></div>
	</div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 48px;
	background-color: rgba(255, 255, 255, 0.8);
	border-bottom: 1px solid rgba(102, 102, 102, 0.25);
	backdrop-filter: blur(24px);
	padding: 8px 32px 8px 32px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-between;
	z-index: 100;

	.left-box {
		display: flex;
		align-items: center;

		// logo
		.logo {
			display: flex;
			align-items: center;
			.logo-label {
				font-size: 20px;
			}
		}
	}

	.right-box {
		position: relative;
	}
}
</style>
