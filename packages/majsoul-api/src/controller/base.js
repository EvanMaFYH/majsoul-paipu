const util = require('../util');
module.exports = class extends think.Controller {
  __before() {
    const allowOrigin = think.config('allowOrigin') || '*';
    this.header('Access-Control-Allow-Origin', allowOrigin);
    this.header(
      'Access-Control-Allow-Headers',
      'x-requested-with,content-type'
    );
    this.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
    this.header('Access-Control-Allow-Credentials', true);
    const method = this.method.toLowerCase();
    if (method === 'options') {
      this.ctx.body = 200;
      return false;
    }
    this.recordIp();
  }
  async recordIp() {
    const ip = this.ctx.request.ip;
    let ipList = await this.cache('requestIpList');
    if (!Array.isArray(ipList)) {
      ipList = [];
    }
    ipList.push({
      ip,
      time: util.toDateTime(new Date())
    });
    await this.cache('requestIpList', ipList, {timeout: 1000000 * 24 * 60 * 60 * 1000});
  }
};
