import Menu from 'element-ui/lib/menu'
const DEFAULT_PROPS = {
  children: 'children',
  menuName: 'menuName',
  index: 'index',
  iconClass: 'iconClass',
}
export default {
  name: 'ElExtMenu',
  props: {
    ...Menu.props,
    content: {
      type: Array,
      default: () => [],
    },
    auth: {
      type: String,
      default: '',
    },
    props: Object,
  },
  computed: {
    mProps() {
      return Object.assign({}, DEFAULT_PROPS, this.props)
    },
  },
  render(h) {
    return this.renderMenu(h, 'el-menu', this.content, {
      props: this._props,
      class: {
        'el-ext-menu': true,
      },
      ref: 'elExtMenu',
      on: ['select', 'open', 'close'].reduce((total, eventName) => {
        total[eventName] = (...args) => this.$emit(eventName, ...args)
        return total
      }, {}),
    })
  },
  mounted() {
    this.$nextTick(() => {
      Object.keys(Menu.methods).forEach((key) => {
        this[key] = this.$refs.elExtMenu[key]
      })
    })
  },
  methods: {
    renderMenu(
      h,
      tag,
      content,
      options = {},
      parentId = null,
      parentLevel = 0,
      before = null
    ) {
      if (tag !== 'el-menu-item-group') {
        ++parentLevel
      }
      return h(tag, options, [
        before,
        ...content.reduce((total, current, index) => {
          const item = { ...current }
          if (Array.isArray(item.auth) && !item.auth.includes(this.auth)) {
            return total
          }
          const currentId = parentId ? `${parentId}-${index}` : index + ''
          if (
            Array.isArray(item[this.mProps.children]) &&
            item[this.mProps.children].length > 0
          ) {
            if (item.isGroup) {
              total.push(
                this.renderMenuItemGroup(h, item, currentId, parentLevel)
              )
            } else {
              total.push(this.renderSubMenu(h, item, currentId, parentLevel))
            }
          } else {
            total.push(this.renderMenuItem(h, item, currentId, parentLevel))
          }
          return total
        }, []),
      ])
    },
    renderMenuItem(h, item, id, level) {
      const options = {
        props: {
          ...item,
          index: item[this.mProps.index] || id,
        },
        class: {
          [`el-ext-level-${level}`]: true,
        },
        nativeOn: {
          click: () => this.$emit('menuItemSelect', item),
        },
      }
      return h('el-menu-item', options, this.renderTitle(h, item, true))
    },
    renderMenuItemGroup(h, item, id, level) {
      const options = {
        class: {
          [`el-ext-level-${level}`]: true,
        },
      }
      return this.renderMenu(
        h,
        'el-menu-item-group',
        item[this.mProps.children],
        options,
        id,
        level,
        this.renderTitle(h, item)
      )
    },
    renderSubMenu(h, item, id, level) {
      const options = {
        props: {
          ...item,
          index: item[this.mProps.index] || id,
        },
        class: {
          [`el-ext-level-${level}`]: true,
        },
      }
      return this.renderMenu(
        h,
        'el-submenu',
        item[this.mProps.children],
        options,
        id,
        level,
        this.renderTitle(h, item)
      )
    },
    renderTitle(h, item, isMenuItem = false) {
      if (item.render && typeof item.render === 'function') {
        return h('template', { slot: 'title' }, [item.render()])
      }
      const titleArray = [
        item.renderBefore && typeof item.renderBefore === 'function'
          ? item.renderBefore()
          : null,
        item[this.mProps.iconClass]
          ? h(
              'i',
              {
                class: {
                  [item[this.mProps.iconClass]]: true,
                },
              },
              null
            )
          : null,
        h(
          'span',
          isMenuItem ? { slot: 'title' } : null,
          item[this.mProps.menuName]
        ),
        item.renderAfter && typeof item.renderAfter === 'function'
          ? item.renderAfter()
          : null,
      ].filter((t) => t)
      if (isMenuItem) {
        return titleArray
      }
      return titleArray.length > 1
        ? h('template', { slot: 'title' }, [...titleArray])
        : h('template', { slot: 'title' }, item[this.mProps.menuName])
    },
  },
}
