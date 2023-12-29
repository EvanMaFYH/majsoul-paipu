import { Message } from 'element-ui'
import _debounce from 'lodash.debounce'
import utils from '@/plugins/utils'

const axios = require('axios')

export default class {
  constructor(baseURL, ctx, options = {}) {
    this.instance = axios.create({
      baseURL,
    })
    this.options = options
    this.instance.interceptors.request.use(
      (config) => {
        if (typeof this.options.beforeRequest === 'function') {
          this.options.beforeRequest(config)
        }
        const needTrim = utils.isTrueEmpty(config.needTrim)
          ? this.options.needTrim
          : config.needTrim
        if (needTrim) {
          if (!utils.isTrueEmpty(config.data)) {
            config.data = utils.trim(config.data)
          }
          if (!utils.isTrueEmpty(config.params)) {
            config.params = utils.trim(config.params)
          }
        }
        return config
      },
      function (error) {
        return Promise.reject(error)
      }
    )
    this.instance.interceptors.response.use(
      (response) => {
        const res = response.data
        if (response.config.responseType === 'json') {
          if (res.errno === 0) {
            const resData =
              typeof this.options.onResponseSuccess === 'function'
                ? this.options.onResponseSuccess(res.data)
                : res.data
            return {
              code: 0,
              data: resData,
              headers: response?.headers,
            }
          } else {
            this.onErrorMessage(res)
            return {
              code: res.code,
              data: res.data,
            }
          }
        } else {
          /* eslint-disable-next-line */
          if (res.type === 'application/json') {
            const fileReader = new FileReader()
            fileReader.onloadend = () => {
              const jsonResult = JSON.parse(fileReader.result)
              this.onErrorMessage(jsonResult)
            }
            fileReader.readAsText(res)
            return {
              code: 1,
              data: null,
            }
          } else {
            return {
              code: 0,
              data: res,
              headers: response?.headers,
            }
          }
        }
      },
      (error) => {
        const status = error?.response?.status
        if (status === 401) {
          // 暂时没有401情况
          return {
            code: 401,
            data: null,
          }
        } else if (status === 404) {
          if (process.client) {
            this.showErrorMessage('api地址不存在', 'error')
          }
          return {
            code: 404,
            data: null,
          }
        } else if (status === 500) {
          if (process.client) {
            this.showErrorMessage('服务器内部错误', 'error')
          }
          return {
            code: 500,
            data: null,
          }
        } else {
          if (error && process.client) {
            const errInfo = error.toString()
            if (errInfo.includes('Network Error')) {
              this.showErrorMessage('服务器连接失败', 'error')
            } else if (errInfo.includes('timeout')) {
              this.showErrorMessage('请求超时', 'error')
            }
          }
          return {
            code: 2,
            data: null,
          }
        }
      }
    )

    this.showErrorMessage = _debounce(function (message, type = 'warning') {
      Message[type](message)
    }, options.messageDebounceTime)
  }

  setHeader(name, value, scopes = 'common') {
    for (const scope of Array.isArray(scopes) ? scopes : [scopes]) {
      if (!value) {
        delete this.instance.defaults.headers[scope][name]
        continue
      }
      this.instance.defaults.headers[scope][name] = value
    }
  }

  getInstance() {
    return this.instance
  }

  async request(
    url,
    {
      method = 'GET',
      contentType = 'application/json',
      responseType = 'json',
      acceptLanguage = 'zh-CN',
      timeout = this.options.timeout,
      headers = {},
      ...rest
    } = {}
  ) {
    try {
      const requestOptions = {
        url,
        timeout,
        responseType,
        method: method.toUpperCase(),
        headers: {
          'content-type': contentType,
          'Accept-Language': acceptLanguage,
          ...headers,
        },
        ...rest,
      }
      if (rest.baseURL) {
        requestOptions.baseURL = rest.baseURL
      }
      const res = await this.instance.request(requestOptions)
      return res
    } catch (e) {
      return {
        code: 3,
        data: e,
      }
    }
  }

  onErrorMessage(res) {
    if (res.errmsg && typeof res.errmsg === 'string') {
      this.showErrorMessage(res.errmsg)
    }
  }
}
