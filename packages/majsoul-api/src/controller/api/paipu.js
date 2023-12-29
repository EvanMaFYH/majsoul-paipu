const axios = require('axios')
var protobuf = require("protobufjs")
const WebSocket = require('ws')
const uuidv4 = require("uuid/v4")
const hmacSHA512 = require('crypto-js/hmac-sha256')
const _isBuffer = require('lodash.isbuffer')
let protobufRoot, protobufWrapper, ws, isConnect, majsoulHttp, versionInfo, clientVersionString, access_token
let _index = 1
let _inflightRequests = {}
let messageQueue = []
const DEVICE_INFO = {
    platform: "pc",
    hardware: "pc",
    os: "windows",
    os_version: "win10",
    is_browser: true,
    software: "Chrome",
    sale_platform: "web",
}
module.exports = class extends think.Controller {
    async __before() {
        if (!majsoulHttp) {
            majsoulHttp = axios.create({
                baseURL: think.config('majsoulBaseUrl')
            })
        }
        if (!protobufRoot) {
            versionInfo = await this.majsoulRequest('version.json')
            clientVersionString = "web-" + versionInfo.version.replace(/\.[a-z]+$/i, "")
            const resInfo = await this.majsoulRequest(`resversion${versionInfo.version}.json`)
            const pbVersion = resInfo.res["res/proto/liqi.json"].prefix
            const liqiJson = await this.majsoulRequest(`${pbVersion}/res/proto/liqi.json`)
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

    async postAction() {
        const {uuid_list} = this.post()
        let uuidList = []
        if (Array.isArray(uuid_list) && uuid_list.length > 0) {
            uuid_list.forEach(uuid => {
                uuidList.push(this.formatUuid(uuid))
            })
        }
        if (uuidList.length > 0) {
            const res = await this.websocketRequest('.lq.Lobby.fetchGameRecordsDetail', {
                uuid_list: uuidList
            })
            this.success(res)
        } else {
            this.success(null)
        }
    }

    // 根据牌谱获取uuid
    formatUuid(uuid) {
        if (!uuid.startsWith('http')) {
            uuid = uuid.substring(uuid.indexOf('http'))
        }
        uuid = this.getQueryString(uuid, 'paipu')
        uuid = uuid.split('_').shift()
        return uuid
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

    // 请求雀魂相关json
    async majsoulRequest(url) {
        const res = await majsoulHttp.request(url)
        return res.data
    }

    protobufInit(json) {
        protobufRoot = protobuf.Root.fromJSON(json);
        protobufWrapper = protobufRoot.nested.lq.Wrapper
        console.log('protobuf data load complete');
    }

    lookupMethod(path) {
        if (typeof path === "string") {
            path = path.split(".");
        }
        if (0 === path.length) {
            return null;
        }
        const service = protobufRoot.lookupService(path.slice(0, -1));
        if (!service) {
            return null;
        }
        const name = path[path.length - 1];
        return service.methods[name];
    }

    // encode请求参数
    encodeRequest({methodName, payload}) {
        const currentIndex = _index++;
        const methodObj = this.lookupMethod(methodName);
        const requestType = methodObj.parent.parent.lookupType(methodObj.requestType);
        const responseType = methodObj.parent.parent.lookupType(methodObj.responseType);
        const msg = protobufWrapper
            .encode({
                name: methodName,
                data: requestType.encode(payload).finish(),
            })
            .finish();
        _inflightRequests[currentIndex] = {
            methodName,
            typeObj: responseType,
        };
        return {
            reqIndex: currentIndex,
            buffer: Buffer.concat([Buffer.from([2, currentIndex & 0xff, currentIndex >> 8]), msg])
        };
    }

    // decode请求参数
    decodeMessage(buf) {
        const type = buf[0];
        const reqIndex = buf[1] | (buf[2] << 8);
        const msg = protobufWrapper.decode(buf.slice(3));
        let typeObj, methodName;
        if (type === 2) {
            methodName = msg.name;
            const methodObj = this.lookupMethod(msg.name);
            const typeName = methodObj.requestType;
            typeObj = methodObj.parent.parent.lookupType(typeName);
        } else {
            ({typeObj, methodName} = _inflightRequests[reqIndex] || {});
            if (!typeObj) {
                throw new Error(`Unknown request ${reqIndex}`);
            }
            delete _inflightRequests[reqIndex];
        }
        return {
            type,
            reqIndex,
            methodName,
            payload: typeObj.decode(msg.data),
        };
    }

    // 建立websocket连接
    createConnection() {
        return new Promise((resolve, reject) => {
            ws = new WebSocket(think.config('majsoulWssUrl'), {
                perMessageDeflate: false
            })
            ws.on('error', (err) => {
                console.log(error)
                isConnect = false
                reject(err)
            });
            ws.on('open', async function open() {
                isConnect = true
                resolve()
            });
            ws.on('message', (data) => {
                if (data && _isBuffer(data)) {
                    messageQueue.push(this.decodeMessage(data))
                }
            });
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
                payload
            })
            ws.send(encodeData.buffer)
            let res = await this.getMessage(encodeData.reqIndex)
            if (res && res.payload && res.payload.error && res.payload.error.code === 1004) {
                this.majsoulLogin()
            }
            resolve(res ? res.payload : null)
        })
    }

    // 获取websocket返回的值
    async getMessage(reqIndex) {
        let delayTime = 0
        while (messageQueue.length === 0 || messageQueue.findIndex(item => item.reqIndex === reqIndex) === -1) {
            await this.delay(200)
            delayTime += 200
            if (delayTime > 10000) {
                return null
            }
        }
        const index = messageQueue.findIndex(item => item.reqIndex === reqIndex)
        const result = messageQueue[index]
        messageQueue.splice(index, 1)
        return result
    }

    // 雀魂账号密码登录
    async majsoulLogin() {
        const res = await this.websocketRequest('.lq.Lobby.login', {
            account: think.config('majsoulUserName'),
            password: hmacSHA512(think.config('majsoulPassword'), 'lailai').toString(),
            reconnect: true,
            device: DEVICE_INFO,
            random_key: uuidv4(),
            client_version: {
                resource: versionInfo.version
            },
            gen_access_token: true,
            type: 0,
            currency_platforms: [],
            client_version_string: clientVersionString,
            tag: "cn"
        })
        access_token = res.access_token
    }

    // 雀魂token检测有效性
    async majsoulOauth2Check() {
        const res = await this.websocketRequest('.lq.Lobby.oauth2Check', {
            type: 0,
            access_token
        })
        return res.has_account
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
};
