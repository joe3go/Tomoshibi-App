
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: false,
          },
          // Prevent removal of custom classes
          reduceIdents: false,
          zindex: false,
          mergeLonghand: false,
          discardUnused: false,
        }]
      }
    })
  },
}
