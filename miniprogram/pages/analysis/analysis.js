

Page({
  data: {
    newdata: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    analysis_types: {
      "进度分析": [{ "analysis_name": "班组进度分析", "analysis_show": "图表版", "analysis_detail": "通过图表展示各班组工作进展" },
      { "analysis_name": "班组历史进度分析", "analysis_show": "图表版", "analysis_detail": "通过图表展示班组历史工作进展" },
      { "analysis_name": "公司进度分析", "analysis_show": "GIS版", "analysis_detail": "通过GIS图分析项目工作进展" }],
      "产值分析": [{ "analysis_name": "班组产值分析", "analysis_show": "图表版", "analysis_detail": "通过图表展示各班组产值进展" },
      { "analysis_name": "班组历史产值分析", "analysis_show": "图表版", "analysis_detail": "通过图表展示班组历史产值" },
      { "analysis_name": "公司产值分析", "analysis_show": "图表版", "analysis_detail": "通过图表分析项目产值" }],
      "缺陷分析": [{ "analysis_name": "缺陷情况", "analysis_show": "图表版", "analysis_detail": "通过图表展示各缺陷情况" },]
    },
    activeNames: ['1'],
    categoryKeys: [],
    userAccount: "",
    userRole:""
  },

  onLoad() {
    this.setData({
      userAccount:getApp().globalData.userAccount ,
      userRole:getApp().globalData.userRole
    }, () => {
    console.log(this.data.userAccount, this.data.userRole);
    // 在 onLoad 生命周期函数中,将 this 赋值给 pageInstance
    this.setData({
      categoryKeys: Object.keys(this.data.analysis_types)
    });
    })
   
    
  },
  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
  },
  navigateToChart(e) {
    const analysisName = e.currentTarget.dataset.analysis;
    wx.navigateTo({
      url: `/pages/analysis/analysis_chart?analysisName=${analysisName}`
    })
  }
});

