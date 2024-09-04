const Base = require('./base');
const axios = require('axios');
const protobuf = require('protobufjs');
const util = require('../util');

const DEVICE_INFO = {
  platform: 'pc',
  hardware: 'pc',
  os: 'windows',
  os_version: 'win10',
  is_browser: true,
  software: 'Chrome',
  sale_platform: 'web'
};
module.exports = class extends Base {
  __before() {
    return Promise.resolve(super.__before()).then(async() => {
      await this.initJson();
      this.deviceInfo = DEVICE_INFO;
    });
  }

  __after() {
    if (think.config('enableLog')) {
      const method = this.method.toLowerCase();
      if (method !== 'options') {
        this.saveRequestLog();
      }
    }
  }

  saveRequestLog() {
    const model = this.model('t_log');
    model.add({
      request_ip: this.ip,
      user_agent: this.userAgent,
      request_method: this.method,
      request_url: this.ctx.url,
      request_time: util.toDateTime(new Date())
    });
  }

  async initJson() {
    if (!think.app.majsoulHttp) {
      think.app.majsoulHttp = axios.create({
        baseURL: think.config('majsoulBaseUrl')
      });
    }
    if (!this.protobufRoot) {
      this.versionInfo = await this.majsoulRequest('version.json');
      this.clientVersionString =
        'web-' + this.versionInfo.version.replace(/\.[a-z]+$/i, '');
      let liqiJson = null;
      const liqiCache = await this.cache(this.versionInfo.version);
      if (!liqiCache) {
        const resInfo = await this.majsoulRequest(
          `resversion${this.versionInfo.version}.json`
        );
        const pbVersion = resInfo.res['res/proto/liqi.json'].prefix;
        liqiJson = await this.majsoulRequest(`${pbVersion}/res/proto/liqi.json`);
        await this.cache(this.versionInfo.version, liqiJson, {
          timeout: 25 * 24 * 60 * 60 * 1000
        });
      } else {
        liqiJson = liqiCache;
      }
      this.protobufInit(liqiJson);
    }
  }

  protobufInit(json) {
    this.protobufRoot = protobuf.Root.fromJSON(json);
    this.protobufWrapper = this.protobufRoot.nested.lq.Wrapper;
    console.log('protobuf data load complete');
  }

  // 请求雀魂相关json
  async majsoulRequest(url) {
    const res = await think.app.majsoulHttp.request(url);
    return res.data;
  }

  lookupMethod(path) {
    if (typeof path === 'string') {
      path = path.split('.');
    }
    if (path.length === 0) {
      return null;
    }
    const service = this.protobufRoot.lookupService(path.slice(0, -1));
    if (!service) {
      return null;
    }
    const name = path[path.length - 1];
    return service.methods[name];
  }

  delay(time = 1000) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
};
