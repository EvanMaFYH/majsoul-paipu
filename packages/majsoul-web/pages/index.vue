<template>
  <div class="page-home">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-icon">🀄</span>
          雀魂牌谱分析
        </h1>
        <p class="hero-subtitle">专业的麻将对局数据统计与分析工具</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-container">
      <!-- 功能区域 -->
      <div class="function-area">
        <!-- 功能一：对局分析 -->
        <div class="glass-card function-card">
          <div class="card-header">
            <div class="header-content">
              <h2 class="card-title">
                <span class="title-icon">🎯</span>
                对局分析
              </h2>
              <p class="card-desc">统计相同四人的多局对局结果</p>
            </div>
          </div>

          <div class="function-content">
            <div class="input-list">
              <div
                v-for="(item, index) in paipuList"
                :key="index"
                class="input-item"
              >
                <div class="input-wrapper">
                  <input
                    v-model="item.value"
                    class="paipu-input"
                    placeholder="请输入雀魂牌谱链接..."
                    type="text"
                  />
                </div>
                <button
                  v-if="paipuList.length > 1"
                  class="delete-button"
                  @click="deleteLine(index)"
                >
                  <span class="delete-icon">×</span>
                </button>
              </div>
            </div>

            <div class="function-actions">
              <button class="add-line-button" @click="newLine">
                <span class="button-icon">+</span>
                添加牌谱
              </button>
              <button
                class="primary-button"
                :class="{ loading: loading }"
                :disabled="loading"
                @click="submit"
              >
                <span v-if="!loading" class="button-content">
                  <span class="button-icon">📊</span>
                  开始分析
                </span>
                <span v-else class="loading-spinner"></span>
              </button>
            </div>

            <div class="usage-tip">
              <i class="el-icon-info"></i>
              <span>添加多个牌谱链接，系统将统计相同四人的对局数据并汇总</span>
            </div>
          </div>
        </div>

        <!-- 功能二：批量统计 -->
        <div class="glass-card function-card">
          <div class="card-header">
            <div class="header-content">
              <h2 class="card-title">
                <span class="title-icon">📊</span>
                批量统计
              </h2>
              <p class="card-desc">上传TXT文件，导出Excel统计报表</p>
            </div>
          </div>

          <div class="function-content">
            <div class="upload-area">
              <label
                class="upload-button-large"
                :class="{ uploading: uploadLoading }"
              >
                <input
                  type="file"
                  accept=".txt"
                  style="display: none"
                  :disabled="uploadLoading"
                  @change="handleFileUpload"
                />
                <template v-if="!uploadLoading">
                  <div class="upload-icon">📁</div>
                  <div class="upload-text">
                    <div class="upload-title">点击上传 TXT 文件</div>
                    <div class="upload-hint">
                      支持批量牌谱统计，自动生成Excel报表
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="upload-loading">
                    <div class="loading-spinner-large"></div>
                    <div class="loading-text">
                      <div class="loading-title">正在处理中...</div>
                      <div class="loading-hint">
                        正在统计牌谱数据，请稍候
                      </div>
                    </div>
                  </div>
                </template>
              </label>
            </div>

            <div class="usage-tip">
              <i class="el-icon-info"></i>
              <span>TXT文件格式：每行一个牌谱链接，无需是相同四人对局</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <transition name="fade-slide">
        <div
          v-if="resultList.length > 0"
          ref="resultsCard"
          class="glass-card results-card"
        >
          <div class="card-header">
            <h2 class="card-title">
              <span class="title-icon">📈</span>
              对局结果
            </h2>
          </div>

          <div class="table-wrapper">
            <table class="results-table">
              <thead>
                <tr>
                  <th class="index-column">局数</th>
                  <th
                    v-for="(player, index) in resultList[0]"
                    :key="index"
                    class="player-column"
                  >
                    {{ player.nickName }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIndex) in resultList"
                  :key="rowIndex"
                  class="table-row"
                >
                  <td class="index-cell">{{ rowIndex + 1 }}</td>
                  <td
                    v-for="(player, colIndex) in row"
                    :key="colIndex"
                    class="score-cell"
                    :class="getScoreClass(player.finalScore)"
                  >
                    {{ formatScore(player.finalScore) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="summary-row">
                  <td class="summary-label">总积分</td>
                  <td
                    v-for="(score, index) in totalScores"
                    :key="index"
                    class="summary-score"
                    :class="getScoreClass(score)"
                  >
                    {{ formatScore(score) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import utils from '@/plugins/utils'
export default {
  data() {
    return {
      loading: false,
      uploadLoading: false,
      paipuList: [{ value: '' }],
      resultList: [],
    }
  },
  head() {
    return {
      title: '雀魂牌谱分析 - 专业麻将数据统计工具',
    }
  },
  computed: {
    totalScores() {
      if (this.resultList.length === 0) return []
      const playerCount = this.resultList[0].length
      const totals = []
      for (let i = 0; i < playerCount; i++) {
        const total = this.resultList.reduce(
          (sum, row) => sum + row[i].finalScore,
          0
        )
        totals.push(Number(total.toFixed(1)))
      }
      return totals
    },
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
            // 滚动到结果区域
            this.$nextTick(() => {
              this.scrollToResults()
            })
          } else {
            this.$message.warning('牌谱中不是相同四个人的对局')
          }
        } else {
          this.resultList = list
          // 滚动到结果区域
          this.$nextTick(() => {
            this.scrollToResults()
          })
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
    handleFileUpload(e) {
      const file = e.target.files[0]
      if (!file) return
      this.onUpload({ file })
      e.target.value = ''
    },
    async onUpload(e) {
      const formData = new FormData()
      formData.append('file', e.file)
      this.uploadLoading = true
      try {
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
      } catch (error) {
        console.error('上传失败:', error)
        this.$message.error('统计失败，请重试')
      } finally {
        this.uploadLoading = false
      }
    },
    formatScore(score) {
      return score > 0 ? `+${score}` : score.toString()
    },
    getScoreClass(score) {
      if (score > 0) return 'positive' // 红色
      if (score < 0) return 'negative' // 绿色
      return 'neutral'
    },
    scrollToResults() {
      if (this.$refs.resultsCard) {
        this.$refs.resultsCard.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.page-home {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding-bottom: 40px;
  overflow: auto;
  height: 100%;
}

.hero-section {
  position: relative;
  z-index: 1;
  padding: 40px 20px 40px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 20px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.8s ease-out;

  .title-icon {
    display: inline-block;
    margin-right: 15px;
    font-size: 3.5rem;
    animation: bounce 2s ease-in-out infinite;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-container {
  position: relative;
  z-index: 1;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px 20px;
}

.function-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.function-card {
  animation: fadeInUp 0.8s ease-out 0.4s both;

  &:nth-child(2) {
    animation-delay: 0.5s;
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  }
}

.card-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  .title-icon {
    font-size: 1.75rem;
  }
}

.card-desc {
  font-size: 0.95rem;
  color: #718096;
  margin: 0;
  padding-left: 42px;
}

.function-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-item {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.input-wrapper {
  flex: 1;
}

.paipu-input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #2d3748;
  background: white;
  transition: all 0.3s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
}

.delete-button {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: rgba(245, 101, 101, 0.1);
  color: #f56565;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: #f56565;
    color: white;
    transform: rotate(90deg);
  }
}

.function-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.add-line-button {
  flex: 1;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid rgba(102, 126, 234, 0.3);
  background: white;
  color: #667eea;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .button-icon {
    font-size: 1.3rem;
    line-height: 1;
  }

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: #667eea;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.primary-button {
  flex: 2;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 35px rgba(102, 126, 234, 0.45);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &.loading {
    pointer-events: none;
  }
}

.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.upload-button-large {
  width: 100%;
  padding: 40px;
  border: 3px dashed rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  background: rgba(102, 126, 234, 0.02);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  &:hover:not(.uploading) {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.08);
    transform: translateY(-3px);
  }

  &:active:not(.uploading) {
    transform: translateY(-1px);
  }

  &.uploading {
    cursor: not-allowed;
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner-large {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  text-align: center;
}

.loading-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}

.loading-hint {
  font-size: 0.9rem;
  color: #718096;
}

.upload-icon {
  font-size: 4rem;
  animation: bounce 2s ease-in-out infinite;
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.9rem;
  color: #718096;
}

.usage-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.05);
  border-left: 3px solid #667eea;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #4a5568;
  line-height: 1.6;

  i {
    color: #667eea;
    font-size: 1rem;
    margin-top: 2px;
    flex-shrink: 0;
  }

  span {
    flex: 1;
  }
}

.button-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results-card {
  animation: fadeInUp 0.8s ease-out;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.results-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 16px;
  overflow: hidden;

  thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    th {
      padding: 18px 20px;
      text-align: center;
      font-weight: 600;
      font-size: 1rem;
      color: white;
      border: none;

      &:first-child {
        border-top-left-radius: 16px;
      }

      &:last-child {
        border-top-right-radius: 16px;
      }
    }
  }

  tbody {
    tr {
      transition: all 0.3s ease;

      &:hover {
        background: rgba(102, 126, 234, 0.05);
        transform: scale(1.01);
      }

      &:not(:last-child) td {
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
    }

    td {
      padding: 16px 20px;
      text-align: center;
      font-size: 1rem;
      color: #2d3748;
    }
  }

  tfoot {
    background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
    font-weight: 700;

    td {
      padding: 20px;
      text-align: center;
      font-size: 1.1rem;

      &:first-child {
        border-bottom-left-radius: 16px;
      }

      &:last-child {
        border-bottom-right-radius: 16px;
      }
    }
  }
}

.score-cell,
.summary-score {
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &.positive {
    color: #e53e3e; // 红色 - 正分（得分）
  }

  &.negative {
    color: #38a169; // 绿色 - 负分（失分）
  }

  &.neutral {
    color: #718096;
  }
}

.summary-label {
  color: #2d3748;
  font-weight: 700;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

@media (max-width: 1200px) {
  .function-area {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;

    .title-icon {
      font-size: 2.5rem;
    }
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .glass-card {
    padding: 24px;
    border-radius: 16px;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .card-desc {
    font-size: 0.85rem;
    padding-left: 38px;
  }

  .function-actions {
    flex-direction: column;

    .add-line-button,
    .primary-button {
      width: 100%;
      flex: 1;
    }
  }

  .upload-button-large {
    padding: 30px 20px;
  }

  .upload-icon {
    font-size: 3rem;
  }

  .results-table {
    font-size: 0.9rem;

    thead th,
    tbody td,
    tfoot td {
      padding: 12px 10px;
    }
  }
}
</style>
