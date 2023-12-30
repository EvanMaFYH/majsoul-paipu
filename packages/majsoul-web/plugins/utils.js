import dayjs from 'dayjs'
import _clonedeep from 'lodash.clonedeep'
import { MessageBox } from 'element-ui'
const FileSaver = require('file-saver')

const {
  isArray,
  isBoolean,
  isNumber,
  isString,
  isRegExp,
  isDate,
  isError,
} = require('core-util-is')
export default {
  formatDate(str, format = 'YYYY-MM-DD') {
    format = format.replace(/yyyy/g, 'YYYY').replace(/dd/g, 'DD')
    return dayjs(str).format(format)
  },
  toDate(str) {
    return this.formatDate(str)
  },
  toDateTime(str) {
    return this.formatDate(str, 'YYYY-MM-DD HH:mm:ss')
  },
  isNumber(str) {
    return isNumber(str)
  },
  isString(str) {
    return isString(str)
  },
  isBoolean(str) {
    return isBoolean(str)
  },
  isRegExp(str) {
    return isRegExp(str)
  },
  isDate(str) {
    return isDate(str)
  },
  isError(str) {
    return isError(str)
  },
  isNumberString(str) {
    if (!str) {
      return false
    }
    return this.REG.NUMBER.test(str)
  },
  isInteger(str) {
    if (isNaN(str) || isString(str)) {
      return false
    }
    const x = parseFloat(str)
    return (x | 0) === x
  },
  isIntegerString(str) {
    if (this.isNumberString(str)) {
      const x = parseFloat(str)
      return (x | 0) === x
    }
    return this.isInteger(str)
  },
  isObject(str) {
    return Object.prototype.toString.call(str) === '[object Object]'
  },
  isTrueEmpty(str) {
    if (str === undefined || str === null || str === '') {
      return true
    }
    if (this.isNumber(str) && isNaN(str)) {
      return true
    }
    return false
  },
  isEmpty(str) {
    if (this.isTrueEmpty(str)) {
      return true
    }
    if (isRegExp(str)) {
      return false
    } else if (isDate(str)) {
      return false
    } else if (isError(str)) {
      return false
    } else if (isArray(str)) {
      return str.length === 0
    } else if (isString(str)) {
      return str.length === 0
    } else if (isNumber(str)) {
      return str === 0
    } else if (isBoolean(str)) {
      return !str
    } else if (this.isObject(str)) {
      for (const key in str) {
        return false && key
      }
      return true
    }
    return false
  },
  confirm(content, options = {}) {
    return new Promise((resolve, reject) => {
      MessageBox.confirm(content, options.title || '提示', {
        confirmButtonText: options.confirmButtonText || '确定',
        cancelButtonText: options.cancelButtonText || '取消',
        type: options.type || 'warning',
      })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject(new Error('取消了操作'))
        })
    })
  },
  getQueryString(key) {
    const reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)')
    const r = window.location.search.substr(1).match(reg)
    if (r) {
      return decodeURIComponent(r[2])
    }
    return ''
  },
  trim(str) {
    if (!this.isTrueEmpty(str)) {
      if (isString(str)) {
        return str.trim()
      } else if (this.isObject(str)) {
        const newObj = _clonedeep(str)
        Object.keys(newObj).forEach((key) => {
          newObj[key] = this.trim(newObj[key])
        })
        return newObj
      } else if (isArray(str)) {
        const newArray = _clonedeep(str)
        newArray.forEach((item, index) => {
          newArray[index] = this.trim(newArray[index])
        })
        return newArray
      }
    }
    return str
  },
  joinPath(path1, path2) {
    return `${path1.replace(/\/+$/, '')}/${path2}`
  },
  downloadFile(data, fileName) {
    FileSaver.saveAs(data, fileName)
  },
}
