

Page({
  data: {
    newdata: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    analysis_types: {
     // "进度分析": [{ "analysis_name": "班组进度分析", "analysis_show": "图表版", "analysis_detail": "通过图表展示各班组工作进展" },
     // { "analysis_name": "班组历史进度分析", "analysis_show": "图表版", "analysis_detail": "通过图表展示班组历史工作进展" },
     // { "analysis_name": "公司进度分析", "analysis_show": "GIS版", "analysis_detail": "通过GIS图分析项目工作进展" }],
      "产值分析": [
      { "analysis_name": "每日数据导出", "analysis_show": "导出表格", "analysis_detail": "导出每日表格数据" },
      { "analysis_name": "公司产值统计（纵向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表展示各班组产值进展" },
      { "analysis_name": "公司产值统计（负责人横向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表展示班组历史产值" },
      { "analysis_name": "负责人产值统计（单负责人纵向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表分析项目产值" },
      { "analysis_name": "项目产值统计（单项目纵向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表分析项目产值" },
      { "analysis_name": "项目产值统计（项目横向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表分析项目产值" },
      { "analysis_name": "项目+班组产值统计（单班组纵向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表分析项目产值" },
      { "analysis_name": "项目+班组产值统计（班组横向对比）", "analysis_show": "图表版", "analysis_detail": "通过图表分析项目产值" }
    ],
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

