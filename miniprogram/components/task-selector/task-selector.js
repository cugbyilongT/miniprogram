Component({
  properties: {
    tasks: {
      type: Array,
      value: []
    }
  },

  methods: {
    selectTask(e) {
      const task = e.currentTarget.dataset.task
      this.triggerEvent('select', task)
    },
    handleBackToProject() {
    this.triggerEvent('back', { key: 0 })
  }
},
  
})