const {execSync} = require('child_process');
const Base = require('../base');
module.exports = class extends Base {
  async requestIpAction() {
    const model = this.model('t_log');
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const ipList = await model.order('request_time DESC').page(page, size).countSelect();
    this.success(ipList);
  }
};
