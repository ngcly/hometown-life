Component({
  properties: {
    data: {
      type: Object,
      value: {}
    },
    showDelete: {
      type: Boolean,
      value: false
    },
    showImages: {
      type: Boolean,
      value: true
    },
    type: {
      type: String,
      value: 'items'
    }
  },
  data: {
    badgeText: ''
  },
  observers: {
    'data': function (data) {
      if (data && data._col) {
        this.setData({ type: data._col })
        this.updateBadge(data._col)
      }
    },
    'type': function (type) {
      this.updateBadge(type)
    }
  },
  methods: {
    updateBadge(type) {
      const badges = {
        lost: '急',
        found: '拾',
        confessions: '💖',
        biaobai: '💖',
        jobs: '聘',
        work: '聘',
        items: '',
        xianzhi: ''
      }
      this.setData({ badgeText: badges[type] || '' })
    },
    onTap() {
      this.triggerEvent('tap', { item: this.properties.data })
    },
    onDelete() {
      this.triggerEvent('delete', { item: this.properties.data })
    }
  }
})