Page({
  data: {
    projects: [], // 项目列表数据
    filteredProjects: [], // 搜索结果列表
  },

  onLoad() {
    // 从数据库获取项目列表
    this.getProjects();
  },

  getProjects() {
    const db = wx.cloud.database();
    db.collection('projects')
      .get()
      .then(res => {
        this.setData({
          projects: res.data,
          filteredProjects: res.data,
        });
      })
      .catch(err => {
        console.error('获取项目列表失败', err);
      });
  },

  searchProjects(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    const filteredProjects = this.data.projects.filter(project =>
      project.name.toLowerCase().includes(searchText)
    );
    this.setData({
      filteredProjects,
    });
  },
  
});