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
    console.log("workinfo",workInfo)
    this.setData({ workInfo });
    wx.cloud.callFunction({
      name: 'getWork',

      data: {
        _id: workInfo._id
      }
      }).then(res => {
        console.log(res.result);
        this.setData({
          workInfo: res.result.data[0]
        });
        if(this.data.workInfo.message!== undefined){
          this.setData({
            message: this.data.workInfo.message
          });
        }
        console.log(this.data.workInfo);
      })
     .catch(err => {
        console.error(err);
      });
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
    console.log("3343",e.currentTarget.dataset.index, value);
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
  // 上传图片
  uploadPicToCloud() {
    wx.showLoading({ title: '上传中' });
  
    const uploadTasks = this.getUploadTasks();
    console.log("old message", this.data.message);
  
    return Promise.all(uploadTasks)
      .then(data => {
        wx.showToast({ title: '上传成功', icon: 'none' });
        const newFileList = data.map(item => ({ url: item.fileID }));
        this.setData({ cloudPath: data, fileList: newFileList });
        console.log("云端位置", this.data.cloudPath);
      })
      .catch(e => {
        wx.showToast({ title: '上传失败', icon: 'none' });
        console.log(e);
        // 如果上传失败,返回一个 rejected 的 Promise 对象
        return Promise.reject(e);
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
            console.log('上传成功',res.result, result,result.fileID);
            const newMessage =this.data.message;
            newMessage[i].value[index].url = result.fileID;
            this.setData({ message: newMessage });
            console.log('上传成功', this.data.message);
            return result.fileID;
          });
          
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
    const { Project, Task, Section, DateMouthDay, Work } = this.data.workInfo;
    const baseName = `${Project}-${Task}-${Section}-${DateMouthDay}-${Work}`;
    baseName.replace(/\s+/g, '');
    return index === -1 ? baseName : `${baseName}-第${index}批次`;
  },
  
  uploadFilePromise(fileName, chooseResult) {
    return new Promise((resolve, reject) => {
      const filePath = chooseResult.url;
      const cloudPath = `uploads/${fileName}`;
      console.log(filePath, cloudPath);
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
    console.log("index",index);
    console.log("filevalue",filevalue);
    console.log("ffffff",file)
    filevalue.push(file);
    console.log(index,filevalue);
    this.updateMessageItem(index, 'value', filevalue);
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
    this.uploadPicToCloud(fileList);
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
    this.uploadPicToCloud()
      .then(() => {
        // 等待上传完成后再执行上传消息到云端的操作
        this.uploadMessageToCloud();
      })
      .catch(err => {
        console.error('上传图片失败:', err);
        wx.showToast({ title: '上传失败', icon: 'none' });
      });
  },
  uploadMessageToCloud() {
    const { message, workInfo } = this.data;
    const { _id } = workInfo;
    console.log(_id);
    console.log("uploadMessageToCloud", message);
    wx.cloud.callFunction({
      name: 'updateWork',
      data: {
        _id,
        message
      }
    })
    .then(res => {
      console.log(res.result);
      if (res.result.success) {
        wx.showToast({ title: '信息更新成功', icon: 'none' });
      } else {
        wx.showToast({ title: '信息更新失败', icon: 'none' });
        console.error(res.result.error);
      }
    })
    .catch(err => {
      console.error(err);
      wx.showToast({ title: '信息更新失败', icon: 'none' });
    });
  },
    

})