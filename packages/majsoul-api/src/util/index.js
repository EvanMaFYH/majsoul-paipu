import dayjs from 'dayjs'
module.exports = {
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
}
