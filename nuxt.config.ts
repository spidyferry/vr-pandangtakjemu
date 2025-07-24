// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
      title: 'Nuxt 4 - VR',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: 'Nuxt 4 is the powerful web framework for building modern, blazing-fast websites and apps with Vue.' },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'Wildy13 (https://github.com/wildy13)' },
        { name: 'keywords', content: 'Nuxt 4, Vue.js, Web Development, SEO, SSR, Jamstack' },

        { property: 'og:title', content: 'Nuxt 4 - Build the Web Smarter' },
        { property: 'og:description', content: 'Discover Nuxt 4 — The ultimate Vue framework for high-performance web apps.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://www.yoursite.com' },
        { property: 'og:image', content: 'https://www.yoursite.com/og-image.jpg' },

        { name: 'github:creator', content: '@wildy13' },
        { name: 'github:profile', content: 'https://github.com/wildy13' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false
})
