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
      await this.recordIp();
    });
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

  async initJson() {
    if (!think.app.majsoulHttp) {
      think.app.majsoulHttp = axios.create({
        baseURL: think.config('majsoulBaseUrl')
      });
    }
    if (!think.app.protobufRoot) {
      think.app.versionInfo = await this.majsoulRequest('version.json');
      think.app.clientVersionString =
        'web-' + think.app.versionInfo.version.replace(/\.[a-z]+$/i, '');
      let liqiJson = null;
      const liqiCache = await this.cache(think.app.versionInfo.version);
      if (!liqiCache) {
        const resInfo = await this.majsoulRequest(
          `resversion${think.app.versionInfo.version}.json`
        );
        const pbVersion = resInfo.res['res/proto/liqi.json'].prefix;
        liqiJson = await this.majsoulRequest(`${pbVersion}/res/proto/liqi.json`);
        await this.cache(think.app.versionInfo.version, liqiJson, {
          timeout: 25 * 24 * 60 * 60 * 1000
        });
      } else {
        liqiJson = liqiCache;
      }
      this.protobufInit(liqiJson);
    }
  }

  protobufInit(json) {
    think.app.protobufRoot = protobuf.Root.fromJSON(json);
    think.app.protobufWrapper = think.app.protobufRoot.nested.lq.Wrapper;
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
    const service = think.app.protobufRoot.lookupService(path.slice(0, -1));
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
