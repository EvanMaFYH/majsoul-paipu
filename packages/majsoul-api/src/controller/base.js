const util = require('../util');
module.exports = class extends think.Controller {
  __before() {
    const allowOrigin = think.config('allowOrigin')
    if(Array.isArray(allowOrigin) && allowOrigin.length > 0) {
      const currentOrigin = this.header('origin');
      if (allowOrigin.includes(currentOrigin)) {
        this.header('Access-Control-Allow-Origin', currentOrigin);
      }
    } else {
      this.header('Access-Control-Allow-Origin', '*');
    }
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
  }
};
