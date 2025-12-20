module.exports = class extends think.Logic {
  __before() {
    const allowOrigin = '*';
    this.header('Access-Control-Allow-Origin', allowOrigin);
    this.header('Access-Control-Allow-Headers', 'x-requested-with,content-type');
    this.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
    this.header('Access-Control-Allow-Credentials', true);
    const method = this.method.toLowerCase();
    if (method === 'options') {
      this.ctx.body = 200;
      return false;
    }
  }
};
