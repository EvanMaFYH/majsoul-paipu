<template>
  <div class="request-ip">
    <el-table :data="list">
      <el-table-column label="ip地址" prop="request_ip"></el-table-column>
      <el-table-column label="访问接口" prop="request_url"></el-table-column>
      <el-table-column label="访问方式" prop="request_method"></el-table-column>
      <el-table-column label="userAgent" prop="user_agent"></el-table-column>
      <el-table-column label="访问时间" prop="request_time"></el-table-column>
    </el-table>
    <el-pagination
      v-if="list && list.length > 0"
      class="request-ip__pagination"
      :current-page="params.page"
      :page-size="params.size"
      :total="total"
      @current-change="onCurrentChange"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      params: {
        page: 1,
        size: 10,
      },
      total: null,
    }
  },
  head() {
    return {
      title: 'ip访问统计',
    }
  },
  mounted() {
    this.getList()
  },
  methods: {
    async getList() {
      const { code, data } = await this.$http.request(
        'api/private-search/requestIp',
        { params: this.params }
      )
      if (code === 0) {
        this.list = data.data || []
        this.total = data.count
      }
    },
    onCurrentChange(e) {
      this.params.page = e
      this.getList()
    },
  },
}
</script>

<style lang="scss" scoped>
.request-ip {
  background-color: #fff;
  padding: $page-padding;
  &__pagination {
    margin-top: 15px;
  }
}
</style>
