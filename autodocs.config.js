module.exports = {
  url: 'https://lamnhan.com/autodocs',
  readme: 'none',
  files: {
    'README.md': {
      head: true,
      toc: true,
      options: [
        ['Options', 'SELF', { title: 'Options' }],
        ['Options', 'SUMMARY_PROPERTIES', { heading: true }]
      ],
      main: ['Main', 'FULL', { title: 'Main service' }],
      declaration: ['Declaration', 'FULL', { title: 'Declaration' }],
      parser: ['Parser', 'FULL', { title: 'The `Parser`' }],
      converter: ['Converter', 'FULL', { title: 'The `Converter`' }],
      renderer: ['Renderer', 'FULL', { title: 'The `Renderer`' }],
      license: true
    }
  }
};
