// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
      title: 'Kampung VR | PandangTakJemu',
      htmlAttrs: {
        lang: 'id',
      },
      meta: [
        {
          name: 'description',
          content: 'Kampung VR adalah pengalaman virtual reality imersif dari PandangTakJemu untuk menjelajahi kampung dan budaya lokal secara digital.'
        },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'PandangTakJemu Team (https://vr.pandangtakjemu.com/)' },
        { name: 'keywords', content: 'Virtual Reality, Kampung, Budaya Indonesia, VR Indonesia, Edukasi Digital, PandangTakJemu' },

        { property: 'og:title', content: 'Kampung VR | PandangTakJemu' },
        { property: 'og:description', content: 'Masuki dunia virtual kampung Indonesia dengan pengalaman edukatif dan imersif dari PandangTakJemu.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://vr.pandangtakjemu.com/' },
        { property: 'og:image', content: 'https://www.pandangtakjemu.com/assets/img/bg.jpg' },

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Kampung VR | PandangTakJemu' },
        { name: 'twitter:description', content: 'Jelajahi budaya kampung Indonesia dalam dunia virtual yang interaktif dan mendalam.' },
        { name: 'twitter:image', content: 'https://www.pandangtakjemu.com/assets/img/bg.jpg' }
      ]
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  devServer: {
    host: process.env.HOST || '127.0.0.1',
    port: Number(process.env.PORT) || 3000,
  }, 
  typescript: {
    typeCheck: true
  }
})
