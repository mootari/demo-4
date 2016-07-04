module.exports = {
  npm: {
    enabled: true
  },
  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^(?!app)/,
        'app.js': /^app/
      }
    },
    stylesheets: {joinTo: 'app.css'}
  },

  plugins: {
    babel: {presets: ['es2015']},
    sass: {
      // sourceMapEmbed: true
    }
  }
};
