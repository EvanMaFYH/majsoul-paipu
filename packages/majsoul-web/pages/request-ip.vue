<template>
  <div class="request-ip">
    <el-table :data="list">
      <el-table-column label="ip地址" prop="ip"></el-table-column>
      <el-table-column label="访问时间" prop="time"></el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
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
        'api/private-search/requestIp'
      )
      if (code === 0) {
        this.list = data || []
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.request-ip {
  background-color: #fff;
  padding: $page-padding;
}
</style>
