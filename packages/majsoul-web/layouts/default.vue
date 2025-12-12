<template>
  <div class="modern-layout">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <span class="brand-icon">🀄</span>
          <span class="brand-text">雀魂工具箱</span>
        </div>
        <div class="navbar-menu">
          <nuxt-link
            v-for="item in menuList"
            :key="item.index"
            :to="item.index"
            class="nav-item"
            :class="{ active: $route.path === item.index }"
          >
            <i :class="item.iconClass"></i>
            {{ item.menuName }}
          </nuxt-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <transition name="fade-transform" mode="out-in">
        <nuxt />
      </transition>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuList: [
        { menuName: '牌谱分析', index: '/', iconClass: 'fa fa-bar-chart' },
        {
          menuName: '牌谱下载',
          index: '/download-paipu',
          iconClass: 'fa fa-download',
        },
      ],
    }
  },
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-layout {
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  height: 100%;
  overflow: auto;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  .brand-icon {
    font-size: 2rem;
    animation: pulse 2s ease-in-out infinite;
  }

  .brand-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.navbar-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  position: relative;
  padding: 12px 24px;
  border-radius: 12px;
  color: #4a5568;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 1rem;
  }

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
}

.main-content {
  flex: 1;
  width: 100%;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 768px) {
  .navbar-container {
    height: 60px;
    padding: 0 16px;
  }

  .navbar-brand {
    font-size: 1.25rem;

    .brand-icon {
      font-size: 1.5rem;
    }
  }

  .navbar-menu {
    gap: 4px;
  }

  .nav-item {
    padding: 10px 16px;
    font-size: 0.9rem;

    i {
      display: none;
    }
  }
}
</style>
