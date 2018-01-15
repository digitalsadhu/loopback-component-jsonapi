/* eslint-env node */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  // Override rules. See http://marionebl.github.io/commitlint
  rules: {
    // Disable language rule
    lang: [0, 'always', 'eng']
  }
}
