Page({
    data: {
        fileList: [],
      },
    
      afterRead(event) {
        const { file } = event.detail;
        // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
        wx.uploadFile({
          url: 'cloud://cloudbase-baas-7gioffo8b0741b20.636c-cloudbase-baas-7gioffo8b0741b20-1256603092/uploads', // 仅为示例，非真实的接口地址
          filePath: file.url,
          name: 'file',
          formData: { user: 'test' },
          success(res) {
            // 上传完成需要更新 fileList
            const { fileList = [] } = this.data;
            fileList.push({ ...file, url: res.data });
            this.setData({ fileList });

            console.log('upload success', res);
          },
        });
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
    // 上传图片
uploadToCloud() {
    const { fileList } = this.data;
    if (!fileList.length) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
    } else {
      const uploadTasks = fileList.map((file, index) => this.uploadFilePromise(`my-photo${index}.png`, file));
      Promise.all(uploadTasks)
        .then(data => {
          wx.showToast({ title: '上传成功', icon: 'none' });
          const newFileList = data.map(item => ({ url: item.fileID }));
          this.setData({ cloudPath: data, fileList: newFileList });
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
  
    
// getRequestURLWithArrayParam(baseURL, paramName, paramValues) {
//     let queryString = paramValues.map(value => `${encodeURIComponent(paramName)}=${encodeURIComponent(value)}`).join('&');
//     return baseURL + '?' + queryString;
// },



    selectTap:function(e){

        //         // 定义要传递的数据
        // let selectedOptions = {
        //     Project: ["大龙街2024年排水管网清、查项目"],
        //     Section: [],
        //     Task: [],
        //     Work: ["清疏台账"],
        //     Workername: ["杨怡"],
        // };
        // let dateRange = {
        //     start: "2024-04-08",
        //     end: "2024-05-10",
        // };
        // let analysisname = "全部数据";

        // // 组合所有的数据为一个对象
        // let postData = {
        //     selectedOptions: selectedOptions,
        //     dateRange: dateRange,
        //     analysisname: analysisname
        // };

        // // 使用wx.request发送POST请求
        // wx.request({
        //     url: 'https://cloudbase-baas-7gioffo8b0741b20.service.tcloudbase.com/analysis', // 服务器接口地址
        //     method: 'POST',
        //     data: postData, // 发送的数据
        //     header: {
        //         'content-type': 'application/json' // 设置请求的 header，使用 JSON 数据格式
        //     },
        //     success: function(res) {
        //         console.log('Success:', res.data); // 成功回调
        //     },
        //     fail: function(error) {
        //         console.error('Error:', error); // 失败回调
        //     }
        // });

        // // 使用fetch API发送POST请求
        // fetch('https://cloudbase-baas-7gioffo8b0741b20.service.tcloudbase.com/analysis', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json', // 告诉服务器我们发送的是JSON数据
        //     },
        //     body: JSON.stringify(postData) // 将JavaScript对象转换为JSON字符串
        // })
        // .then(response => response.json()) // 解析JSON响应
        // .then(data => console.log('Success:', data)) // 在控制台打印成功信息
        // .catch(error => console.error('Error:', error)); // 打印错误信息

        // const baseURL = 'https://cloudbase-baas-7gioffo8b0741b20.service.tcloudbase.com/analysis';
        // const paramName = 'analysisname';
        // const paramValues = ['全部数据'];

        // const url = this.getRequestURLWithArrayParam(baseURL, paramName, paramValues);
        // console.log(url);
    //     let selectedOptions = {
    //         Project: ["大龙街2024年排水管网清、查项目"],
    //         Section: [],
    //         Task: [],
    //         Work: ["清疏台账"],
    //         Workername: ["杨怡"],
    //       }
    //       let dateRange  = {
    //         start: "",
    //         end: "",
    //       }
    //       let analysisname = "全部数据",
    //       Monthly_workload_plan= 300,
    //       Monthly_production_value_plan= 20,
    //       Monthly_outvalue_comp=50
          
    //     wx.cloud.callFunction({
    //         name: 'Webhomepagedata',
    //         data: {
    //             selectedOptions: selectedOptions,
    //             dateRange: dateRange,
    //             analysisname: analysisname,
    //             Monthly_workload_plan: Monthly_workload_plan,
    //             Monthly_production_value_plan: Monthly_production_value_plan,
    //             Monthly_outvalue_comp: Monthly_outvalue_comp
    //           },
    // }).then(res => {
    //     console.log('云函数查询结果:',res.result)
    // })
        // let town = "大龙"
    //     wx.cloud.callFunction({
    //         name: 'webgetproject',
    //         // data: {
    //         //     town: town,
    //         //   },
    // }).then(res => {
    //     console.log('云函数查询结果:',res.result)
    // })



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