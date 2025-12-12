<template>
  <div class="download-paipu">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-icon">📥</span>
          牌谱下载
        </h1>
        <p class="hero-subtitle">一键下载雀魂对局牌谱，支持多种场次类型</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-container">
      <div class="glass-card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="title-icon">⚙️</span>
            下载配置
          </h2>
        </div>

        <div class="form-container">
          <!-- 账号密码 -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">👤</span>
                雀魂账号
              </label>
              <input
                v-model="form.username"
                class="form-input"
                placeholder="请输入您的雀魂账号"
                type="text"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🔐</span>
                雀魂密码
              </label>
              <div class="password-wrapper">
                <input
                  v-model="form.password"
                  class="form-input"
                  placeholder="请输入您的密码"
                  type="password"
                />
                <div class="security-tip">
                  <i class="el-icon-warning"></i>
                  <span>如担心密码泄漏请勿使用该功能</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 牌谱类型 -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🎮</span>
              牌谱类型
            </label>
            <div class="radio-group">
              <label
                v-for="item in typeList"
                :key="item.value"
                class="radio-item"
                :class="{ active: form.type === item.value }"
              >
                <input
                  v-model="form.type"
                  type="radio"
                  :value="item.value"
                  style="display: none"
                />
                <span class="radio-icon">
                  <i
                    class="fa"
                    :class="
                      form.type === item.value ? 'fa-check-circle' : 'fa-circle-o'
                    "
                  ></i>
                </span>
                <span class="radio-text">{{ item.label }}</span>
              </label>
            </div>
          </div>

          <!-- 日期范围 -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📅</span>
                开始日期
              </label>
              <el-date-picker
                v-model="form.startDate"
                value-format="yyyy-MM-dd"
                placeholder="选择开始日期"
                class="date-picker"
              ></el-date-picker>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📅</span>
                结束日期
              </label>
              <el-date-picker
                v-model="form.endDate"
                value-format="yyyy-MM-dd"
                placeholder="选择结束日期"
                class="date-picker"
              ></el-date-picker>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <button
              class="submit-button"
              :class="{ loading: loading }"
              :disabled="loading"
              @click="exportTxt"
            >
              <span v-if="!loading" class="button-content">
                <span class="button-icon">⬇️</span>
                导出牌谱 TXT
              </span>
              <span v-else class="loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
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
      title: '雀魂牌谱下载 - 专业麻将数据统计工具',
    }
  },
  methods: {
    exportTxt() {
      // 手动验证
      if (!this.form.username) {
        this.$message.warning('请输入雀魂账号')
        return
      }
      if (!this.form.password) {
        this.$message.warning('请输入雀魂密码')
        return
      }
      if (!this.form.startDate) {
        this.$message.warning('请选择开始日期')
        return
      }

      this.downloadPaipu()
    },
    async downloadPaipu() {
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
        this.$message.success('牌谱下载成功')
      }
      this.loading = false
    },
  },
}
</script>

<style lang="scss" scoped>
.download-paipu {
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
  padding: 40px 20px 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 10px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.8s ease-out;

  .title-icon {
    display: inline-block;
    margin-right: 12px;
    font-size: 2.5rem;
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
  font-size: 1.1rem;
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px 30px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  animation: fadeInUp 0.8s ease-out 0.4s both;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  }
}

.card-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  .title-icon {
    font-size: 1.5rem;
  }
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 6px;

  .label-icon {
    font-size: 1rem;
  }
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 10px;
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

.password-wrapper {
  position: relative;
}

.security-tip {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #f56c6c;

  i {
    font-size: 0.9rem;
  }
}

.radio-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.radio-item {
  flex: 1;
  min-width: 100px;
  padding: 10px 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;

  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }

  &.active {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

    .radio-icon {
      color: white;
    }
  }

  .radio-icon {
    font-size: 1.1rem;
    color: #667eea;
    transition: all 0.3s ease;
  }

  .radio-text {
    font-size: 0.95rem;
    font-weight: 600;
  }
}

.date-picker {
  width: 100%;

  ::v-deep .el-input__inner {
    padding: 12px 16px 12px 40px;
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 10px;
    font-size: 0.95rem;
    height: 46px;
    line-height: 46px;
    transition: all 0.3s ease;
    background: white;

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
      color: #a0aec0;
    }
  }

  ::v-deep .el-input__prefix {
    left: 12px;
    display: flex;
    align-items: center;
  }

  ::v-deep .el-input__icon {
    line-height: 46px;
    color: #667eea;
    font-size: 1.1rem;
  }

  ::v-deep .el-input.is-disabled .el-input__inner {
    background-color: #f7fafc;
    border-color: rgba(102, 126, 234, 0.1);
    color: #a0aec0;
  }
}

.form-actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.submit-button {
  padding: 14px 40px;
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
  min-width: 180px;

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

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;

    .title-icon {
      font-size: 2rem;
    }
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .glass-card {
    padding: 20px;
    border-radius: 16px;
  }

  .card-title {
    font-size: 1.3rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .radio-group {
    flex-direction: column;
  }

  .radio-item {
    min-width: auto;
  }

  .submit-button {
    width: 100%;
  }
}

@media (min-height: 900px) {
  .hero-section {
    padding: 40px 20px 30px;
  }

  .hero-title {
    font-size: 3rem;
    margin-bottom: 15px;

    .title-icon {
      font-size: 3rem;
    }
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .glass-card {
    padding: 35px;
  }

  .form-container {
    gap: 25px;
  }
}
</style>
