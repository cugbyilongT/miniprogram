Page({
  data: {
    workInfo: {},
    userAccount: "",
    userRole: "",
    wellNumbers: [],
    wellNumberInput: "",
    searchResults: [],
    activeKey: 0,
    fileList: [],
    activeInputIndex: "",
    activeInputValue: "",
    message: [],
    isConfirmed: false, // 是否确认，初始为未确认
    oldmessage: [],
    time: "",
  },
  onLoad: function (options) {
    const workInfo = JSON.parse(options.workInfo);
    console.log("workInfo", workInfo);
    this.setData({
      workInfo: workInfo
    });
    wx.cloud.callFunction({
      name: 'getWork',
      data: {
        _id: workInfo._id
      }
    }).then(res => {
      this.setData({
        workInfo: res.result.data[0]
      });
      if (this.data.workInfo.message !== undefined) {
        // 使用 JSON.parse(JSON.stringify()) 来深拷贝 message
        const messageCopy = JSON.parse(JSON.stringify(this.data.workInfo.message));
        this.setData({
          message: this.data.workInfo.message,
          oldmessage: messageCopy
        })
      }
      console.log("this.data.message", this.data.message);
      console.log("this.data.workInfo", this.data.workInfo);
    })
      .catch(err => {
        console.error(err);
      });

    wx.cloud.callFunction({
      name: 'getWellNumber',
      success: res => {
        this.setData({
          wellNumbers: res.result.data
        }, () => {
          // console.log("this.data.wellNumbers", this.data.wellNumbers);
        });
      },
      fail: error => {
        console.error('调用失败：', error);
      }
    });
    const userAccount = getApp().globalData.userAccount
    const userRole = getApp().globalData.userRole
    this.setData({
      userAccount: userAccount,
      userRole: userRole
    })

  },
  onReady: function () {
    // 生命周期函数--监听页面初次渲染完成

  },
  onShow: function () {
    // 生命周期函数--监听页面显示
  },

  handleTimeChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const newValue = `${dateTime} ${value}`;
    const key = `message[${index}].value`;
    this.setData({
      [key]: newValue
    });
    console.log("message", this.data.message);

    // this.updateCombinedTime();
  },

  // updateCombinedTime: function() {
  //     const now = new Date();
  //     const dateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  //     // 从 message 中找到上班时间和下班时间
  //     const message = this.data.message;
  //     console.log("updateCombinedTimemessage",message)
  //     const startTimeObj = message.find(item => item.infoName === "上班时间");
  //     const endTimeObj = message.find(item => item.infoName === "下班时间");

  //     // 确保找到的时间对象存在
  //     if (startTimeObj && endTimeObj) {
  //         const startTime = startTimeObj.value;
  //         const endTime = endTimeObj.value;

  //         // 更新 combinedTime
  //         this.setData({
  //             combinedTime: `${dateTime} ${startTime} - ${dateTime} ${endTime}`
  //         });
  //         console.log("updateCombinedTime", this.data.combinedTime);
  //     } else {
  //         console.error("上班时间或下班时间未找到");
  //     }
  // },
  deleteWork(e) {
    const workId = this.data.workInfo._id;
    console.log("deleteWorkworkId", workId);
    wx.showModal({
      title: '提示',
      content: '确定删除该工单吗？',
      success: res => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'deleteWork',
            data: {
              _id: workId
            },
            success: res => {
              wx.showToast({
                title: '删除成功',
                icon: 'none',
                duration: 2000
              });

              setTimeout(() => {
                wx.navigateBack({
                  delta: 1
                });
              }, 2000);
            },
            fail: error => {
              console.error('调用失败：', error);
            }
          });
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  handleInput(e) {
    let value = e.detail.value;
    if (value.length > 100) {
      value = value.slice(0, 100);
    }
    this.updateMessageItem(e.currentTarget.dataset.index, 'value', value);
  },

  handleInputSearch: function (e) {
    const index = e.currentTarget.dataset.index;
    const wellNumberInput = e.detail.value;
    const infoName = e.currentTarget.dataset.name; // 确保你的 input 元素有 data-name 属性
    const item = this.data.message[index];
    item.value = wellNumberInput;
    this.setData({
      message: this.data.message
    });
    // 设置当前激活输入框的索引和名字
    this.setData({
      activeInputIndex: index,
      activeInputName: infoName
    });

    // 进行本地数据搜索
    if (wellNumberInput) {
      const filteredResults = this.data.wellNumbers[0].dalong.filter(well => {
        // 确保井对象有 'Wellnumber' 属性，并且在调用 includes 之前它是一个字符串
        return well.Wellnumber && well.Wellnumber.includes(wellNumberInput);
      });
      this.setData({
        searchResults: filteredResults
      });
      // 如果搜索结果为空，显示提示框
      if (filteredResults.length === 0) {
        wx.showToast({
          title: '请添加井号',
          icon: 'none', // 使用 'none' 来显示没有图标的纯文本提示
          duration: 2000 // 提示框显示时间
        });
      }
    } else {
      // 如果输入为空，清空搜索结果
      this.setData({
        searchResults: []
      });



    }
  },

  selectWellnumber: function (e) {
    const wellnumber = e.currentTarget.dataset.number;
    const messageIndex = e.currentTarget.dataset.messageIndex; // 获取正确的 message 数组索引
    const item = this.data.message[messageIndex];

    if (item) {
      item.value = wellnumber;
      this.setData({
        message: this.data.message,
        searchResults: [] // 清空搜索结果
      });
    } else { }
  },

  updateMessageItem(index, key, value) {
    console.log("updateMessageItemindex", index)
    console.log("updateMessageItemkey", key)
    console.log("updateMessageItemvalue", value)
    this.data.message[index][key] = value;
    // const infoName = this.data.message[index].infoName;
    this.setData({
      message: this.data.message
    });
    // if (infoName === "清疏量计算公式" ||infoName === "清疏量计算数据" ) {
    //     this.Calculate_the_clarity();
    // }
  },
  handPickerChange(e) {
    let index = e.currentTarget.dataset.index;
    let value = this.data.message[index].options[e.detail.value];
    this.updateMessageItem(index, 'value', value);
  },

  handleCheckboxChange(e) {
    let index = e.currentTarget.dataset.index;
    let newValues = e.detail.value;
    let message = this.data.message;
    let item = message[index];
    if (item.type === 'checkbox') {
      // 更新options中的checked状态
      let updatedOptions = item.options.map(option => ({
        ...option,
        checked: newValues.includes(option.name)
      }));

      // 更新对应的message item
      message[index] = {
        ...item,
        options: updatedOptions,
        value: newValues
      };

      this.setData({
        message: message
      });
    }
  },

  Calculate_the_clarity: function (e) {
    const inputValue = e.detail.value;
    console.log("inputValue", inputValue);
    let cube;
    let d1, d2, d3;
    const message = this.data.message;
    const clarity = message.find(item => item.infoName === "清疏量计算公式");
    const clarityValue = clarity.value;
    console.log("clarityValue", clarityValue);
    const Clear_data = message.find(item => item.infoName === "清疏量计算数据").value;
    if (Clear_data) {
      const dimensions = Clear_data.split(/[-,_;—；一\s]+/).map(Number);
      if (dimensions.length === 3) {
        [d1, d2, d3] = dimensions.map(dim => dim); // 转换为米
        if (d1 === 0 || d2 === 0 || d3 === 0) {
          wx.showModal({
            title: '提示',
            content: '若服务项目为其他，填写清疏量计算参数，单位均为米：如长-宽-高：20-1.5-3或长度-管径-积深：20-0.8-0.2',
            showCancel: false,
            confirmText: '确定',
            success(res) {
              if (res.confirm) {
                console.log('用户点击确定');
              }
            }
          });
          return
        }
      } else {
        wx.showModal({
          title: '提示',
          content: '若服务项目为其他，填写清疏量计算参数，单位均为米：如长-宽-高：20-1.5-3或长度-管径-积深：20-0.8-0.2',
          showCancel: false,
          confirmText: '确定',
          success(res) {
            if (res.confirm) {
              console.log('用户点击确定');
            }
          }
        });
        console.error("数据格式不正确");
        return
      }
    } else {
      console.error("未找到清疏量计算公式");
    }
    if (!clarityValue) {
      wx.showModal({
        title: '提示',
        content: '请选择清疏量计算公式',
        showCancel: false,
        confirmText: '确定',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定');
          }
        }
      });
      return; // 阻止后续代码执行
    } else if (clarityValue === "矩形-长宽高") {
      const [length, width, height] = [d1, d2, d3];
      cube = (length * width * height).toFixed(1); // 计算体积
      console.log("Volume:", cube);
    } else if (clarityValue === "圆形-长度-管径-积深") {
      const [length, pipe_diameter, deposition_height] = [d1, d2, d3];
      // 圆心角 三角函数
      //   const radius = pipe_diameter / 2 ; // 将半径转化为米
      //   if (deposition_height > pipe_diameter) {
      //     throw new Error("淤积深度不能超过管径。");
      //   }
      //   // 半圆心角 theta
      //   const theta = Math.acos((radius - deposition_height) / radius);
      //   const crossSectionalArea = (Math.pow(radius, 2) * theta) - (Math.pow(radius, 2) * Math.sin(theta))
      //         + radius * deposition_height * Math.sin(theta); // 计算横截面积
      //   cube = (length * crossSectionalArea ).toFixed(2); // 计算淤积量，积深转化为米

      // 边的长度 勾股定理
      const radius = pipe_diameter / 2; // 将半径转化为米
      if (deposition_height > pipe_diameter) {
        wx.showModal({
          title: '提示',
          content: '淤积高度不能高于管径',
          showCancel: false,
          confirmText: '确定',
          success(res) {
            if (res.confirm) {
              console.log('用户点击确定');
            }
          }
        });
      }
      // 半圆心角 theta = Math.acos((radius - deposition_height) / radius)
      const crossSectionalArea = (Math.pow(radius, 2) * Math.acos((radius - deposition_height) / radius)) - (radius - deposition_height) * Math.sqrt(2 * radius * deposition_height - Math.pow(deposition_height, 2)); // 计算横截面积
      cube = (length * crossSectionalArea).toFixed(1); // 计算淤积量，积深转化为米
      console.log("Cross-sectional Area (square meters):", crossSectionalArea);
      console.log("Deposition Volume (cubic meters):", cube);
    } else {
      wx.showModal({
        title: '提示',
        content: '若服务项目为其他，填写清疏量计算参数，单位均为米：如长-宽-高：20-1.5-3或长度-管径-积深：20-0.8-0.2',
        showCancel: false,
        confirmText: '确定',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定');
          }
        }
      });
      console.error("数据格式不正确");
    }
    // 更新清疏量结果
    if (cube !== undefined) {
      const updatedMessage = message.map(item => {
        if (item.infoName === "清疏量结果") {
          return {
            ...item,
            value: cube
          };
        }
        return item;
      });
      this.setData({
        message: updatedMessage
      });
    }
    console.log("this.data.message", this.data.message);

  },

  addNewWellNumber: function (e) {
    // 弹出模态对话框让用户输入新的井号
    wx.showModal({
      title: '新增井号',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            wellNumberInput: res.content
          });
          // 调用云函数添加井号到数据库
          wx.cloud.callFunction({
            name: 'addWellNumber',
            data: {
              id: this.data.wellNumbers[0]._id,
              wellNumber: res.content
            },
            success: res => {
              if (res.result.success) {
                wx.showToast({
                  title: '井号添加成功',
                  icon: 'success',
                  duration: 2000
                });
                // 添加成功后自动刷新井号列表
                this.refreshWellNumbers();
              } else {
                console.error(res);
                wx.showToast({
                  title: '添加失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            },
            fail: err => {

              console.error('云函数调用失败', err);
              wx.showToast({
                title: '网络错误，添加失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 刷新井号列表的方法
  refreshWellNumbers: function () {
    wx.cloud.callFunction({
      name: 'getWellNumber',
      success: res => {
        this.setData({
          wellNumbers: res.result.data
        });
      },
      fail: error => {
        console.error('调用失败：', error);
      }
    });
  },

  // 上传图片
  uploadPicToCloud() {
    wx.showLoading({
      title: '图片上传中'
    });

    const uploadTasks = this.getUploadTasks();

    return Promise.all(uploadTasks)
      .then(data => {
        wx.showToast({
          title: '上传成功',
          icon: 'none'
        });
        const newFileList = data.map(item => ({
          url: item.fileID
        }));
        this.setData({
          cloudPath: data,
          fileList: newFileList
        });
        console.log("云端位置", this.data.cloudPath);
        console.log("本地fileList", this.data.fileList)
      })
      .catch(e => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        // console.log(e);
        // 如果上传失败,返回一个 rejected 的 Promise 对象
        return Promise.reject(e);
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  getUploadTasks() {
    let num = 0;
    const uploadTasks = [];
    const message = this.data.message;
    // 定义检查井号是否存在的函数
    const hasRequiredWellNumbers = () => {
      const requiredWells = ['起始井号', '终点井号', '施工井号'];
      return message.some(msg => requiredWells.includes(msg.infoname));
    };
    for (let i = 0; i < this.data.message.length; i++) {
      if (this.data.message[i].type === 'upload') {
        const fileNames = this.getFileNames(i);
        if (!fileNames) {
          wx.showModal({
            title: '提示',
            content: '请输入起止井号后上传',
            showCancel: false, // 不显示取消按钮
            confirmText: '确定', // 确定按钮的文字
            success: function (res) {
              if (res.confirm) {
                console.log('用户点击确定');
              }
            }
          });
          return null;

        } else {
          console.log("fileNames", this.data.message[i]);
          const fileBatches = this.data.message[i].value;
          const filevalue = this.data.oldmessage[i].value.length;
          console.log("fileBatches", fileBatches);

          // 提取所有编号
          let numbers = fileBatches.map(file => {
            const match = file.url.match(/第(\d+)张图片/);
            return match ? parseInt(match[1], 10) : null;
          }).filter(number => number !== null);
          const fileTasks = fileBatches.map((file, index) => {
            // 确保 file.url 是一个字符串并且不以 "cloud://" 开头
            if (typeof file.url === 'string' && !file.url.startsWith('cloud://')) {
              if (filevalue === 0) {
                num = index + 1;
              } else {
                numbers.sort((a, b) => a - b);
                console.log("排序后的编号:", numbers);
                // 初始化 num
                num = 0;
                // 检查连续性并设置 num
                for (let j = 0; j < numbers.length; j++) {
                  if (numbers[j] !== j + 1) {
                    num = j + 1;
                    break;
                  }
                }
                // 如果所有编号是连续的，则 num 为最大的编号加 1
                if (num === 0) {
                  num = numbers.length + 1;
                }

                console.log("确定的num值:", num);
                // 将最新的 num 加入 numbers 中
                numbers.push(num);
                numbers.sort((a, b) => a - b); // 再次排序，确保 numbers 是有序的
                console.log("加入最新 num 后的编号:", numbers);
              }
            }
            const res = this.uploadFilePromise(`${this.getFileNames(i)}-第${num}张图片.png`, file).then(result => {
              console.log('上传成功', result);
              const newMessage = this.data.message;
              newMessage[i].value[index].url = result.fileID;
              newMessage[i].value[index].thumb = result.fileID;
              this.setData({
                message: newMessage
              });
              return result.fileID;
            });

            return res;
          }

          );
          uploadTasks.push(...fileTasks);
        }
      }
    }
    return uploadTasks;
  },

  getFileNames(index = -1) {
    const pureDateString = this.data.workInfo.pureDateString;
    //const uploadTasks = [];
    const message = this.data.message;
    const {
      Project,
      Task,
      Section,
      DateMouthDay,
      Work
    } = this.data.workInfo;
    // 定义检查井号是否存在的函数
    //const hasRequiredWellNumbers = () => {
    // const requiredWells = ['起始井号', '终点井号', '施工井号'];
    // return message.some(msg => requiredWells.includes(msg.infoname));
    // };
    let baseName = "";
    //const startWellNumber = this.data.message.find(item => item.infoName === "起始井号")?.value;
    //const endWellNumber = this.data.message.find(item => item.infoName === "终点井号")?.value;
    //const workWellNumber = this.data.message.find(item => item.infoName === "施工井号")?.value;
    // 检查起始井号和终点井号是否都已提供

    //const baseName = `${Project}-${Task}-${Section}-${DateMouthDay}-${Work}-${startWellNumber}-${endWellNumber}-${this.data.message[index].infoName}`;
    baseName = `${Project}-${Task}-${Section}-${DateMouthDay}-${Work}-${pureDateString}-${this.data.message[index].infoName}`;
    //const baseName2 = `${Project}-${Task}-${Section}-${DateMouthDay}-${Work}-${startWellNumber}-${endWellNumber}-${this.data.message[index].infoName}`;
    baseName.replace(/\s+/g, '');
    return index === -1 ? baseName : `${baseName}`;

  },

  uploadFilePromise(fileName, chooseResult) {
    console.log('开始上传文件', fileName, chooseResult);
    return new Promise((resolve, reject) => {
      const filePath = chooseResult.url;
      // 检查是否 filePath 已经是一个云端 URL
      if (filePath.startsWith('cloud://')) {
        console.log('文件已在云端，无需上传');
        // 直接解决 Promise，返回已存在的文件 ID 或 URL
        resolve({
          fileID: filePath
        });
        return; // 结束函数执行
      }
      const cloudPath = `uploads/${fileName}`;
      console.log('上传文件到云端路径', cloudPath);
      const uploadTask = wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => {
          resolve({
            fileID: res.fileID
          });
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
    const {
      file
    } = event.detail;
    const index = event.target.dataset.index;
    const filevalue = this.data.message[index].value;
    // 将文件添加到文件列表
    filevalue.push(file);
    this.updateMessageItem(index, 'value', filevalue);
  },

  deleteFile: function (e) {
    const file = e.detail.file; // 获取触发删除操作的文件索引和文件对象
    const index = e.currentTarget.dataset.index; // 获取触发删除操作的组件索引
    const message = this.data.message; // 假设 this.data.message 是你存储文件的数组
    // 找到对应字段的文件列表并进行修改
    if (message[index].type === 'upload') {
      const fileList = message[index].value;
      // 找到并删除对应的文件
      const fileIndex = fileList.findIndex((item) => item.url === file.url);
      if (fileIndex !== -1) {
        fileList.splice(fileIndex, 1); // 删除找到的文件
      }

      // 更新数据
      this.setData({
        message: message
      });
    }
  },

  checkWellNumbers: function () {
    const {
      message,
      wellNumbers
    } = this.data;
    //提取work_id
    const _id = this.data.workInfo._id;
    // 提取起始井号和终点井号的值
    const startWell = message.find(item => item.infoName === "起始井号")?.value;
    const endWell = message.find(item => item.infoName === "终点井号")?.value;
    const workWell = message.find(item => item.infoName === "施工井号")?.value;
    // 检查是否有有效的井号输入
    if ((workWell && (!startWell || !endWell)) || ((startWell && endWell) && !workWell)) {
      wx.cloud.callFunction({
        name: 'addWellToWork',
        data: {
          _id,
          startWell,
          endWell,
          workWell,
        },
        success: res => {
          console.log('数据库内容：', res.result.data);

        },
        fail: error => {
          console.error('调用失败：', error);
        }
      });
      // 检查井号是否存在于wellNumbers数组中
      // 使用 some 方法检查是否存在某个 Wellnumber 与 startWell 相等
      const isStartWellInArray = wellNumbers[0].dalong.some(well => well.Wellnumber === startWell);
      const isEndWellInArray = wellNumbers[0].dalong.some(well => well.Wellnumber === endWell);
      const isWorkWellInArray = wellNumbers[0].dalong.some(well => well.Wellnumber === workWell);
      if (!isStartWellInArray || !isEndWellInArray || !isWorkWellInArray) {
        console.error("井号不在已知井号列表中");
        wx.showModal({
          title: '错误',
          content: '井号不在已知井号列表中，请检查输入的井号或添加新井号。',
          showCancel: false
        });
        return false; // 终止程序执行
      }

      // 如果井号验证通过，继续执行其他逻辑
      console.log("井号验证通过，继续执行程序");
      return true;
    } else {
      console.error("井号未输入");
      wx.showModal({
        title: '错误',
        content: '请确保输入了对应井号',
        showCancel: false
      });
      return false; // 终止程序执行
    }

  },
  compareData(newdata, olddata) {
    // 创建一个映射，将olddata中的每个元素的infoName作为键，value作为值
    const oldDataMap = new Map(olddata.map(item => [item.infoName, item.value]));

    // 初始化两个数组来存储不同的infoName和详细差异项
    const differentInfoNames = [];
    const detailedDifferences = [];

    // 深度比较两个值是否相等的函数
    function deepEqual(a, b) {
      if (a === b) return true; // 完全相同的引用，返回true

      if (typeof a !== typeof b) return false; // 类型不同，返回false
      if (a == null || b == null) return false; // 任一为null，返回false

      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false; // 数组长度不同，返回false
        for (let i = 0; i < a.length; ++i) {
          if (!deepEqual(a[i], b[i])) return false; // 递归比较数组元素
        }
        return true; // 所有元素相同，返回true
      }

      if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false; // 对象键数量不同，返回false
        for (const key of keysA) {
          if (!deepEqual(a[key], b[key])) return false; // 递归比较对象属性
        }
        return true; // 所有属性相同，返回true
      }

      return false; // 其他情况，返回false
    }

    // 遍历newdata中的每个元素
    newdata.forEach(item => {
      // 如果infoName为'worklog'，则忽略这个项目，不进行比较
      if (item.infoName === 'worklog' || item.infoName === '单价（仅项目经理可见）') {
        return;
      }
      // 从映射中获取相同infoName的老值
      const oldItemValue = oldDataMap.get(item.infoName);

      let isDifferent = false; // 初始化差异标记为false
      if (oldItemValue !== undefined) {
        if (!deepEqual(item.value, oldItemValue)) {
          isDifferent = true; // 如果值不同，设置差异标记为true
        }
      } else {
        // 如果oldItemValue未定义，即在旧数据中不存在此infoName
        isDifferent = true;
      }

      // 如果存在差异，将infoName添加到结果数组中，并添加详细差异项
      if (isDifferent) {
        differentInfoNames.push(item.infoName);
        detailedDifferences.push({
          infoName: item.infoName,
          oldValue: oldItemValue,
          newValue: item.value
        });
      }
    });

    // console.log("differentInfoNames", differentInfoNames);
    // console.log("detailedDifferences", detailedDifferences);

    // 返回包含所有不同infoName的数组和详细差异项数组
    return differentInfoNames;
  },

  // compareData(newdata, olddata) {
  //     console.log("newdata", newdata);
  //     console.log("olddata", olddata);
  //     // 创建一个映射，将olddata中的每个元素的infoName作为键，value作为值
  //     const oldDataMap = new Map(olddata.map(item => [item.infoName, item.value]));
  //     // 初始化一个数组来存储不同的infoName
  //     const differentInfoNames = [];
  //     const detailedDifferences = [];

  //     // 此函数用于比较两个数组是否相等
  //     function arraysEqual(a, b) {
  //         if (a === b) return true; // 完全相同的引用，返回true
  //         if (a == null || b == null) return false; // 任一数组为空，返回false
  //         if (a.length !== b.length) return false; // 数组长度不等，返回false

  //         // 逐元素比较数组中的值
  //         for (let i = 0; i < a.length; ++i) {
  //             if (a[i] !== b[i]) return false; // 如果有任何元素不同，返回false
  //         }
  //         return true; // 所有元素相同，返回true
  //     }

  //     // 遍历newdata中的每个元素
  //     newdata.forEach(item => {
  //         // 如果infoName为'worklog'，则忽略这个项目，不进行比较
  //         if (item.infoName === 'worklog') {
  //             return;
  //         }
  //         // 从映射中获取相同infoName的老值
  //         const oldItemValue = oldDataMap.get(item.infoName);

  //         let isDifferent = false; // 初始化差异标记为false
  //         if (oldItemValue !== undefined) {
  //             if (Array.isArray(item.value) && Array.isArray(oldItemValue)) {
  //                 // 如果两个值都是数组，则使用数组比较函数
  //                 if (!arraysEqual(item.value, oldItemValue)) {
  //                     isDifferent = true; // 如果数组不相等，设置差异标记为true
  //                 }
  //             } else if (item.value !== oldItemValue) {
  //                 // 对于非数组值，直接比较
  //                 isDifferent = true; // 如果值不同，设置差异标记为true
  //             }
  //         } else {
  //             // 如果oldItemValue未定义，即在旧数据中不存在此infoName
  //             isDifferent = true;
  //         }

  //         // 如果存在差异，将infoName添加到结果数组中
  //         if (isDifferent) {
  //             differentInfoNames.push(item.infoName);
  //             detailedDifferences.push({
  //                 infoName: item.infoName,
  //                 oldValue: oldItemValue,
  //                 newValue: item.value
  //             });
  //         }
  //     });
  //     console.log("detailedDifferences", detailedDifferences);
  //     console.log("differentInfoNames", differentInfoNames);
  //     // 返回包含所有不同infoName的数组
  //     return differentInfoNames;
  // },

  confirmEdit: function () {
    const message = this.data.message;
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updaterName = this.data.userAccount; // 应根据用户上下文动态获取
    let value = "表单确认"
    const logEntry = {
      Updated_name: updaterName,
      Updated_date: dateTime,
      Updated_information: value // 将所有更新的infoName合并为一个字符串
    };
    // 查找或创建worklog条目
    const worklogEntry = message.find(msg => msg.infoName === "worklog");
    if (worklogEntry) {
      if (!worklogEntry.value) {
        worklogEntry.value = []; // 如果不存在则初始化
      }
      worklogEntry.value.push(logEntry);
    } else {
      // 如果没有worklog条目，则创建一个
      message.push({
        infoName: "worklog",
        value: [logEntry]
      });
    }
    this.setData({
      message: message
    });
    // 等待上传完成后再执行上传消息到云端的操作
    this.uploadMessageToCloud();
    // 点击确认后，设置isConfirmed为true，禁止表单编辑
    this.setData({
      isConfirmed: true
    });

    // 显示提示信息
    wx.showToast({
      title: '页面信息已确认，本页将无法修改',
      icon: 'none', // 使用'none'表示不显示图标
      duration: 2000 // 提示框显示时间，默认为1500ms
    });
  },

  submitwork(event) {
    console.log("submitworkthis.data.message", this.data.message);
    console.log("submitworkthis.data.oldmessage", this.data.oldmessage)
    // 提交表单的处理逻辑
    if (this.data.isConfirmed) {
      // 如果已确认，阻止提交
      wx.showToast({
        title: '无法提交，表单已确认',
        icon: 'none'
      });
      return;
    }
    const message = this.data.message;
    // console.log("message", message);

    // 定义检查井号是否存在的函数
    const hasRequiredWellNumbers = () => {
      const requiredWells = ['起始井号', '终点井号', '施工井号'];
      return message.some(msg => requiredWells.includes(msg.infoName));
    };
    // 如果存在指定的井号，执行检查
    if (hasRequiredWellNumbers()) {
      console.log("存在指定的井号，执行检查");
      if (!this.checkWellNumbers()) {
        console.log("因井号问题中断后续操作");
        return; // 如果井号检查未通过，直接返回，不执行后续代码
      }
    }
    // 先执行检查井号的函数，根据返回值决定是否继续
    // if (!this.checkWellNumbers()) {
    //    console.log("因井号问题中断后续操作");
    //    return; // 如果井号检查未通过，直接返回，不执行后续代码
    //}


    // const oldmessage = this.data.oldmessage;
    // const targets = ["起始井远景图片", "终点井远景图片", "远景（参照物）", "清疏前井室图", "清疏后井室图"];

    // const invalidEntries = message.filter(item => {
    //     if (targets.includes(item.infoName) && Array.isArray(item.value) && item.value.length > 0) {
    //         const [value] = item.value;
    //         return !(value.location && value.time && value.watermaker === true);
    //     }
    //     return false;
    // }).map(item => item.infoName);
    // if (invalidEntries.length > 0) {
    //     invalidEntries.forEach(invalidInfoName => {
    //         const messageItem = message.find(item => item.infoName === invalidInfoName);
    //         const oldMessageItem = oldmessage.find(item => item.infoName === invalidInfoName);
    //         if (messageItem && oldMessageItem) {
    //             // 深拷贝 oldmessage 中的 value 给 message
    //             messageItem.value = JSON.parse(JSON.stringify(oldMessageItem.value));
    //         }
    //     });
    // }

    this.uploadPicToCloud()
      .then((result) => {
        if (result === null) {
          return;
        }
        console.log("uploadPicToCloudthis.data.message", this.data.message);
        wx.showLoading({
          title: '信息上传中'
        });
        // 定义需要查找的 infoName 项
        const targetInfoNames = [
          '起始井远景图片',
          '起始井问题图片',
          '终点井远景图片',
          '终点井问题图片',
          '远景（参照物）',
          '清疏前井室图',
          '清疏后井室图'
        ];
        let failedInfoNames = []; // 用于存储失败的 infoName 数组
        const now = new Date();
        const dateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const updaterName = this.data.userAccount; // 应根据用户上下文动态获取
        let differentInfoNames = this.compareData(this.data.message, this.data.oldmessage);
        console.log("differentInfoNames", differentInfoNames);
        // if (differentInfoNames.length === 0) {
        //     console.log("表单未修改，无需更新数据库");
        //     wx.hideLoading();
        //     wx.navigateBack({
        //         delta: 1, // 返回的页面数，如果 delta 为 1，则返回到上一个页面
        //         success: function(res) {
        //           // 成功后的回调函数
        //           console.log('成功返回上一层页面');
        //         },
        //         fail: function(err) {
        //           // 失败后的回调函数
        //           console.error('返回上一层页面失败', err);
        //         }
        //       });
        //     return; // 如果表单未修改，无需更新数据库
        // }
        // 先确认 differentInfoNames 中是否有 targetInfoNames 中的内容
        const relevantInfoNames = differentInfoNames.filter(infoName => targetInfoNames.includes(infoName));
        console.log("relevantInfoNames", relevantInfoNames);
        let promises = [];
        if (relevantInfoNames.length > 0) {
          // 遍历 message 数组，找到目标项并处理
          promises = message.map((item) => {
            if (relevantInfoNames.includes(item.infoName) && Array.isArray(item.value) && item.value.length > 0) {
              let fileID = item.value[0].thumb; // 提取 thumb 作为 fileID
              if (fileID) {
                // 调用云函数并返回 Promise
                return wx.cloud.callFunction({
                  name: 'getPicOcr1',
                  data: {
                    fileID
                  }
                }).then(res => {
                  item.value[0].location = res.result.location;
                  item.value[0].time = res.result.time;
                  item.value[0].watermaker = true; // 假设云函数返回结果在 res.result.ocrResult 中
                  // 将返回结果新增到对应的 infoName 的 value 中
                  // item.value[0].ocrResult = res.result; // 假设云函数返回结果在 res.result 中
                }).catch(err => {
                  console.error(err);
                  failedInfoNames.push(item.infoName); // 将失败的 infoName 存入数组
                  console.log("failedInfoNames", failedInfoNames);
                  // 还原对应的 infoName 的 value
                  const oldMessageItem = this.data.oldmessage.find(oldItem => oldItem.infoName === item.infoName);
                  if (oldMessageItem) {
                    item.value = JSON.parse(JSON.stringify(oldMessageItem.value));
                  }

                });
              }
            }
            return Promise.resolve(); // 如果不需要调用云函数，返回一个 resolved 的 Promise
          });
        }

        // 使用 Promise.all 等待所有异步操作完成
        Promise.all(promises).then(() => {
          console.log("所有异步操作完成");
          if (failedInfoNames.length > 0) {
            // 从 differentInfoNames 中移除与 failedInfoNames 相同的元素
            const updatedDifferentInfoNames = differentInfoNames.filter(infoName => !failedInfoNames.includes(infoName));
            differentInfoNames = updatedDifferentInfoNames
            console.log('Updated differentInfoNames:', updatedDifferentInfoNames);
          }

          const logEntry = {
            Updated_name: updaterName,
            Updated_date: dateTime,
            Updated_information: differentInfoNames // 将所有更新的infoName合并为一个字符串
          };
          // console.log("logEntry", logEntry);

          // 查找或创建worklog条目
          const worklogEntry = message.find(msg => msg.infoName === "worklog");
          if (worklogEntry) {
            if (!worklogEntry.value) {
              worklogEntry.value = []; // 如果不存在则初始化
            }
            worklogEntry.value.push(logEntry);
          } else {
            // 如果没有worklog条目，则创建一个
            message.push({
              infoName: "worklog",
              value: [logEntry]
            });
          }
          this.setData({
            message: message,
            workInfo: {
              ...this.data.workInfo,
              message: message
            }

          }, () => {
            console.log("message11111111111", this.data.message);
            console.log("this.data.workInfo._id", this.data.workInfo);
            wx.cloud.callFunction({
              name: 'Singlegdp',
              data: {
                workInfo: this.data.workInfo
              }
            }).then(res => {
              console.log("Singlegdpres", res);
              // 调用云函数添加井号到数据库
              wx.cloud.callFunction({
                name: 'adddatatowork',
                data: {
                  id: this.data.workInfo._id,
                  gdp: res.result.gdp,
                  Complete_workload: res.result.Complete_workload
                },
              }).then(res => {
                // console.log("this.data.workInfo", this.data.workInfo);
                // 等待上传完成后再执行上传消息到云端的操作
                this.uploadMessageToCloud(failedInfoNames);
                wx.hideLoading();
                // 重新载入页面

                // 深拷贝 this.data.message 到 this.data.oldmessage
                // this.data.oldmessage = JSON.parse(JSON.stringify(this.data.message)); // 深拷贝


                wx.navigateBack({
                  delta: 1, // 返回的页面数，如果 delta 为 1，则返回到上一个页面
                  success: function (res) {
                    // 成功后的回调函数
                    console.log('成功返回上一层页面');
                  },
                  fail: function (err) {
                    // 失败后的回调函数
                    console.error('返回上一层页面失败', err);
                  }
                });

              })

            })
              .catch(err => {
                console.error(err);
              });
          })







        }).catch(err => {
          console.error('处理过程中出现错误', err);
          wx.showToast({
            title: '处理过程中出现错误',
            icon: 'none'
          });
        });
      })
    //     if (relevantInfoNames.length > 0) {
    //         // 遍历 message 数组，找到目标项并处理
    //         message.forEach((item) => {
    //             if (relevantInfoNames.includes(item.infoName) && Array.isArray(item.value) && item.value.length > 0) {
    //                 console.log("item", item);
    //                 console.log("item.value", item.value);
    //                 console.log("item.value.thumb", item.value[0].thumb); // 修正访问方式
    //                 let fileID = item.value[0].thumb; // 提取 thumb 作为 fileID
    //                 console.log("fileID", fileID);

    //                 if (fileID) {
    //                     // 调用云函数
    //                     wx.cloud.callFunction({
    //                         name: 'getPicOcr1',
    //                         data: { fileID }
    //                     }).then(res => {
    //                         console.log("getPicOcr1res", res);
    //                         console.log("getPicOcr1res.result", res.result);
    //                         // 将返回结果新增到对应的 infoName 的 value 中
    //                         // item.value[0].ocrResult = res.result; // 假设云函数返回结果在 res.result 中
    //                     }).catch(err => {
    //                         console.error(err);
    //                     });
    //                 }
    //             }
    //         });
    //     }
    //     const logEntry = {
    //         Updated_name: updaterName,
    //         Updated_date: dateTime,
    //         Updated_information: differentInfoNames // 将所有更新的infoName合并为一个字符串
    //     };
    //     console.log("logEntry", logEntry);
    //     // 查找或创建worklog条目
    //     const worklogEntry = message.find(msg => msg.infoName === "worklog");
    //     if (worklogEntry) {
    //         if (!worklogEntry.value) {
    //             worklogEntry.value = []; // 如果不存在则初始化
    //         }
    //         worklogEntry.value.push(logEntry);
    //     } else {
    //         // 如果没有worklog条目，则创建一个
    //         message.push({
    //             infoName: "worklog",
    //             value: [logEntry]
    //         });
    //     }
    //     this.setData({ message: message });
    //     console.log("message11111111111", this.data.message);
    //     // 等待上传完成后再执行上传消息到云端的操作
    //     this.uploadMessageToCloud();
    //     this.data.oldmessage = this.data.message; // 保存旧数据，用于比较新数据与旧数据差异
    // })
    // .catch(err => {
    //     console.error('上传图片失败:', err);
    //     wx.showToast({ title: '上传图片失败', icon: 'none' });
    // });

  },
  uploadMessageToCloud(invalidEntries) {
    const {
      message,
      workInfo
    } = this.data;
    const {
      _id
    } = workInfo;
    console.log("uploadMessageToCloud", message);
    wx.cloud.callFunction({
      name: 'updateWork',
      data: {
        _id,
        message,
      }
    })
      .then(res => {
        if (res.result.success) {
          wx.showToast({
            title: '信息更新成功',
            icon: 'none'
          });
          if (invalidEntries.length > 0) {
            wx.showModal({
              title: '提示',
              content: `以下项目的图片上传失败，请重新上传：${invalidEntries.join(', ')}`,
              showCancel: false,
              confirmText: '确定', // 确定按钮的文字
              success: (result) => {
                if (result.confirm) {
                  console.log('用户点击了确认');
                }
              }
            });
          }
        } else {
          wx.showToast({
            title: '信息更新失败',
            icon: 'none'
          });
          console.error(res.result.error);
        }
      })
      .catch(err => {
        console.error(err);
        wx.showToast({
          title: '信息更新失败',
          icon: 'none'
        });
      });

  },
  // 保存模板方法
  saveTemplate() {
    const {
      message
    } = this.data;

    // 过滤掉 type 为 'upload' 的项
    const template = message.filter(item => item.type !== 'upload' && item.type !== 'log');

    // 将模板存储到本地存储或云端
    wx.setStorage({
      key: 'formTemplate',
      data: template,
      success: () => {
        wx.showToast({
          title: '模板保存成功',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '模板保存失败',
          icon: 'none',
          duration: 2000
        });
        console.error('模板保存失败', err);
      }
    });
  },
  // 加载模板方法
  loadTemplate() {
    wx.getStorage({
      key: 'formTemplate',
      success: (res) => {
        const template = res.data;

        // 重新构造 message 数组，保持 'upload' 类型的内容不变
        const {
          message
        } = this.data;
        const newMessage = message.map(item => {
          if (item.type === 'upload' || item.type === 'log') {
            return item;
          }
          const templateItem = template.find(t => t.infoName === item.infoName);
          return templateItem ? {
            ...item,
            value: templateItem.value
          } : item;
        });

        this.setData({
          message: newMessage
        });
        this.data.oldmessage = JSON.parse(JSON.stringify(this.data.message)); // 深拷贝
        wx.showToast({
          title: '模板加载成功',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '模板加载失败',
          icon: 'none',
          duration: 2000
        });
        console.error('模板加载失败', err);
      }
    });
  },

  onHide: function () {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function () {
    // 生命周期函数--监听页面卸载
    // 清理数据
    this.setData({
      workInfo: {},
      message: [],
      oldmessage: []
    });
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