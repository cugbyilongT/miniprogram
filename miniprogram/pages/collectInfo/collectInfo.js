// pages/collectInfo/collectInfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    workInfo:{},

    message: [
      { type: 'input', infoName: '井号编号', label: '请输入井号编号', value: '' },
      { type: 'input', infoName: '井号编号', label: '请输入井号编号', value: '' },
      { type: 'select', infoName: '井类型', label: '请选择井类型', value: '', options: ['生活污水井', '雨水井'] },
      { type: 'checkbox', infoName: '异常情况', label: '请勾选异常情况', value: [], options: ['渗漏', '破损', '堵塞'] },
      { type: 'upload', infoName: '井口照片', label: '请上传井口照片', value: [] },
      { type: 'address', infoName: '井口位置', label: '请选择井的位置', value: '' }
    ]
    ,
    pickerShow: {},
    fileList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //使用JSON.parse将字符串转为对象
    const workInfo = JSON.parse(options.workInfo);
    this.setData({ workInfo });
    console.log(this.data.workInfo);
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
      console.log(this.data.workInfo);
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

  },

  handleInput(e) {
    value = e.detail.value;
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    console.log(e.currentTarget.dataset.index, value);
    this.updateMessageItem(e.currentTarget.dataset.index, 'value', value);
  },
  updateMessageItem(index, key, value) {
    console.log(index, key, value);
    this.data.message[index][key] = value;
    this.setData({
      message: this.data.message
    });
    console.log(this.data.message);
  },
  bindPickerChange(e) {
    index = e.currentTarget.dataset.index;
    value = e.detail.value;
    console.log(index, value);
    this.updateMessageItem(index, 'value', value);
  },
  handleCheckboxChange(e) {
    index = e.currentTarget.dataset.index;
    value = e.detail.value; // 选中的checkbox的value值
    console.log(index, value);
    this.updateMessageItem(index, 'value', value);
  },
  chooseImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const { tempFilePaths } = res;
        const { fileList } = this.data;
        fileList[index] = tempFilePaths;
        this.setData({ fileList });
      }
    });
  },
  // 上传图片
  uploadToCloud() {
    wx.cloud.init();
    const { fileList } = this.data;
    console.log("fileList", fileList)
    // 上传图片
    
    // 1. 选择图片
    // 2. 上传图片到云存储
    // 3. 显示上传结果
    if (!fileList.length) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
    } else {
      wx.showLoading({ title: '上传中' });
      const file_name = `${this.data.workInfo.project_id}-${this.data.workInfo.task}-${this.data.workInfo.section}-${this.data.workInfo.work_time}-${this.data.workInfo.work}`.split('/').join('.');
      const uploadTasks = fileList.map((file, index) => this.uploadFilePromise(`${file_name}-第${index}张图片.png`,       file));
      Promise.all(uploadTasks)
        .then(data => {
          wx.showToast({ title: '上传成功', icon: 'none' });
          const newFileList = data.map(item => ({ url: item.fileID }));
          this.setData({ cloudPath: data, fileList: newFileList });
          console.log(this.data.cloudPath);
          wx.hideLoading();
        })
        .catch(e => {
          wx.showToast({ title: '上传失败', icon: 'none' });
          console.log(e);
        });
    }
  },

  uploadFilePromise(fileName, chooseResult) {
    return wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: chooseResult.url
    });
  },
  afterRead(event) {
    const { fileList } = this.data;
    fileList.push(event.detail.file);
    this.setData({ fileList });
    //this.uploadToCloud(fileList);
  },
  deleteFile(event) {
    const { fileList } = this.data;
    const { index } = event.currentTarget.dataset;
    fileList.splice(index, 1);
    this.setData({ fileList });
  },
  handleUpload(event) {
    const { fileList } = this.data;
    console.log(fileList);
    this.uploadToCloud(fileList);
  },
  getMap(event){
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy:'true',
      success: (res) => {
        const { latitude, longitude } = res;
        console.log(latitude, longitude);
        this.updateMessageItem(4, 'value', { latitude, longitude });
      } 
  })

  console.log(latitude, longitude);
}
})