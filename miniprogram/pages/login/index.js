Page({
  data: {
    account: '',
    password: '',
    showPassword: false,
    rememberPassword: true
  },

  bindAccountInput(e) {
    this.setData({
      account: e.detail.value
    })
  },

  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  toggleRememberPassword(e) {
    this.setData({
      rememberPassword: e.detail.value.length > 0
    })
  },

  showForgotPasswordModal() {
    wx.showModal({
      title: '忘记密码',
      content: '请联系管理员重置密码',
      showCancel: false
    })
  },
  login() {
  const { account, password } = this.data
  // 进行基本的表单验证
  if (!account || !password) {
    wx.showToast({
      title: '请输入邮箱和密码',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 调用云函数进行身份验证
  wx.cloud.callFunction({
    name: 'login',
    data: {
      account,
      password
    },
    success: (res) => {
      const { success, message, user } = res.result

      if (success) {
        // 登录成功,可以跳转到首页或执行其他操作
        this.saveCredentials()
        console.log(user)
        const role = user.role // 从数据库中获取用户角色
        getApp().globalData.userAccount = user.account; // 保存账户信息
        getApp().globalData.userRole = user.role; // 保存用户名
          // 根据角色跳转到不同页面
          if (role === 'fieldWorker'||role ==='Insidersworker') {
            // 跳转到外业作业人员页面
            wx.switchTab({
              url: '/pages/fieldWorker/home/fieldWorker_home'
            })
          } else if (role === 'officeWorker'||role === 'manager') {
            // 跳转到项目主管/领导页面
            wx.switchTab({
              url: '/pages/analysis/analysis'
            })
          }
      } else {
        // 登录失败,显示错误提示弹窗
        this.saveCredentials()
        wx.showToast({
          title: message || '登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    },
    fail: (error) => {
      // 处理网络错误等异常情况
      this.saveCredentials()
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    }
  })
},
saveCredentials() {
  const { account, password, rememberPassword } = this.data
  if (rememberPassword) {
    // 将账号和密码存储到本地存储
    wx.setStorageSync('account', account)
    wx.setStorageSync('password', password)
  } else {
    // 清除本地存储中的账号和密码
    wx.removeStorageSync('account')
    wx.removeStorageSync('password')
  }
},
onLoad() {
  const account = wx.getStorageSync('account')
  const password = wx.getStorageSync('password')
  this.setData({
    account,
    password
  })
}
})