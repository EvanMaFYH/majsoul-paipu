const Base = require('../base');
module.exports = class extends Base {
  postAction() {
    this.rules = {
      username: {
        string: true,
        required: true,
        trim: true,
        aliasName: '雀魂账号'
      },
      password: {
        string: true,
        required: true,
        trim: true,
        aliasName: '雀魂密码'
      },
      type: {
        required: true,
        trim: true,
        aliasName: '牌谱类型'
      },
      startDate: {
        string: true,
        required: true,
        trim: true,
        aliasName: '开始日期'
      }
    };
  }
};
