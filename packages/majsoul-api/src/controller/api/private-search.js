const Base = require('../base');
module.exports = class extends Base {
  async requestIpAction() {
    const ipList = await this.cache('requestIpList');
    this.success(ipList);
  }
};
