module.exports = [
  ['/api/paipu/statistic', '/api/paipu/statistic', 'post'],
  [/\/api\/private-search\/(\S+)/, '/api/private-search/:1', 'get'],
  ['/api/private-search/reloadSelf', '/api/private-search/reloadSelf', 'get'],
  [/\/api\/(\S+)(?:\/(\S+))?/, '/api/:1?id=:2', 'rest']
];
