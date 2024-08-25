Page({
  data: {
    userAccount: "",
    userRole:"",
    workdata: [],
    selectexportoption: [],
    projects: [],
    activeKey: 0,
    selectProject: {},
    records: [],

    queryResults: [],
    showDropdown: false,

    preventCloseDropdown: false,
    dateRange: {
      start: '',
      end: '',
      fileName: "",
    },
    dropdowns: [
      { label: '项目名称', placeholder: '请输入项目名称', options: [], inputValue: '', showDropdown: false, selectedOptions: [], filteredOptions: [] },
      { label: '道路名称', placeholder: '请输入道路名称', options: [], inputValue: '', showDropdown: false, selectedOptions: [], filteredOptions: [] },
      { label: '作业内容', placeholder: '请输入作业内容', options: [], inputValue: '', showDropdown: false, selectedOptions: [], filteredOptions: [] },
      { label: '班组', placeholder: '请输入班组', options: [], inputValue: '', showDropdown: false, selectedOptions: [], filteredOptions: [] },
      { label: '任务单', placeholder: '请输入任务单', options: [], inputValue: '', showDropdown: false, selectedOptions: [], filteredOptions: [] }
    ],
    exportoption: [
      { infoName: "管段方向", label: "请选择管段方向", type: "select", options: ["实际管段施工方向", "全部管段为顺流"], value: "" },
      { infoName: "导出模板", label: "请选择导出模板", type: "select", options: ["大龙模板","大龙外业记录表"], value: "" },
    ],
    selecteddata: []

  },
  onLoad: function (options) {
    // 生命周期函数--监听页面加载
    this.setData({
      userAccount:getApp().globalData.userAccount ,
      userRole:getApp().globalData.userRole
    }, () => {
    console.log(this.data.userAccount, this.data.userRole);
    // 在 onLoad 生命周期函数中,将 this 赋值给 pageInstance
    this.getProjects();
    })
    
  },



  onReady: function () {
    // 生命周期函数--监听页面初次渲染完成

  },

  getProjects() {
    wx.cloud.callFunction({
      name: 'getProjects',
    })
      .then(res => {
        console.log('获取项目列表成功', res.result.data)
        const projectNames = res.result.data.map(project => project.name);
        const taskNames = [];
        const sectionRoads = [];
        const worksNames = [];
        const dates = [];
        const users = [];

        for (let i = 0; i < res.result.data.length; i++) {
          if (res.result.data[i].members && Array.isArray(res.result.data[i].members) && res.result.data[i].members.length > 0) {
            for (let j = 0; j < res.result.data[i].members.length; j++) {
              users.push(res.result.data[i].members[j]);
            }
          }
          if (res.result.data[i].tasks && Array.isArray(res.result.data[i].tasks) && res.result.data[i].tasks.length > 0) {
            for (let j = 0; j < res.result.data[i].tasks.length; j++) {
              const task = res.result.data[i].tasks[j];
              taskNames.push(task.name);
              if (task.sections && Array.isArray(task.sections) && task.sections.length > 0) {
                for (let k = 0; k < task.sections.length; k++) {
                  const section = task.sections[k];
                  sectionRoads.push(section.road);
                  if (section.works && Array.isArray(section.works) && section.works.length > 0) {
                    for (let l = 0; l < section.works.length; l++) {
                      if (section.works[l].worksDetail && Array.isArray(section.works[l].worksDetail) && section.works[l].worksDetail.length > 0) {
                        for (let m = 0; m < section.works[l].worksDetail.length; m++) {
                          worksNames.push(section.works[l].worksDetail[m].workName);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        const uniqueUsers = [...new Set(users)];
        const uniqueTaskNames = [...new Set(taskNames)];
        const uniqueSectionRoads = [...new Set(sectionRoads)];
        const uniqueWorksNames = [...new Set(worksNames)];
        const uniqueProjectNames = [...new Set(projectNames)];
        const usersOptions = uniqueUsers.map(user => ({ name: user, checked: false }));
        const taskNamesOptions = uniqueTaskNames.map(taskName => ({ name: taskName, checked: false }));
        const sectionRoadsOptions = uniqueSectionRoads.map(sectionRoad => ({ name: sectionRoad, checked: false }));
        const worksNamesOptions = uniqueWorksNames.map(worksName => ({ name: worksName, checked: false }));
        const projectNamesOptions = uniqueProjectNames.map(projectName => ({ name: projectName, checked: false }));


        this.setData({
          "dropdowns[0].options": projectNamesOptions,
          "dropdowns[1].options": sectionRoadsOptions,
          "dropdowns[2].options": worksNamesOptions,
          "dropdowns[3].options": usersOptions,
          "dropdowns[4].options": taskNamesOptions,

          "dropdowns[0].filteredOptions": projectNamesOptions,
          "dropdowns[1].filteredOptions": sectionRoadsOptions,
          "dropdowns[2].filteredOptions": worksNamesOptions,
          "dropdowns[3].filteredOptions": usersOptions,
          "dropdowns[4].filteredOptions": taskNamesOptions,

        })
        console.log("dropdowns", this.data.dropdowns)
      })
      .catch(err => {
        console.error('获取项目列表失败', err)
      })

  },
  onStartDateChange: function (e) {
    this.setData({
      'dateRange.start': e.detail.value
    });
  },
  onEndDateChange: function (e) {
    this.setData({
      'dateRange.end': e.detail.value
    });
  },


  onInput: function (e) {
    const index = e.currentTarget.dataset.index;
    const inputValue = e.detail.value;
    console.log("inputValue", inputValue);
    const dropdown = this.data.dropdowns[index];  
    // 更新 filter 方法以适应新的数据结构
    const filteredOptions = dropdown.options.filter(option => 
        option.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    if (inputValue.trim() === '') {
      this.setData({
        [`dropdowns[${index}].filteredOptions`]: dropdown.options,
        [`dropdowns[${index}].inputValue`]: inputValue,
      });
    } else {
      this.setData({
        [`dropdowns[${index}].filteredOptions`]: filteredOptions,
        [`dropdowns[${index}].inputValue`]: inputValue,
      });
    }
  },
// 当输入框聚焦时调用
onFocus: function (e) {
  const index = e.currentTarget.dataset.index;
  // 展开当前聚焦的下拉菜单
  const dropdownKey = `dropdowns[${index}].showDropdown`;
  this.setData({
    [dropdownKey]: true,
    // [inputKey]: ''  // 如果不希望每次聚焦时清空输入，可以注释或移除这行
  });
},
toggleDropdown: function (e) {
  const index = e.currentTarget.dataset.index;
  const dropdownKey = `dropdowns[${index}].showDropdown`;
  const currentShow = this.data.dropdowns[index].showDropdown;
  this.setData({
      [dropdownKey]: !currentShow
  });
},
  /*onFocus: function (e) {
    const index = e.currentTarget.dataset.index;
    console.log("111", index);
    this.setData({
      [`dropdowns[${index}].showDropdown`]: true
    });
    console.log("dropdown111s", this.data.dropdowns)
  },*/


  onBlur: function (e) {
    // If you want to close the dropdown when the input loses focus
    //const index = e.currentTarget.dataset.index;
    //this.setData({
    //   [`dropdowns[${index}].showDropdown`]: false
    //});
  },
  onCheckboxChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const selectedValues = e.detail.value; // 这个数组包含了所有选中的项的 value

    // 获取当前下拉菜单的数据
    const dropdown = this.data.dropdowns[index];
    const filteredOptions = dropdown.filteredOptions;

    // 更新每个选项的 checked 状态
    const updatedFilteredOptions = filteredOptions.map(option => ({
        ...option,
        checked: selectedValues.includes(option.name)
    }));
    console.log("updatedFilteredOptions", updatedFilteredOptions)
    // 将选中的选项名称用逗号分隔合并为一个字符串，用于显示在输入框中
    const inputValue = selectedValues.join(', ');

    // 构建 setData 的 key
    const dropdownKey = `dropdowns[${index}]`;
    this.setData({
        [`${dropdownKey}.filteredOptions`]: updatedFilteredOptions,
        [`${dropdownKey}.inputValue`]: inputValue,
        [`${dropdownKey}.selectedOptions`]: selectedValues
    });

    console.log("Selected Options", this.data.dropdowns[index].selectedOptions);
    console.log("Dropdown Data", this.data.dropdowns);
},

  onSelectionComplete: function () {
    // 所有下拉菜单的选中选项
    const allSelectedOptions = this.data.dropdowns.map(dropdown => ({
      label: dropdown.label,
      selectedOptions: dropdown.selectedOptions,
    }));
    // 检查是否至少有一个下拉菜单有选中的项
    const isAnyDropdownSelected = allSelectedOptions.some(dropdown => dropdown.selectedOptions && dropdown.selectedOptions.length > 0);
    // 检查日期范围是否有选择
    const isDateRangeSelected = this.data.dateRange.start !== '' && this.data.dateRange.end !== '';
      // 先检测时间范围是否符合逻辑（起始时间必须小于终止时间）
    if (isDateRangeSelected) {
      const startDate = new Date(this.data.dateRange.start);
      const endDate = new Date(this.data.dateRange.end);
      if (startDate > endDate) {
        wx.showToast({
          title: '起始时间必须小于终止时间，请输入正确的时间范围',
          icon: 'none', 
          duration: 2000
        });
        return; // 提前退出函数
      }
    }
    // 检查至少有一个下拉菜单或日期范围被选中
    if (!isAnyDropdownSelected && !isDateRangeSelected) {
      wx.showToast({
        title: '请至少选择其中一项',
        icon: 'none',
        duration: 2000
      });
      return; // 提前退出函数
    }
    console.log("allSelectedOptions", allSelectedOptions);
    // 打印或处理用户所有的选择
    console.log("all111", allSelectedOptions);

    console.log("time", isDateRangeSelected);
    console.log("date", this.data.dateRange);
    console.log("allSelectedOptions", allSelectedOptions);

    let newData = {
      Project: allSelectedOptions[0].selectedOptions,
      Section: allSelectedOptions[1].selectedOptions,
      Task: allSelectedOptions[4].selectedOptions,
      Work: allSelectedOptions[2].selectedOptions,
      Workername: allSelectedOptions[3].selectedOptions,

    };
    console.log("Project", newData);
    this.setData({
      selecteddata: newData
    });
    console.log("se11", this.data.selecteddata);
    wx.showLoading({
      title: '搜索中，请稍等',
    });
    // 调用云函数
    wx.cloud.callFunction({
      name: 'getworksdata',
      data: {
        selectedOptions: this.data.selecteddata,
        dateRange: this.data.dateRange
      },
      success: res => {
        console.log('云函数查询结果:', res.result);
        wx.hideLoading(); // 关闭加载提示
        // ...处理成功的结果...
        // 判断查询结果是否为空
        if (res.result && res.result.length > 0) {
          // 更新页面数据
          this.setData({
            queryResults: res.result,
            activeKey: 1
          });
          console.log("结果：", this.data.queryResults)
        } else {
          // 查询结果为空时的处理
          wx.showToast({
            title: '未找到数据，请重新输入查找内容',
            icon: 'none', // “none”表示不显示图标
            duration: 2000 // 提示框显示时间
          });
        }
      },
      fail: err => {
        console.error('云函数调用失败:', err);
      }
    });

  },

  // 当点击遮罩层时调用
  onMaskTap: function () {
    // 关闭所有下拉菜单
    this.data.dropdowns.forEach((dropdown, index) => {
      const dropdownKey = `dropdowns[${index}].showDropdown`;
      this.setData({
        [dropdownKey]: false
      });
    });
  },

  /*onMaskTap: function () {
    const updatedDropdowns = this.data.dropdowns.map(dropdown => {
      dropdown.showDropdown = false;
      return dropdown;
    });
 
    this.setData({
      dropdowns: updatedDropdowns
    });
  },*/
  exportchoosed: function (e) {
    this.setData({
      activeKey: 2
    });
  },

  handleBackToSelector(e) {
    const key = 0
    const dropdowns = this.data.dropdowns;
    // 清空所有的 selectedOptions、filteredOptions 和 inputValue
    dropdowns.forEach(dropdown => {
      dropdown.selectedOptions = [];
      // dropdown.filteredOptions = [];
      dropdown.inputValue = '';
          // 确保filteredOptions存在并且是一个数组
      if (dropdown.filteredOptions && Array.isArray(dropdown.filteredOptions)) {
      // 遍历filteredOptions并设置每个选项的checked属性为false
        dropdown.filteredOptions.forEach(option => {
        option.checked = false;
      });
    }
    });
    this.setData({
      dateRange: {
        start: '',
        end: ''
      },
      dropdowns: this.data.dropdowns,
      selecteddata: [],
      activeKey: key,
    })
    console.log("selecteddata111", this.data.selecteddata)
  },
  handleBackTochoice(e) {
    const key = 1
    // 清空 exportOption 中每个对象的 value 属性
    const resetExportOption = this.data.exportoption.map(item => ({
      ...item,
      value: ''
    }));
    this.setData({
      activeKey: key,
      exportoption: resetExportOption,

    })
  },

  goToCollectInfo: function (e) {
    // 获取点击的项的数据
    const item = e.currentTarget.dataset.item;
    const works = item.Work;
    const workInfo = {};
    // 将对象转换为 JSON 字符串
    workInfo._id = item._id;
      wx.navigateTo({
        url: '/pages/ledger/ledger?workInfo=' + JSON.stringify(workInfo),
      });
   
  },

  getExceltemp: function () {
    wx.cloud.callFunction({
      name: 'getExcel',
      data: {
        // 传递需要导出的Excel数据
        data: this.data.queryResults
      },
      success: res => {
        console.log(res);
      },
      fail: err => {
        console.error(err);
      }
    });
  },

  getExceldownlaod: function () {
    wx.cloud.downloadFile({
      fileID: 'your-file-id', // 替换成文件的云存储ID
      success: res => {
        // get temp file path
        console.log(res.tempFilePath);
        // 读取文件内容，这取决于你的文件类型，这里只是一个示例
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: 'utf8', // 如果是文本文件需要指定编码方式
          success: res => {
            console.log('文件内容：', res.data);
          },
          fail: console.error,
        });
      },
      fail: console.error
    });
  },

  // 导出Excel的函数
  exportExcel: function () {
    let that = this;
    // 弹出模态对话框提示用户输入文件名
    wx.showModal({
      title: '输入文件名',
      editable: true, // 允许用户输入
      placeholderText: '请输入文件名', // 输入框占位符
      success: function (modalRes) {
        // 用户点击确定后，modalRes.confirm 为 true
        if (modalRes.confirm && modalRes.content) {
          that.setData({
            fileName: modalRes.content // 设置文件名
          });
          // 显示正在导出的提示
          wx.showLoading({
            title: '正在导出...',
            icon: 'loading',
            duration: 100000 // 显示时长
          });

          // 获取用户选择的导出模板
          let exportTemplate = that.data.exportoption.find(item => item.infoName === "导出模板").value;
          let functionName = 'ExportExcel'; // 默认云函数名称
          if (exportTemplate === "大龙模板") {
            functionName = 'DLexcelexport'; // 特定于大龙模板的云函数
          }else if(exportTemplate === "大龙外业记录表"){
            functionName = 'DLFieldRecordForm'; // 特定于大龙外业记录表的云函数
          }

          // 调用云函数导出Excel
          wx.cloud.callFunction({
            name: functionName,
            data: {
              data: that.data.queryResults,
              exportchoosed: that.data.exportoption.find(item => item.infoName === "管段方向").value
            },
            timeout: 600000, // 超时时间，单位 ms
            success: res => {
              wx.hideLoading(); // 关闭正在导出的提示
              console.log(res);
              const fileID = res.result;
              console.log(fileID);
              wx.showLoading({
                title: '文档下载中...',
                mask: true
              });
              // 调用云存储 API 获取临时下载链接
              wx.cloud.getTempFileURL({
                fileList: [fileID],
                success: res => {
                  console.log("res", res);
                  // 获取下载链接
                  let downloadUrl = res.fileList[0].tempFileURL;

                  // 下载文件
                  wx.downloadFile({
                    url: downloadUrl,
                    success: res => {
                      console.log('url1111', res);
                      if (res.statusCode === 200) {
                        const fs = wx.getFileSystemManager();
                        const filePath = `${wx.env.USER_DATA_PATH}/${that.data.fileName}.xlsx`;
                        fs.saveFile({
                          tempFilePath: res.tempFilePath,
                          filePath: filePath,
                          success: function (saveRes) {
                            wx.showLoading({
                              title: '文档打开中...',
                              mask: true
                            });
                            console.log('文件保存成功: ', saveRes.savedFilePath);
                            // 使用保存的文件路径打开文档
                            wx.openDocument({
                              filePath: saveRes.savedFilePath,
                              success: function (res) {
                                wx.showToast({
                                  title: '文档打开成功',
                                  icon: 'success',
                                  duration: 2000
                                });
                                console.log('打开文档成功');
                              },
                              fail: function (error) {
                                console.log('打开文档失败', error);
                              }
                            });
                          },
                          fail: function (error) {
                            console.error('文件保存失败: ', error);
                          }
                        });
                      }
                    },
                    fail: function (error) {
                      console.error('文件下载失败: ', error);
                      wx.showToast({
                        title: '下载失败，请稍后再试',
                        icon: 'none',
                        duration: 2000
                      });
                    }
                  });
                },
                fail: function (error) {
                  console.error(error);
                  wx.showToast({
                    title: '获取下载链接失败，请稍后再试',
                    icon: 'none',
                    duration: 2000
                  });
                }
              });
            },
            fail: function (error) {
              if(error.code ==='ETIMEDOUT'){
                console.log('超时了，请稍后再试');
              }
              console.error(error);
              wx.showToast({
                title: '导出失败，请稍后再试',
                icon: 'none',
                duration: 2000
              });
            }
          });
        } else if (modalRes.cancel) {
          // 用户点击取消按钮
          wx.showToast({
            title: '已取消导出',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  gettest: function () {
    wx.cloud.callFunction({
      name: 'callone',
      success: res => {
        console.log("test", res.result);
      },
      fail: err => {
        console.error(err);
      }
    });
  },

  updateMessageItem(index, key, value) {
    this.data.exportoption[index][key] = value;
    this.setData({
      exportoption: this.data.exportoption
    });
  },
  handPickerChange(e) {
    let index = e.currentTarget.dataset.index;
    let value = this.data.exportoption[index].options[e.detail.value];
    console.log("22222", index, value);
    this.updateMessageItem(index, 'value', value);
  },

  onShow: function () {
    // 生命周期函数--监听页面显示
  },
  onHide: function () {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function () {
    // 生命周期函数--监听页面卸载

  },
  onPullDownRefresh: function () {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  onReachBottom: function () {
    // 页面上拉触底事件的处理函数

  },


  onShareAppMessage: function () {
    // 用户点击右上角分享
    return {
      title: 'title', // 分享标题
      desc: 'desc', // 分享描述
      path: 'path' // 分享路径
    }
  }
})
