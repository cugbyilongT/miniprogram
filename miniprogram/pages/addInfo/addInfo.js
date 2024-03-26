Page({
  data:{
    activeKey: 4, // 当前激活的侧边栏项索引
    workInfo:{},
    rows: [
      { pureDateString:"",
      work:"",
      edit:"",
      delete:"",} // 当前日期的纯数字表示形式
    ],
    index: 0,
    hidden: true,
    
  },

  onLoad:function(options){
    // 生命周期函数--监听页面加载
    const workInfo = JSON.parse(options.workInfo);
    this.setData({ workInfo });
    console.log(this.data.workInfo);
    this.setData({ rows: [] });

  },

  onCellClick(e) {
    const workInfo = JSON.stringify({
      project_id: this.data.selectedProject._id,
      task: this.data.selectedTask.name,
      section: this.data.selectedSection.road,
      work_time: this.data.selectedDate,
      work: selectedWork.workName,
     })
     console.log("workInfo:",workInfo)},
    // 在这里执行跳转逻辑,可以使用 wx.navigateTo 等 API

    handleButtonTap: function(event) {
      this.addRow();
      this.upload(event);
    },

    addRow() {
      const now = new Date(); // 获取当前时间
      const formattedDate = this.formatDate(now); // 格式化时间
      const newRow = { 
        pureDateString: formattedDate, // 设置 pureDateString 属性
        // 其他属性
      };
      const rows = [...this.data.rows, newRow];
      this.setData({ rows, hidden: false });
    },
    
    formatDate(date) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 补零
      const day = date.getDate().toString().padStart(2, '0'); // 补零
      return `${month}${day}`;
    },
  upload(e) {
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(this.data.workInfo),
    });
  },
  edit(e) {
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(this.data.workInfo),
    });
  },
  delete(e) {
    const index = e.currentTarget.dataset.index;
    const rows = this.data.rows;
    rows.splice(index, 1);
    this.setData({ rows });
  },




  onReady:function(){
    // 生命周期函数--监听页面初次渲染完成
    
  },
  onShow:function(){
    // 生命周期函数--监听页面显示
  },
  onHide:function(){
    // 生命周期函数--监听页面隐藏
    
  },
  onUnload:function(){
    // 生命周期函数--监听页面卸载
    
  },
  onPullDownRefresh: function() {
    // 页面相关事件处理函数--监听用户下拉动作
    
  },
  onReachBottom: function() {
    // 页面上拉触底事件的处理函数
   
  },
  onShareAppMessage: function() {
    // 用户点击右上角分享
    return {
      title: 'title', // 分享标题
      desc: 'desc', // 分享描述
      path: 'path' // 分享路径
    }
  }

  
})