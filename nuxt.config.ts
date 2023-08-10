// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: {enabled: true},
	modules: ['@element-plus/nuxt', '@pinia/nuxt', '@nuxtjs/tailwindcss'],
	css:['@/assets/css/iconfont.css', '@/assets/scss/custom.scss'],
	pinia: {
		autoImports: [
			'defineStore', // import { defineStore } from 'pinia'
		],
	},
	elementPlus: {
		importStyle: 'scss',
	},
	vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/element.scss" as element;`,
        },
      },
    },
  },
});
