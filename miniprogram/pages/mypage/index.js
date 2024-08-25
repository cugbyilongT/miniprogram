// pages/mypage/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tasks: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function() {
    console.log("~~~~~~~onShow show ")
    console.log("~~~~~~~callFunction show ")
    const callResult =  wx.cloud.callFunction({
      name: 'getTasks'
    })
  
    console.log('callResult:', callResult)
  
    if (callResult.result && callResult.result.data) {
      this.setData({
        tasks: callResult.result.data
      })
    } else {
      // 设置 tasks 为空数组,避免出现 undefined 错误
      this.setData({
        tasks: []
      })
    }

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})