// Format Conventional Commits du projet (docs/projet/organisation.md).
// Vérifié par le hook commit-msg et, en CI, sur le titre de la PR (qui devient le commit après le squash).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'test', 'refactor', 'perf', 'chore', 'ci', 'build'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'des',
        'regles',
        'srd',
        'personnages',
        'cartes',
        'vision',
        'sync',
        'combat',
        'bestiaire',
        'campagne',
        'mobile',
        'ui',
        'infra',
        'adr',
        'ci',
        'technique',
        'release',
      ],
    ],
  },
};
