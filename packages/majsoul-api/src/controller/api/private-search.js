const {execSync} = require('child_process');
const Base = require('../base');
module.exports = class extends Base {
  async requestIpAction() {
    const model = this.model('t_log');
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const ipList = await model.page(page, size).countSelect();
    this.success(ipList);
  }
  reloadSelfAction() {
    if (this.get('user') === 'mayf') {
      execSync('pm2 reload 0');
    }
  }
};
