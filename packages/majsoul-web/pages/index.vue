<template>
  <div class="page-home">
    <div class="paipu-form">
      <div class="paipu-form__action">
        <el-button type="primary" @click="newLine">添加一行</el-button>
      </div>
      <div class="paipu-form__content">
        <div
          v-for="(item, index) in paipuList"
          :key="index"
          class="paipu-form__line"
        >
          <el-input v-model="item.value" placeholder="请输入牌谱"></el-input>
          <el-button
            type="danger"
            icon="el-icon-delete"
            circle
            @click="deleteLine(index)"
          ></el-button>
        </div>
      </div>
      <div class="paipu-form__submit">
        <el-button type="primary" :loading="loading" @click="submit"
          >提交</el-button
        >
        <el-upload
          action=""
          :http-request="onUpload"
          :show-file-list="false"
          accept=".txt"
          style="display: inline-block"
        >
          <el-button type="primary" :loading="loading"
            >牌谱得分统计（上传txt）</el-button
          >
        </el-upload>
      </div>
    </div>
    <el-table
      v-if="resultList.length > 0"
      :data="resultList"
      show-summary
      :summary-method="getSummaries"
      style="margin-top: 10px"
    >
      <el-table-column
        label="序号"
        type="index"
        width="100px"
      ></el-table-column>
      <el-table-column
        v-for="(player, index) in resultList[0]"
        :key="index"
        :label="player.nickName"
        :formatter="(row) => row[index].finalScore"
      ></el-table-column>
    </el-table>
  </div>
</template>

<script>
import utils from '@/plugins/utils'
export default {
  data() {
    return {
      loading: false,
      paipuList: [{ value: '' }],
      resultList: [],
    }
  },
  head() {
    return {
      title: '牌谱算分/统计',
    }
  },
  methods: {
    newLine() {
      this.paipuList.push({ value: '' })
    },
    deleteLine(index) {
      this.paipuList.splice(index, 1)
    },
    async submit() {
      const paipuList = this.paipuList
        .filter((item) => item.value)
        .map((item) => item.value)
      if (paipuList.length === 0) {
        this.$message.warning('请输入至少一个牌谱')
        return
      }
      this.loading = true
      const { code, data } = await this.$http.request('api/paipu', {
        method: 'post',
        data: {
          paipuList,
        },
      })
      if (code === 0) {
        const list = data || []
        if (list.length > 1) {
          const accountList = list.reduce((total, current) => {
            current.forEach((item) => {
              total.push(item.accountId)
            })
            return total
          }, [])
          const set = new Set(accountList)
          const uniqueAccountList = Array.from(set)
          if (uniqueAccountList.length === 4) {
            this.resultList = list
          } else {
            this.$message.warning('牌谱中不是相同四个人的对局')
          }
        } else {
          this.resultList = list
        }
      }
      this.loading = false
    },
    getSummaries(param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '总积分'
        } else {
          sums[index] = Number(
            data
              .reduce((total, current) => {
                total += current[index - 1].finalScore
                return total
              }, 0)
              .toFixed(1)
          )
        }
      })
      return sums
    },
    async onUpload(e) {
      const formData = new FormData()
      formData.append('file', e.file)
      this.loading = true
      const { code, data, headers } = await this.$http.request(
        '/api/paipu/statistic',
        {
          method: 'post',
          contentType: 'multipart/form-data',
          responseType: 'blob',
          data: formData,
        }
      )
      if (code === 0) {
        utils.downloadFile(data, decodeURI(headers.filename))
        this.$message.success('统计数据下载成功')
      }
      this.loading = false
    },
  },
}
</script>
<style lang="scss" scoped>
.page-home {
  background-color: #fff;
  padding: $page-padding;
  .paipu-form {
    &__action {
      margin-bottom: 10px;
    }
    &__submit {
      margin-top: 30px;
    }
    &__line {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      .el-input {
        width: 400px;
        margin-right: 10px;
      }
    }
  }
}
</style>
