const fs = require('fs')
const axios = require('axios')
var protobuf = require('protobufjs')
const WebSocket = require('ws')
const uuidv4 = require('uuid/v4')
const hmacSHA512 = require('crypto-js/hmac-sha256')
const _isBuffer = require('lodash.isbuffer')
const _uniqBy = require('lodash.uniqby')
const ExcelJS = require('exceljs')
const Base = require('../base')
const util = require('../../util')
let protobufRoot,
  protobufWrapper,
  ws,
  isConnect,
  majsoulHttp,
  versionInfo,
  clientVersionString,
  access_token
let _index = 1
let _inflightRequests = {}
let messageQueue = []
let retryTimes = 0
const DEVICE_INFO = {
  platform: 'pc',
  hardware: 'pc',
  os: 'windows',
  os_version: 'win10',
  is_browser: true,
  software: 'Chrome',
  sale_platform: 'web',
}
module.exports = class extends Base {
  __before() {
    return Promise.resolve(super.__before()).then(async () => {
      await this.init()
    })
  }

  __after() {
    retryTimes = 0
  }

  async init() {
    if (!majsoulHttp) {
      majsoulHttp = axios.create({
        baseURL: think.config('majsoulBaseUrl'),
      })
    }
    if (!protobufRoot) {
      versionInfo = await this.majsoulRequest('version.json')
      clientVersionString =
        'web-' + versionInfo.version.replace(/\.[a-z]+$/i, '')
      const resInfo = await this.majsoulRequest(
        `resversion${versionInfo.version}.json`
      )
      const pbVersion = resInfo.res['res/proto/liqi.json'].prefix
      const liqiJson = await this.majsoulRequest(
        `${pbVersion}/res/proto/liqi.json`
      )
      this.protobufInit(liqiJson)
    }
    if (!isConnect) {
      await this.createConnection()
    }
    if (access_token) {
      const hasAccount = await this.majsoulOauth2Check()
      if (!hasAccount) {
        await this.majsoulLogin()
      }
    } else {
      await this.majsoulLogin()
    }
  }

  // 相同四个人牌谱统计算分
  async postAction() {
    const { paipuList } = this.post()
    const uuidList = this.getUuidList(paipuList)
    if (uuidList.length > 0) {
      const res = await this.websocketRequest(
        '.lq.Lobby.fetchGameRecordsDetail',
        {
          uuid_list: uuidList,
        }
      )
      if (res && res.record_list && res.record_list.length > 0) {
        // 牌谱去重
        const recordList = _uniqBy(res.record_list, 'uuid')
        const formatList = recordList.map((item) =>
          this.formatPaipuRecord(item)
        )
        this.success(formatList)
      } else {
        this.success([])
      }
    } else {
      this.success(null)
    }
  }

  // 牌谱积分统计
  async statisticAction() {
    const file = this.file('file')
    let paipuList = []
    if (file) {
      const fileContent = fs.readFileSync(file.path, { encoding: 'utf-8' })
      if (fileContent) {
        paipuList = fileContent.split('\n')
      }
    }
    const uuidList = this.getUuidList(paipuList)
    const res = await this.websocketRequest(
      '.lq.Lobby.fetchGameRecordsDetail',
      {
        uuid_list: uuidList,
      }
    )
    if (res && res.record_list && res.record_list.length > 0) {
      // 牌谱去重
      const recordList = _uniqBy(res.record_list, 'uuid')
      let playerList = []
      const gameList = recordList
        .sort((a, b) => a.start_time - b.start_time)
        .map((item) => {
          const formatRecord = this.formatPaipuRecord(item)
          playerList = playerList.concat(
            formatRecord.map((item) => ({
              accountId: item.accountId,
              nickName: item.nickName,
            }))
          )
          return {
            gameDate: util.toDate(item.start_time * 1000),
            gameInfo: formatRecord,
          }
        })
      const uniquePlayerList = _uniqBy(playerList, 'accountId').sort(
        (a, b) => a.accountId - b.accountId
      )
      const buffer = await this.generateExcel(uniquePlayerList, gameList)
      this.header('response-type', 'application/octet-stream')
      this.header('Access-Control-Expose-Headers', 'filename')
      this.header(
        'Content-Disposition',
        `attachment; filename=${encodeURI('牌谱统计')}.xlsx`
      )
      this.header('filename', `${encodeURI('牌谱统计')}.xlsx`)
      this.body = buffer
    }
  }

  // 下载当前账号的牌谱
  async downloadPaipu() {
    let flag = true
    let start = 0
    let effectUuid = []
    while (flag) {
      const paipu = await this.getPaipu(1, 10, start)
      if (paipu && paipu.length > 0) {
        effectUuid = effectUuid.concat(
          paipu
            .filter(
              (item) => util.toDate(item.start_time * 1000) >= '2023-05-06'
            )
            .map((item) => item.uuid)
        )
        start += 10
      } else {
        flag = false
      }
    }
    fs.writeFileSync('文件地址', effectUuid.join('\n'))
  }

  // 根据牌谱以及所有牌谱涉及到的用户导出excel
  async generateExcel(playerList, gameList) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('My Sheet')
    const columns = playerList.map((item) => ({
      header: item.nickName,
      key: item.accountId,
      width: 15,
    }))
    columns.unshift({ header: '日期', key: 'date', width: 15 })
    worksheet.columns = columns
    gameList.forEach((item) => {
      const playScore = playerList
        .map((p) => p.accountId)
        .reduce((total, current) => {
          const userGameInfo = item.gameInfo.find(
            (i) => i.accountId === current
          )
          total[current] = userGameInfo ? userGameInfo.finalScore : ''
          return total
        }, {})
      worksheet.addRow({ date: item.gameDate, ...playScore })
    })
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
  }

  // 根据牌谱列表获取uuid列表
  getUuidList(paipuList) {
    let uuidList = []
    if (Array.isArray(paipuList) && paipuList.length > 0) {
      paipuList.forEach((uuid) => {
        const formatUuid = this.formatUuid(uuid)
        if (formatUuid) {
          uuidList.push(formatUuid)
        }
      })
    }
    return uuidList
  }

  // 根据牌谱获取uuid
  formatUuid(uuid) {
    if (this.isUuid(uuid)) {
      return uuid
    }
    if (uuid.includes('http')) {
      if (!uuid.startsWith('http')) {
        uuid = uuid.substring(uuid.indexOf('http'))
      }
      uuid = this.getQueryString(uuid, 'paipu')
    }
    if (uuid) {
      uuid = uuid.split('_').shift()
    }
    return uuid
  }

  // 判断是否是uuid格式
  isUuid(str) {
    return /^\S{6}-\S{8}-\S{4}-\S{4}-\S{4}-\S{12}$/.test(str)
  }

  // 获取url的query参数
  getQueryString(url, key) {
    const reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)')
    const searchStr = url.split('?').pop()
    const r = searchStr.match(reg)
    if (r) {
      return decodeURIComponent(r[2])
    }
    return null
  }

  // 将某一个牌谱转换为一个数组，数组的每一项由参与者以及最终得分组成
  formatPaipuRecord(record) {
    // 去除无用参数并且根据用户id排序
    const playerList = record.accounts
      .map((item) => {
        const playerResult = record.result.players.find(
          (i) => i.seat === item.seat
        )
        return {
          accountId: item.account_id,
          nickName: item.nickname,
          finalPoint: playerResult.part_point_1,
          finalScore: playerResult.total_point / 1000,
        }
      })
      .sort((a, b) => a.accountId - b.accountId)
    return playerList
  }

  // 请求雀魂相关json
  async majsoulRequest(url) {
    const res = await majsoulHttp.request(url)
    return res.data
  }

  protobufInit(json) {
    protobufRoot = protobuf.Root.fromJSON(json)
    protobufWrapper = protobufRoot.nested.lq.Wrapper
    console.log('protobuf data load complete')
  }

  lookupMethod(path) {
    if (typeof path === 'string') {
      path = path.split('.')
    }
    if (0 === path.length) {
      return null
    }
    const service = protobufRoot.lookupService(path.slice(0, -1))
    if (!service) {
      return null
    }
    const name = path[path.length - 1]
    return service.methods[name]
  }

  // encode请求参数
  encodeRequest({ methodName, payload }) {
    const currentIndex = _index++
    const methodObj = this.lookupMethod(methodName)
    const requestType = methodObj.parent.parent.lookupType(
      methodObj.requestType
    )
    const responseType = methodObj.parent.parent.lookupType(
      methodObj.responseType
    )
    const msg = protobufWrapper
      .encode({
        name: methodName,
        data: requestType.encode(payload).finish(),
      })
      .finish()
    _inflightRequests[currentIndex] = {
      methodName,
      typeObj: responseType,
    }
    return {
      reqIndex: currentIndex,
      buffer: Buffer.concat([
        Buffer.from([2, currentIndex & 0xff, currentIndex >> 8]),
        msg,
      ]),
    }
  }

  // decode请求参数
  decodeMessage(buf) {
    const type = buf[0]
    const reqIndex = buf[1] | (buf[2] << 8)
    const msg = protobufWrapper.decode(buf.slice(3))
    let typeObj, methodName
    if (type === 2) {
      methodName = msg.name
      const methodObj = this.lookupMethod(msg.name)
      const typeName = methodObj.requestType
      typeObj = methodObj.parent.parent.lookupType(typeName)
    } else {
      ;({ typeObj, methodName } = _inflightRequests[reqIndex] || {})
      if (!typeObj) {
        throw new Error(`Unknown request ${reqIndex}`)
      }
      delete _inflightRequests[reqIndex]
    }
    return {
      type,
      reqIndex,
      methodName,
      payload: typeObj.decode(msg.data),
    }
  }

  // 建立websocket连接
  createConnection() {
    return new Promise((resolve, reject) => {
      ws = new WebSocket(think.config('majsoulWssUrl'), {
        perMessageDeflate: false,
      })
      ws.on('error', (error) => {
        console.log('------------error-------------')
        console.log(error)
        isConnect = false
        reject(error)
      })
      ws.on('close', () => {
        console.log('------------close-------------')
        isConnect = false
      })
      ws.on('open', async function open() {
        isConnect = true
        resolve()
      })
      ws.on('message', (data) => {
        if (data && _isBuffer(data)) {
          messageQueue.push(this.decodeMessage(data))
        }
      })
    })
  }

  delay(time = 1000) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  }

  // 发送websoket请求
  websocketRequest(methodName, payload) {
    return new Promise(async (resolve) => {
      const encodeData = this.encodeRequest({
        methodName,
        payload,
      })
      ws.send(encodeData.buffer)
      let res = await this.getMessage(encodeData.reqIndex)
      if (
        res &&
        res.payload &&
        res.payload.error &&
        res.payload.error.code === 1004
      ) {
        this.majsoulLogin()
      }
      resolve(res ? res.payload : null)
    })
  }

  // 获取websocket返回的值
  async getMessage(reqIndex) {
    let delayTime = 0
    while (
      messageQueue.length === 0 ||
      messageQueue.findIndex((item) => item.reqIndex === reqIndex) === -1
    ) {
      await this.delay(200)
      delayTime += 200
      if (delayTime > 10000) {
        return null
      }
    }
    const index = messageQueue.findIndex((item) => item.reqIndex === reqIndex)
    const result = messageQueue[index]
    messageQueue.splice(index, 1)
    return result
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
      device: DEVICE_INFO,
      random_key: uuidv4(),
      client_version: {
        resource: versionInfo.version,
      },
      gen_access_token: true,
      type: 0,
      currency_platforms: [],
      client_version_string: clientVersionString,
      tag: 'cn',
    })
    if (res && res.access_token) {
      access_token = res.access_token
    } else if (retryTimes < 5) {
      if (ws) {
        ws.terminate()
      }
      await this.createConnection()
      retryTimes++
      await this.majsoulLogin()
    }
  }

  // 雀魂token检测有效性
  async majsoulOauth2Check() {
    const res = await this.websocketRequest('.lq.Lobby.oauth2Check', {
      type: 0,
      access_token,
    })
    return res ? res.has_account : false
  }

  // 获取牌谱
  // 全部type=0友人场type=1匹配type=2比赛场type=4
  async getPaipu(type = 0, count = 10, start = 0) {
    const res = await this.websocketRequest('.lq.Lobby.fetchGameRecordList', {
      start,
      count,
      type,
    })
    let list = []
    if (res && res.record_list) {
      list = res.record_list
    }
    return list
  }

  // async majsoulOauth2Login() {
  //     const res = await this.websocketRequest('.lq.Lobby.oauth2Login', {
  //         type: 0,
  //         access_token,
  //         reconnect: false,
  //         device: DEVICE_INFO,
  //         random_key: uuidv4(),
  //         client_version: {resource: versionInfo.version},
  //         currency_platforms: [],
  //         client_version_string: clientVersionString,
  //         tag: 'cn'
  //     })
  //     return res
  // }
}
