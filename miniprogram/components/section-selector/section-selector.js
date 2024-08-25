Component({
  properties: {
    sections: {
      type: Array,
      value: []
    }
  },

  methods: {
    selectSection(e) {
      const section = e.currentTarget.dataset.section
      this.triggerEvent('select', section)
    },
    handleBackToTask() {
      this.triggerEvent('back', { key: 1 })
    }
  },
})