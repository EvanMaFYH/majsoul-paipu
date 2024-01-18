const fs = require('fs');
const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');
const hmacSHA512 = require('crypto-js/hmac-sha256');
const _isBuffer = require('lodash.isbuffer');
const _uniqBy = require('lodash.uniqby');
const ExcelJS = require('exceljs');
const Majsoul = require('../majsoul');
const util = require('../../util');
let ws,
  isConnect,
  access_token;
let _index = 1;
const _inflightRequests = {};
const messageQueue = [];
let lastHeatBeatTime = null;
const heartBeatInterval = null;
module.exports = class extends Majsoul {
  __before() {
    return Promise.resolve(super.__before()).then(async() => {
      await this.init();
    });
  }

  async init() {
    this.retryTimes = 0;
    if (!isConnect) {
      await this.createConnection();
    }
    if (access_token) {
      const hasAccount = await this.majsoulOauth2Check();
      if (!hasAccount) {
        await this.majsoulLogin();
      }
    } else {
      await this.majsoulLogin();
    }
  }

  // 相同四个人牌谱统计算分
  async postAction() {
    const { paipuList } = this.post();
    const uuidList = this.getUuidList(paipuList);
    if (uuidList.length > 0) {
      const res = await this.websocketRequest(
        '.lq.Lobby.fetchGameRecordsDetail',
        {
          uuid_list: uuidList
        }
      );
      if (res && res.record_list && res.record_list.length > 0) {
        // 牌谱去重
        const recordList = _uniqBy(res.record_list, 'uuid');
        const formatList = recordList.map((item) =>
          this.formatPaipuRecord(item)
        );
        this.success(formatList);
      } else {
        this.success([]);
      }
    } else {
      this.success(null);
    }
  }

  // 牌谱积分统计
  async statisticAction() {
    const file = this.file('file');
    let paipuList = [];
    if (file) {
      const fileContent = fs.readFileSync(file.path, { encoding: 'utf-8' });
      if (fileContent) {
        paipuList = fileContent.split('\n');
      }
    }
    const uuidList = this.getUuidList(paipuList);
    const res = await this.websocketRequest(
      '.lq.Lobby.fetchGameRecordsDetail',
      {
        uuid_list: uuidList
      }
    );
    if (res && res.record_list && res.record_list.length > 0) {
      // 牌谱去重
      const recordList = _uniqBy(res.record_list, 'uuid');
      let playerList = [];
      const gameList = recordList
        .sort((a, b) => a.start_time - b.start_time)
        .map((item) => {
          const formatRecord = this.formatPaipuRecord(item);
          playerList = playerList.concat(
            formatRecord.map((item) => ({
              accountId: item.accountId,
              nickName: item.nickName
            }))
          );
          return {
            gameDate: util.toDate(item.start_time * 1000),
            gameInfo: formatRecord
          };
        });
      const uniquePlayerList = _uniqBy(playerList, 'accountId').sort(
        (a, b) => a.accountId - b.accountId
      );
      const buffer = await this.generateExcel(uniquePlayerList, gameList);
      this.header('response-type', 'application/octet-stream');
      this.header('Access-Control-Expose-Headers', 'filename');
      this.header(
        'Content-Disposition',
        `attachment; filename=${encodeURI('牌谱统计')}.xlsx`
      );
      this.header('filename', `${encodeURI('牌谱统计')}.xlsx`);
      this.body = buffer;
    }
  }

  // 根据牌谱以及所有牌谱涉及到的用户导出excel
  async generateExcel(playerList, gameList) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('My Sheet');
    const columns = playerList.map((item) => ({
      header: item.nickName,
      key: item.accountId,
      width: 15
    }));
    columns.unshift({ header: '日期', key: 'date', width: 15 });
    worksheet.columns = columns;
    gameList.forEach((item) => {
      const playScore = playerList
        .map((p) => p.accountId)
        .reduce((total, current) => {
          const userGameInfo = item.gameInfo.find(
            (i) => i.accountId === current
          );
          total[current] = userGameInfo ? userGameInfo.finalScore : '';
          return total;
        }, {});
      worksheet.addRow({ date: item.gameDate, ...playScore });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // 根据牌谱列表获取uuid列表
  getUuidList(paipuList) {
    const uuidList = [];
    if (Array.isArray(paipuList) && paipuList.length > 0) {
      paipuList.forEach((uuid) => {
        const formatUuid = this.formatUuid(uuid);
        if (formatUuid) {
          uuidList.push(formatUuid);
        }
      });
    }
    return uuidList;
  }

  // 根据牌谱获取uuid
  formatUuid(uuid) {
    if (this.isUuid(uuid)) {
      return uuid;
    }
    if (uuid.includes('http')) {
      if (!uuid.startsWith('http')) {
        uuid = uuid.substring(uuid.indexOf('http'));
      }
      uuid = this.getQueryString(uuid, 'paipu');
    }
    if (uuid) {
      uuid = uuid.split('_').shift();
    }
    return uuid;
  }

  // 判断是否是uuid格式
  isUuid(str) {
    return /^\S{6}-\S{8}-\S{4}-\S{4}-\S{4}-\S{12}$/.test(str);
  }

  // 获取url的query参数
  getQueryString(url, key) {
    const reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)');
    const searchStr = url.split('?').pop();
    const r = searchStr.match(reg);
    if (r) {
      return decodeURIComponent(r[2]);
    }
    return null;
  }

  // 将某一个牌谱转换为一个数组，数组的每一项由参与者以及最终得分组成
  formatPaipuRecord(record) {
    // 去除无用参数并且根据用户id排序
    const playerList = record.accounts
      .map((item) => {
        const playerResult = record.result.players.find(
          (i) => i.seat === item.seat
        );
        return {
          accountId: item.account_id,
          nickName: item.nickname,
          finalPoint: playerResult.part_point_1,
          finalScore: playerResult.total_point / 1000
        };
      })
      .sort((a, b) => a.accountId - b.accountId);
    return playerList;
  }

  // encode请求参数
  encodeRequest({ methodName, payload }) {
    const currentIndex = _index++;
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
    _inflightRequests[currentIndex] = {
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
      const {typeObj, methodName} = _inflightRequests[reqIndex] || {};
      if (!typeObj) {
        throw new Error(`Unknown request ${reqIndex}`);
      }
      delete _inflightRequests[reqIndex];
      return {
        type,
        reqIndex,
        methodName,
        payload: typeObj.decode(msg.data)
      };
    }
    return null;
  }

  // 建立websocket连接
  createConnection() {
    return new Promise((resolve, reject) => {
      ws = new WebSocket(think.config('majsoulWssUrl'), {
        perMessageDeflate: false
      });
      ws.on('error', (error) => {
        console.log('------------error-------------');
        console.log(error);
        isConnect = false;
        reject(error);
      });
      ws.on('close', () => {
        console.log('------------close-------------');
        isConnect = false;
      });
      ws.on('open', async function open() {
        isConnect = true;
        resolve();
      });
      ws.on('message', (data) => {
        if (data && _isBuffer(data)) {
          const decodeData = this.decodeMessage(data);
          if (decodeData) {
            messageQueue.push(decodeData);
          }
        }
      });
    });
  }

  // 发送websoket请求
  websocketRequest(methodName, payload) {
    return new Promise(async(resolve) => {
      const encodeData = this.encodeRequest({
        methodName,
        payload
      });
      ws.send(encodeData.buffer);
      const res = await this.getMessage(encodeData.reqIndex);
      if (
        res &&
        res.payload &&
        res.payload.error &&
        res.payload.error.code === 1004
      ) {
        this.majsoulLogin();
      }
      resolve(res ? res.payload : null);
    });
  }

  // 获取websocket返回的值
  async getMessage(reqIndex) {
    let delayTime = 0;
    while (
      messageQueue.length === 0 ||
      messageQueue.findIndex((item) => item.reqIndex === reqIndex) === -1
    ) {
      await this.delay(200);
      delayTime += 200;
      if (delayTime > 10000) {
        return null;
      }
    }
    const index = messageQueue.findIndex((item) => item.reqIndex === reqIndex);
    const result = messageQueue[index];
    messageQueue.splice(index, 1);
    return result;
  }

  // 雀魂账号密码登录
  async majsoulLogin() {
    const res = await this.websocketRequest('.lq.Lobby.login', {
      account: think.config('majsoulUserName'),
      password: hmacSHA512(
        think.config('majsoulPassword'),
        'lailai'
      ).toString(),
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
    if (res && res.access_token) {
      access_token = res.access_token;
      // if (heartBeatInterval) {
      //   clearInterval(heartBeatInterval)
      //   heartBeatInterval = null
      // }
      // heartBeatInterval = setInterval(() => {
      //   this.majsoulHeartBeat()
      // }, 360000)
    } else if (this.retryTimes < 5) {
      if (ws) {
        ws.terminate();
      }
      await this.createConnection();
      this.retryTimes++;
      await this.majsoulLogin();
    }
  }

  // 雀魂token检测有效性
  async majsoulOauth2Check() {
    const res = await this.websocketRequest('.lq.Lobby.oauth2Check', {
      type: 0,
      access_token
    });
    return res ? res.has_account : false;
  }

  async majsoulHeartBeat() {
    const currentTime = new Date().getTime();
    const no_operation_counter = lastHeatBeatTime
      ? currentTime - lastHeatBeatTime
      : 0;
    await this.websocketRequest('.lq.Lobby.heatbeat', {
      no_operation_counter
    });
    lastHeatBeatTime = currentTime;
  }

  // async majsoulOauth2Login() {
  //     const res = await this.websocketRequest('.lq.Lobby.oauth2Login', {
  //         type: 0,
  //         access_token,
  //         reconnect: false,
  //         device: this.deviceInfo,
  //         random_key: uuidv4(),
  //         client_version: {resource: think.app.versionInfo.version},
  //         currency_platforms: [],
  //         client_version_string: think.app.clientVersionString,
  //         tag: 'cn'
  //     })
  //     return res
  // }
};
