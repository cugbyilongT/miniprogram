// pages/collectInfo/collectInfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    workInfo: {},
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
    let value = e.detail.value;
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
    let index = e.currentTarget.dataset.index;
    let value = e.detail.value;
    console.log(index, value);
    this.updateMessageItem(index, 'value', value);
  },
  handleCheckboxChange(e) {
    let index = e.currentTarget.dataset.index;
    let value = e.detail.value; // 选中的checkbox的value值
    console.log(index, value);
    this.updateMessageItem(index, 'value', value);
  },
  /*
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
  */
  // 上传图片
  uploadToCloud() {
    wx.cloud.init();
    wx.showLoading({ title: '上传中' });
  
    const uploadTasks = this.getUploadTasks();
  
    Promise.all(uploadTasks)
      .then(data => {
        wx.showToast({ title: '上传成功', icon: 'none' });
        const newFileList = data.map(item => ({ url: item.fileID }));
        this.setData({ cloudPath: data, fileList: newFileList });
        console.log("云端位置", this.data.cloudPath);
      })
      .catch(e => {
        wx.showToast({ title: '上传失败', icon: 'none' });
        console.log(e);
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
  
  getUploadTasks() {
    const uploadTasks = [];
  
    for (let i = 0; i < this.data.message.length; i++) {
      if (this.data.message[i].type === 'upload') {
        const fileNames = this.getFileNames(i);
        const fileBatches = this.data.message[i].value;
        const fileTasks = fileBatches.map((file, index) =>{
          const res = this.uploadFilePromise(`${this.getFileNames(i)}-第${index + 1}张图片.png`, file).then(result => {
            return result.fileID;
          });
          this.data.message[i].value[index].url = res;
          return res;
        }
          
        );
        uploadTasks.push(...fileTasks);
      }
    }
    console.log("uplaodTasks", uploadTasks);
    return uploadTasks;
  },
  
  getFileNames(index = -1) {
    console.log(this.data.workInfo);
    const { project, task, section, work_time, work } = this.data.workInfo;
    const baseName = `${this.data.workInfo.selectedProject.name}-${this.data.workInfo.selectedTask.name}-${this.data.workInfo.selectedSection.road}-${this.data.workInfo.selectedDate}-${this.data.workInfo.selectedWork.workName}`;
    return index === -1 ? baseName : `${baseName}-第${index}批次`;
  },
  
  uploadFilePromise(fileName, chooseResult) {
    return new Promise((resolve, reject) => {
      const filePath = chooseResult.url;
      const cloudPath = `uploads/${fileName}`;
  
      const uploadTask = wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => {
          console.log('上传成功', res.fileID);
          resolve({ fileID: res.fileID });
        },
        fail: err => {
          console.error('上传失败', err);
          reject(err);
        }
      });
  
      uploadTask.onProgressUpdate(progress => {
        console.log(`上传进度：${progress.progress}%`);
      });
    });
  },
  
  afterRead(event) {
    const { file } = event.detail;
    const index = event.target.dataset.index;
    const filevalue = this.data.message[index].value;
    filevalue.push(file);
    this.updateMessageItem(index, 'value', filevalue);
  },
  /*
  afterRead(event) {
    const  {fileList}  =event.detail;
    const index = event.target.dataset.index;
    this.data.message[index].value.push(fileList)
    console.log(this.data.message)
    //this.uploadToCloud(fileList);
  },
  */
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
  getMap(event) {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: 'true',
      success: (res) => {
        const { latitude, longitude } = res;
        console.log(latitude, longitude);
        this.updateMessageItem(4, 'value', { latitude, longitude });
      }
    })

    console.log(latitude, longitude);
  },
  submitwork(event) {
    console.log(this.data.message);
    this.uploadToCloud();
    console.log(this.data.message);

  }

})