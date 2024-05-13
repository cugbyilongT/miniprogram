Page({
    data:{
        
    },
    onLoad:function(options){
        // 生命周期函数--监听页面加载
        
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
    selectTap:function(e){
        let selectedOptions = {
            Project: ["大龙街2024年排水管网清、查项目"],
            Section: [],
            Task: [],
            Work: ["清疏台账"],
            Workername: ["杨怡"],
          }
          let dateRange  = {
            start: "2024-04-08",
            end: "2024-05-10",
          }
            
          let analysisname = "全部数据"
        wx.cloud.callFunction({
            name: 'analysis',
            data: {
                selectedOptions: selectedOptions,
                dateRange: dateRange,
                analysisname: analysisname
              },
    }).then(res => {
        console.log('云函数查询结果:',res.result)
    })


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