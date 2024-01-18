module.exports = [
  ['/api/paipu/statistic', '/api/paipu/statistic', 'post'],
  [/\/api\/(\S+)(?:\/(\S+))?/, '/api/:1?id=:2', 'rest']
];
