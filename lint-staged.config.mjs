const configs = [
  { match: '/apps/api/', config: 'apps/api/eslint.config.mjs' },
  { match: '/apps/web/', config: 'apps/web/eslint.config.mjs' },
];

export default {
  '*.{js,jsx,ts,tsx}': (filenames) => {
    const commands = [];

    for (const { match, config } of configs) {
      const files = filenames.filter((f) => f.includes(match));
      if (files.length) {
        commands.push(`eslint --fix -c ${config} ${files.join(' ')}`);
      }
    }

    commands.push(`prettier --write ${filenames.join(' ')}`);
    return commands;
  },
  '*.{json,css,scss,md}': ['prettier --write'],
};
