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
        oldmessage: []
    },
    onLoad: function (options) {
        const workInfo = JSON.parse(options.workInfo);
        this.setData({ workInfo: workInfo });
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
            if (this.data.workInfo.message !== undefined) {
                 // 使用 JSON.parse(JSON.stringify()) 来深拷贝 message
             const messageCopy = JSON.parse(JSON.stringify(this.data.workInfo.message));
                this.setData({
                    message: this.data.workInfo.message,
                    oldmessage: messageCopy
                })
            }
            console.log("this.data.oldmessage", this.data.oldmessage);
            console.log("this.data.workInfomessage", this.data.workInfo);
        })
            .catch(err => {
                console.error(err);
            });

        wx.cloud.callFunction({
            name: 'getWellNumber',
            success: res => {
                console.log('数据库内容：', res.result.data);
                this.setData({
                    wellNumbers: res.result.data
                }, () => {
                    console.log("this.data.wellNumbers", this.data.wellNumbers);
                }
                );
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
        console.log("this.data.userAccount", this.data.userAccount);
        console.log("this.data.role", this.data.userRole);

    },
    onReady: function () {
        // 生命周期函数--监听页面初次渲染完成

    },
    onShow: function () {
        // 生命周期函数--监听页面显示
    },

    handleInput(e) {
        let value = e.detail.value;
        if (value.length > 100) {
            value = value.slice(0, 100);
        }
        console.log(e.currentTarget.dataset.index, value);
        console.log("this.data.oldmessage", this.data.oldmessage);
        console.log("this.data.message", this.data.message);
        this.updateMessageItem(e.currentTarget.dataset.index, 'value', value);
    },

    handleInputSearch: function (e) {
        const index = e.currentTarget.dataset.index;
        const wellNumberInput = e.detail.value;
        const infoName = e.currentTarget.dataset.name; // 确保你的 input 元素有 data-name 属性
        const item = this.data.message[index];
        item.value = wellNumberInput;
        this.setData({ message: this.data.message });
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
        } else {
        }
    },

    updateMessageItem(index, key, value) {
        this.data.message[index][key] = value;
        this.setData({
            message: this.data.message
        });
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

    addNewWellNumber: function (e) {
        // 弹出模态对话框让用户输入新的井号
        wx.showModal({
            title: '新增井号',
            editable: true,
            success: (res) => {
                if (res.confirm && res.content) {
                    this.setData({ wellNumberInput: res.content });
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
                console.log('数据库内容：', res.result.data);
                this.setData({
                    wellNumbers: res.result.data
                });
            },
            fail: error => {
                console.error('调用失败：', error);
            }
        });
        console.log("this.data.wellNumbers1111", this.data.wellNumbers);
    },

    // 上传图片
    uploadPicToCloud() {
        wx.cloud.init();
        wx.showLoading({ title: '上传中' });

        const uploadTasks = this.getUploadTasks();

        return Promise.all(uploadTasks)
            .then(data => {
                wx.showToast({ title: '上传成功', icon: 'none' });
                const newFileList = data.map(item => ({ url: item.fileID }));
                this.setData({ cloudPath: data, fileList: newFileList });
                console.log("云端位置", this.data.cloudPath);
                console.log("本地fileList", this.data.fileList)
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
        const message = this.data.message;
        // 定义检查井号是否存在的函数
        const hasRequiredWellNumbers = () => {
            const requiredWells = ['起始井号', '终点井号', '施工井号'];
            return message.some(msg => requiredWells.includes(msg.infoname));
        };
        for (let i = 0; i < this.data.message.length; i++) {
            if (this.data.message[i].type === 'upload') {
                const fileNames = this.getFileNames(i);
                console.log("fileNames", fileNames);
                if (!fileNames) {
                    wx.showModal({
                        title: '提示',
                        content: '请输入起止井号后上传',
                        showCancel: false,  // 不显示取消按钮
                        confirmText: '确定',  // 确定按钮的文字
                        success: function (res) {
                            if (res.confirm) {
                                console.log('用户点击确定');
                            }
                        }
                    });
                    return null;

                } else {
                    const fileBatches = this.data.message[i].value;
                    const fileTasks = fileBatches.map((file, index) => {
                        const res = this.uploadFilePromise(`${this.getFileNames(i)}-第${index + 1}张图片.png`, file).then(result => {
                            const newMessage = this.data.message;
                            newMessage[i].value[index].url = result.fileID;
                            newMessage[i].value[index].thumb = result.fileID;
                            this.setData({ message: newMessage });
                            return result.fileID;
                        });

                        return res;
                    }

                    );
                    uploadTasks.push(...fileTasks);
                }
            }
        }
        console.log("uplaodTasks", uploadTasks);
        return uploadTasks;
    },

    getFileNames(index = -1) {
        const pureDateString = this.data.workInfo.pureDateString;
        //const uploadTasks = [];
        const message = this.data.message;
        const { Project, Task, Section, DateMouthDay, Work } = this.data.workInfo;
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
        return new Promise((resolve, reject) => {
            const filePath = chooseResult.url;
            // 检查是否 filePath 已经是一个云端 URL
            if (filePath.startsWith('cloud://')) {
                console.log('文件已在云端，无需上传');
                // 直接解决 Promise，返回已存在的文件 ID 或 URL
                resolve({ fileID: filePath });
                return;  // 结束函数执行
            }
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
        console.log("index", index);
        console.log("filevalue", filevalue);
        console.log("ffffff", file)
        filevalue.push(file);
        console.log(index, filevalue);
        this.updateMessageItem(index, 'value', filevalue);
    },

    deleteFile: function (e) {
        console.log("deleteFile", e);
        const file = e.detail.file; // 获取触发删除操作的文件索引和文件对象
        const index = e.currentTarget.dataset.index; // 获取触发删除操作的组件索引
        const message = this.data.message; // 假设 this.data.message 是你存储文件的数组
        console.log("index", index);
        console.log("file", file);
        // 找到对应字段的文件列表并进行修改
        if (message[index].type === 'upload') {
            const fileList = message[index].value;
            console.log("fileList", fileList);
            // 找到并删除对应的文件
            const fileIndex = fileList.findIndex((item) => item.url === file.url);
            console.log("fileIndex", fileIndex);
            console.log("message", this.data.message);
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
        const { message, wellNumbers } = this.data;
        //提取work_id
        const _id = this.data.workInfo._id;
        console.log("work_id", _id);
        // 提取起始井号和终点井号的值
        const startWell = message.find(item => item.infoName === "起始井号")?.value;
        const endWell = message.find(item => item.infoName === "终点井号")?.value;
        const workWell = message.find(item => item.infoName === "施工井号")?.value;
        // 检查是否有有效的井号输入
        if ((workWell && (!startWell || !endWell)) || ((startWell && endWell) && !workWell)) {
            console.log("startWell", startWell)
            console.log("endWell", endWell)
            console.log("wellnumbers1111", wellNumbers)
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
        // 初始化一个数组来存储不同的infoName
        const differentInfoNames = [];
    
        // 此函数用于比较两个数组是否相等
        function arraysEqual(a, b) {
            if (a === b) return true; // 完全相同的引用，返回true
            if (a == null || b == null) return false; // 任一数组为空，返回false
            if (a.length !== b.length) return false; // 数组长度不等，返回false
    
            // 逐元素比较数组中的值
            for (let i = 0; i < a.length; ++i) {
                if (a[i] !== b[i]) return false; // 如果有任何元素不同，返回false
            }
            return true; // 所有元素相同，返回true
        }
    
        // 遍历newdata中的每个元素
        newdata.forEach(item => {
            // 如果infoName为'worklog'，则忽略这个项目，不进行比较
            if (item.infoName === 'worklog') {
                return;
            }
            // 从映射中获取相同infoName的老值
            const oldItemValue = oldDataMap.get(item.infoName);
    
            let isDifferent = false; // 初始化差异标记为false
            if (oldItemValue !== undefined) {
                if (Array.isArray(item.value) && Array.isArray(oldItemValue)) {
                    // 如果两个值都是数组，则使用数组比较函数
                    if (!arraysEqual(item.value, oldItemValue)) {
                        isDifferent = true; // 如果数组不相等，设置差异标记为true
                    }
                } else if (item.value !== oldItemValue) {
                    // 对于非数组值，直接比较
                    isDifferent = true; // 如果值不同，设置差异标记为true
                }
            } else {
                // 如果oldItemValue未定义，即在旧数据中不存在此infoName
                isDifferent = true;
            }
    
            // 如果存在差异，将infoName添加到结果数组中
            if (isDifferent) {
                differentInfoNames.push(item.infoName);
            }
        });
        console.log("differentInfoNames", differentInfoNames);
        // 返回包含所有不同infoName的数组
        return differentInfoNames;
    },

    confirmEdit: function() {
        const message = this.data.message;
        const now = new Date();
        const dateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const updaterName = this.data.userAccount; // 应根据用户上下文动态获取
        let value = "表单确认"
        const logEntry = {
            Updated_name: updaterName,
            Updated_date: dateTime,
            Updated_information:value  // 将所有更新的infoName合并为一个字符串
        };
        console.log("logEntry", logEntry);
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
        this.setData({ message: message });
        console.log("message11111111111", this.data.message);
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
        console.log("message1111", message);
        // 定义检查井号是否存在的函数
        const hasRequiredWellNumbers = () => {
            const requiredWells = ['起始井号', '终点井号', '施工井号'];
            return message.some(msg => requiredWells.includes(msg.infoName));
        };
        console.log("hasRequiredWellNumbers", hasRequiredWellNumbers());
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
        this.uploadPicToCloud()
            .then((result) => {
                if (result === null) {
                    console.log("上", result);
                    return;
                }
                const now = new Date();
                const dateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                const updaterName = this.data.userAccount; // 应根据用户上下文动态获取
                const differentInfoNames = this.compareData(this.data.message, this.data.oldmessage);
                console.log("differentInfoNames", differentInfoNames);
                if (differentInfoNames.length === 0) {
                    console.log("表单未修改，无需更新数据库");
                    return; // 如果表单未修改，无需更新数据库
                }
                const logEntry = {
                    Updated_name: updaterName,
                    Updated_date: dateTime,
                    Updated_information: differentInfoNames // 将所有更新的infoName合并为一个字符串
                };
                console.log("logEntry", logEntry);
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
                this.setData({ message: message });
                console.log("message11111111111", this.data.message);
                // 等待上传完成后再执行上传消息到云端的操作
                this.uploadMessageToCloud();
                this.data.oldmessage = this.data.message; // 保存旧数据，用于比较新数据与旧数据差异
            })
            .catch(err => {
                console.error('上传图片失败:', err);
                wx.showToast({ title: '上传图片失败', icon: 'none' });
            });

    },
    uploadMessageToCloud() {
        const { message, workInfo } = this.data;
        const { _id } = workInfo;
        wx.cloud.callFunction({
            name: 'updateWork',
            data: {
                _id,
                message,
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