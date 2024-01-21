const WebSocket = require('ws');
const _isBuffer = require('lodash.isbuffer');
const uuidv4 = require('uuid/v4');
const hmacSHA512 = require('crypto-js/hmac-sha256');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const Majsoul = require('../majsoul');
const util = require('../../util');
module.exports = class extends Majsoul {
  __before() {
    return Promise.resolve(super.__before()).then(() => {
      this.messageQueue = [];
      this.reqIndex = 1;
      this._inflightRequests = {};
    });
  }

  async postAction() {
    let tempFilePath;
    try {
      const { username, password, startDate, endDate, type } = this.post();
      await this.createConnection();
      await this.majsoulLogin(username, password);
      const paipuUuid = await this.getPaipuAll(type, startDate, endDate);
      const fileUuid = uuidv4();
      tempFilePath = path.join(think.ROOT_PATH, `runtime/file/${fileUuid}.txt`);
      fse.ensureFileSync(tempFilePath);
      fs.writeFileSync(tempFilePath, paipuUuid.join('\n'));
      const res = fs.readFileSync(tempFilePath);
      this.header('response-type', 'application/octet-stream');
      this.header('Access-Control-Expose-Headers', 'filename');
      this.header(
        'Content-Disposition',
        `attachment; filename=${encodeURI('牌谱uuid')}.txt`
      );
      this.header('filename', `${encodeURI('牌谱uuid')}.txt`);
      this.body = res;
    } catch (e) {
      this.fail(1, typeof e === 'string' ? e : e.message);
    } finally {
      if (this.ws) {
        this.ws.terminate();
      }
      if (tempFilePath) {
        fse.removeSync(tempFilePath);
      }
    }
  }

  // 建立websocket连接
  createConnection() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(think.config('majsoulWssUrl'), {
        perMessageDeflate: false
      });
      this.ws.on('error', (error) => {
        reject(error);
      });
      this.ws.on('close', () => {
        console.log('------------paipi-download-ws-close-------------');
      });
      this.ws.on('open', async function open() {
        resolve();
      });
      this.ws.on('message', (data) => {
        if (data && _isBuffer(data)) {
          const decodeData = this.decodeMessage(data);
          if (decodeData) {
            this.messageQueue.push(decodeData);
          }
        }
      });
    });
  }

  encodeRequest({ methodName, payload }) {
    const currentIndex = this.reqIndex++;
    const methodObj = this.lookupMethod(methodName);
    const requestType = methodObj.parent.parent.lookupType(
      methodObj.requestType
    );
    const responseType = methodObj.parent.parent.lookupType(
      methodObj.responseType
    );
    const msg = think.app.protobufWrapper
      .encode({
        name: methodName,
        data: requestType.encode(payload).finish()
      })
      .finish();
    this._inflightRequests[currentIndex] = {
      methodName,
      typeObj: responseType
    };
    return {
      reqIndex: currentIndex,
      buffer: Buffer.concat([
        Buffer.from([2, currentIndex & 0xff, currentIndex >> 8]),
        msg
      ])
    };
  }

  // decode请求参数
  decodeMessage(buf) {
    const type = buf[0];
    if (type === 3) {
      const reqIndex = buf[1] | (buf[2] << 8);
      const msg = think.app.protobufWrapper.decode(buf.slice(3));
      const { typeObj, methodName } = this._inflightRequests[reqIndex] || {};
      if (!typeObj) {
        throw new Error(`Unknown request ${reqIndex}`);
      }
      delete this._inflightRequests[reqIndex];
      return {
        type,
        reqIndex,
        methodName,
        payload: typeObj.decode(msg.data)
      };
    }
    return null;
  }

  // 发送websoket请求
  websocketRequest(methodName, payload) {
    return new Promise(async(resolve) => {
      const encodeData = this.encodeRequest({
        methodName,
        payload
      });
      this.ws.send(encodeData.buffer);
      const res = await this.getMessage(encodeData.reqIndex);
      resolve(res ? res.payload : null);
    });
  }

  // 获取websocket返回的值
  async getMessage(reqIndex) {
    let delayTime = 0;
    while (
      this.messageQueue.length === 0 ||
      this.messageQueue.findIndex((item) => item.reqIndex === reqIndex) === -1
    ) {
      await this.delay(200);
      delayTime += 200;
      if (delayTime > 10000) {
        return null;
      }
    }
    const index = this.messageQueue.findIndex(
      (item) => item.reqIndex === reqIndex
    );
    const result = this.messageQueue[index];
    this.messageQueue.splice(index, 1);
    return result;
  }

  // 雀魂账号密码登录
  async majsoulLogin(username, password) {
    const res = await this.websocketRequest('.lq.Lobby.login', {
      account: username,
      password: hmacSHA512(password, 'lailai').toString(),
      reconnect: true,
      device: this.deviceInfo,
      random_key: uuidv4(),
      client_version: {
        resource: think.app.versionInfo.version
      },
      gen_access_token: true,
      type: 0,
      currency_platforms: [],
      client_version_string: think.app.clientVersionString,
      tag: 'cn'
    });
    if (res && res.error) {
      return Promise.reject(new Error('账号登录失败'));
    }
  }

  // 分页获取牌谱
  // 全部type=0友人场type=1匹配type=2比赛场type=4
  async getPaipuByPage(type = 0, start = 0, count = 10) {
    const res = await this.websocketRequest('.lq.Lobby.fetchGameRecordList', {
      start,
      count,
      type
    });
    let list = [];
    if (res && res.record_list) {
      list = res.record_list;
    }
    return list;
  }

  // 获取全部牌谱
  async getPaipuAll(type, startDate, endDate) {
    let flag = true;
    let start = 0;
    let effectUuid = [];
    while (flag) {
      let paipu = await this.getPaipuByPage(type, start, 10);
      if (paipu && paipu.length > 0) {
        if (startDate) {
          paipu = paipu.filter(
            (item) => util.toDate(item.start_time * 1000) >= startDate
          );
        }
        // 分页查询雀魂牌谱时防止牌谱总数过多查询次数太多导致接口超时，限制开始日期必填，当某次分页查询出的牌谱开始日期都小于输入的开始日期时结束分页查询
        if (paipu.length === 0) {
          flag = false;
        }
        if (endDate) {
          paipu = paipu.filter(
            (item) => util.toDate(item.end_time * 1000) <= endDate
          );
        }
        if (paipu.length > 0) {
          effectUuid = effectUuid.concat(paipu.map((item) => item.uuid));
        }
        start += 10;
      } else {
        flag = false;
      }
    }
    return effectUuid;
  }
};
