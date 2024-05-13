Component({
  properties: {
    projects: Array
  },

  methods: {
    selectProject(e) {
      const project = e.currentTarget.dataset.project
      this.triggerEvent('select', project)
    }
  }
})