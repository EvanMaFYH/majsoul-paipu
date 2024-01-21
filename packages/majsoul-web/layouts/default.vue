<template>
  <div class="default-layout">
    <el-scrollbar
      class="default-layout-left"
      :class="{ 'is-hide': menuShrink }"
    >
      <el-ext-menu
        :content="menuList"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        :unique-opened="false"
        active-text-color="#409eff"
        :default-active="$route.path"
        :collapse="menuShrink"
        :collapse-transition="false"
        @menuItemSelect="onMenuItemClick"
      ></el-ext-menu>
    </el-scrollbar>
    <div class="default-layout-right">
      <div class="top-content">
        <div class="top-content__toggle" @click="toggleMenu">
          <svg
            :class="{ 'is-active': !menuShrink }"
            class="top-content__toggle__svg"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
          >
            <path
              d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM142.4 642.1L298.7 519a8.84 8.84 0 0 0 0-13.9L142.4 381.9c-5.8-4.6-14.4-.5-14.4 6.9v246.3a8.9 8.9 0 0 0 14.4 7z"
            />
          </svg>
        </div>
        <div class="top-content__title">{{ title }}</div>
      </div>
      <div class="main-content">
        <transition name="fade-transform" mode="out-in">
          <nuxt />
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import ElExtMenu from '@/components/el-ext-menu'
export default {
  components: {
    ElExtMenu,
  },
  data() {
    return {
      menuList: [
        { menuName: '牌谱算分/统计', index: '/', iconClass: 'fa fa-bar-chart' },
        {
          menuName: '牌谱下载',
          index: '/download-paipu',
          iconClass: 'fa fa-file-text-o',
        },
      ],
      menuShrink: false,
      title: '',
    }
  },
  watch: {
    '$route.path'() {
      this.setTitle()
    },
  },
  methods: {
    toggleMenu() {
      this.menuShrink = !this.menuShrink
    },
    onMenuItemClick(item) {
      this.$router.push(item.index)
    },
    setTitle() {
      const timer = setTimeout(() => {
        this.title =
          this.$route.matched?.[0]?.instances?.default?.$metaInfo?.title || ''
        clearTimeout(timer)
      }, 100)
    },
  },
}
</script>

<style lang="scss" scoped>
.default-layout {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  &-left {
    width: 210px;
    height: 100%;
    background-color: #304156;
    transition: width 0.28s;
    &.is-hide {
      width: 54px;
    }
    .el-ext-menu {
      height: 100%;
      overflow: auto;
      border-right: none;
    }
    ::v-deep {
      .el-scrollbar__wrap {
        overflow-x: hidden;
      }
      .el-menu-item {
        i {
          margin-right: 16px;
        }
      }
    }
  }
  &-right {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .top-content {
      height: 50px;
      position: relative;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
      display: flex;
      align-items: center;
      &__toggle {
        padding: 0 15px;
        line-height: 46px;
        height: 100%;
        float: left;
        cursor: pointer;
        transition: background 0.3s;
        -webkit-tap-highlight-color: transparent;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
        &__svg {
          display: inline-block;
          vertical-align: middle;
          width: 20px;
          height: 20px;
          &.is-active {
            transform: rotate(180deg);
          }
        }
      }
      &__title {
        font-size: 14px;
        margin-left: 8px;
        color: #333;
      }
    }
    .main-content {
      flex: 1;
      overflow: auto;
      background-color: #ebf2f9;
      padding: 20px;
    }
  }
}
</style>
