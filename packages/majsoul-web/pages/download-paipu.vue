<template>
  <div class="download-paipu">
    <div class="download-paipu-content">
      <el-form ref="form" :model="form" :rules="rules" label-width="auto">
        <el-form-item prop="username" label="雀魂账号：">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item prop="password" label="雀魂密码：">
          <el-input v-model="form.password" type="password"></el-input>
          <el-tooltip effect="dark" content="如担心密码泄漏请勿使用该功能">
            <i class="el-icon-warning"></i>
          </el-tooltip>
        </el-form-item>
        <el-form-item prop="type" label="牌谱类型：">
          <el-radio-group v-model="form.type">
            <el-radio
              v-for="item in typeList"
              :key="item.value"
              :label="item.value"
              >{{ item.label }}</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="startDate" label="开始日期：">
          <el-date-picker
            v-model="form.startDate"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item prop="endDate" label="结束日期：">
          <el-date-picker
            v-model="form.endDate"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="exportTxt"
            >导出牌谱txt</el-button
          >
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import utils from '@/plugins/utils'
export default {
  data() {
    return {
      form: {
        type: 1,
      },
      loading: false,
      typeList: [
        { label: '全部', value: 0 },
        { label: '友人场', value: 1 },
        { label: '段位场', value: 2 },
        { label: '比赛场', value: 4 },
      ],
      rules: {
        username: {
          required: true,
          message: '请输入雀魂账号',
          trigger: 'blur',
        },
        password: {
          required: true,
          message: '请输入雀魂密码',
          trigger: 'blur',
        },
        type: {
          required: true,
          message: '请选择牌谱类型',
        },
        startDate: {
          required: true,
          message: '请选择开始日期',
        },
      },
    }
  },
  head() {
    return {
      title: '牌谱下载',
    }
  },
  methods: {
    exportTxt() {
      this.$refs.form.validate(async (res) => {
        if (res) {
          this.loading = true
          const { code, data, headers } = await this.$http.request(
            'api/download-paipu',
            {
              method: 'post',
              data: this.form,
              responseType: 'blob',
              timeout: 60000,
            }
          )
          if (code === 0) {
            utils.downloadFile(data, decodeURI(headers.filename))
          }
          this.loading = false
        }
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.download-paipu {
  padding: 30px 0;
  &-content {
    width: 1200px;
    margin: 0 auto;
    .el-input {
      width: 250px;
    }
    .el-icon-warning {
      color: #f56c6c;
      font-size: 18px;
      margin-left: 6px;
    }
  }
}
</style>
