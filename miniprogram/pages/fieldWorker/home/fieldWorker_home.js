Page({
  data: {
    activeKey: 0, // 当前激活的侧边栏项索引
    projects: [], // 项目列表数据
    filteredProjects:[],
    works:[],
    works_id:[],
    activeNames: ['1'],
    sections:[],
    calendarShow:false,
    selectedProject: null, // 选中的项目
    selectedTask: null, // 选中的任务
    selectedSection: null, // 选中的路段
    selectedDate: null, // 选中的日期
    selectedWork: null, // 选中的作业
    selectedworktype: null,
    rows: [
      {
        pureDateString: "",
        work: "",
        edit: "",
        delete: "",
      } // 当前日期的纯数字表示形式
    ],
    hidden: true,
  },

  onLoad() {
    this.getProjects();
    this.setData({ rows: [] });
  },

  

  getProjects() {
    wx.cloud.callFunction({
      name: 'getProjects',
    })
    .then(res => {
      console.log('获取项目列表成功', res.result.data)
      this.setData({
        projects: res.result.data,
        filteredProjects: res.result.data,
      })
    })
    .catch(err => {
      console.error('获取项目列表失败', err)
    })
  },
  searchProjects(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    const filteredProjects = this.data.projects.filter(project =>
      project.name.toLowerCase().includes(searchText)
    );
    this.setData({
      filteredProjects,
    });
  },

  onSidebarChange(event) {
    this.setData({
      activeKey: event.detail
    });
  },

  handleProjectSelect(e) {
    const selectedProject = e.detail
    this.setData({ 
      selectedProject: e.detail,
      selectedTask: null,
      selectedSection: null,
      selectedDate: null,
      selectedWork: null,
      activeKey: 1
    })
  },

  handleTaskSelect(e) {
    const selectedTask = e.detail
    console.log("selectedTask:",selectedTask)
    this.setData({
      selectedTask: e.detail,
      selectedSection: null,
      selectedDate: null,
      selectedWork: null,
      activeKey: 2
    });
  },

  handleSectionSelect(e) {
    
    const selectedSection = e.detail
    console.log("selectedSection:",selectedSection)
    const works = e.detail.works
    this.setData({
      selectedSection: e.detail,
      works : e.detail.works,
      selectedDate: null,
      selectedWork: null,
      calendarShow:true,
      activeKey: 3,
    });
  },

  handleDateSelect(e) {
    console.log(this.newDateformatDate(e.detail))
    this.setData({
      selectedDate:this.newDateformatDate(e.detail),
      selectedWork: null,
      activeKey: 4
    });
  },
  
  handleBackToProjectSelector(e) {
    const key = e.detail.key
    this.setData({
      activeKey: key,
      selectedTask: null // 重置已选任务
    })
  },
  handleBackToTaskSelector(e) {
    const key = e.detail.key
    this.setData({
      activeKey: key,
      selectedSection: null // 重置已选任务
    })
  },
  handleBackToSectionSelector(e) {
    const key = 2
    this.setData({
      activeKey: key,
      calendarShow: false,
      selectedData: null // 重置已选任务
    })
  },
  handleBackToDataSelector(e) {
    const key = 3
    this.setData({
      activeKey: key,
      selectedWork: null, // 重置已选任务
      calendarShow:true
    })
  },
  handleBackToWorkSelector(e) {
    const key = 4
    this.setData({
      activeKey: key,
      selectedWork: null, // 重置已选任务
      calendarShow:true
    })
  },
  onClose() {
    this.setData({ calendarShow: false });
  },
  newDateformatDate(date) {
    const date1 = new Date();
    return date1
    //return `${date.getMonth() + 1}/${date.getDate()}`;
  },
  /*
  onConfirm(event) {
    this.setData({
      calendarShow: false,
      selectedDate: this.newDateformatDate(event.detail),
      selectedWork: null,
      activeKey: 4,
    });
  },
  */

  async onCellClick(e) {
    const outerIndex = e.currentTarget.dataset.outerIndex; // 获取外层循环的索引
    const innerIndex = e.target.dataset.innerIndex; // 获取内层循环的索引
    console.log(`外层循环索引：${outerIndex}`);
    console.log(`内层循环索引：${innerIndex}`);

        // 构建选择器
        const query = wx.createSelectorQuery();
        // 对当前点击的 van-cell 使用选择器
        query.select(`#cell-${outerIndex}-${innerIndex}`).boundingClientRect();
        
        query.exec((res) => {
          // res 是一个数组，包含了匹配到的节点的信息
          const cellInfo = res[0];
          if (cellInfo) {
            console.log(`位置和尺寸信息:`, cellInfo);
          } else {
            console.log('未找到元素');
          }
        });

    console.log(this.data.works,outerIndex,this.data.works[outerIndex])
    const selectedWork = this.data.works[outerIndex].worksDetail[innerIndex];
    const  selectedworktype =this.data.works[outerIndex];
    console.log("selectedworktype:",selectedworktype.worksType)
    console.log("selectedWork:",selectedWork)
    this.setData({
      selectedWork:  this.data.works[outerIndex].worksDetail[innerIndex],
      selectedworktype:this.data.works[outerIndex],
      activeKey: 5,
    });
    console.log("selectedWork:",selectedWork.workName)
    console.log("selectedworktype:",selectedworktype.worksType)
    // 这里可以将数据传递给下一个页面，先使用JSON.stringify()将数据转换为字符串



    // 在这里执行跳转逻辑,可以使用 wx.navigateTo 等 API
    /*
    wx.navigateTo({
      //传递参数实例  
      // url: '/pages/collectInfo/collectInfo?workInfo=' + workInfo,  
      // url: '/pages/collectInfo/collectInfo?project_id=' + this.data.selectedProject._id + '&task=' + this.data.selectedTask.name + '&section=' + this.data.selectedSection.road + '&data=' + this.data.selectedDate + '&work=' + selectedWork.workName,
      url: '/pages/addInfo/addInfo?workInfo=' + workInfo,
    })
    console.log(`点击了 ${selectedworktype.worksType}-->${selectedWork.workName}`)
    */
  },
  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
  },


  handleButtonTap: async function (event) {
    
    const workInfo = {
    selectedProject: this.data.selectedProject||null,  // 选中的项目
    selectedTask: this.data.selectedTask||null,  // 选中的任务
    selectedSection: this.data.selectedSection||null,  // 选中的路段
    selectedDate: this.data.selectedDate||null,  // 选中的日期
    selectedWork: this.data.selectedWork||null,  // 选中的作业
    selectedworktype: this.data.selectedworktype||null,  // 选中的作业类型
    }; // 从 data 中获取 workInfo
    console.log('创建作业成功', workInfo);
    // 调用云函数创建作业
    try {
      const res = await wx.cloud.callFunction({
        name: 'createWork',
        data: 
        {workInfo},
      });
      console.log('创建工作成功', res.result.data._id);

      if (res.result && res.result.data && res.result.data._id) {
        const newWorks = [...this.data.works_id, res.result.data._id]; // 创建新数组,包含原数组和新 ID
        this.setData({
          works_id: newWorks // 更新 works 数组
        }, () => {
          console.log(this.data.works_id);
        });
        
      } else {
        console.error('创建工作成功,但返回数据无效');
      }
    } catch (err) {
      console.error('创建工作失败', err);
    }
    this.updateRow();
    this.upload(event);
  },
  formatDate(date) {
    const newDate = new Date(date);
    const hour = (newDate.getHours()).toString().padStart(2, '0'); // 补零
    const minute = newDate.getMinutes().toString().padStart(2, '0'); // 补零
    return `${hour}${minute}`;
  },

 updateRow() {
    console.log(this.data.works_id,this.data.works_id.length);
    const worksId = this.data.works_id;
    for (let i = 0; i < worksId.length; i++) {

      wx.cloud.callFunction(
        {
          name: 'getWork',
          data: {
            _id: worksId[i]
          }
        }
      )
        .then(res => {
          console.log("updateRow",res);
          const work = res.result.data[0];
          console.log(work);
          console.log("updateRow",work.selectedTask);
          const formattedDate = this.formatDate(work.selectedDate);
          console.log("updateRow",formattedDate);

          
          const newRow = {
            pureDateString: formattedDate, // 设置 pureDateString 属性
          };
          console.log("updateRow",newRow);
          const rows = [...this.data.rows, newRow];
          console.log("updateRow",rows);


          this.setData({ rows, hidden: false });
          
        })
        .catch(err => {
          console.error("updateRow",err);
        });
    }
  },

/*
  updateRow() {
    const worksId = this.data.works_id;
    if (!Array.isArray(worksId) || worksId.length === 0) {
      console.error('works_id 必须是非空数组');
      return;
    }
  
    const fetchWorkPromises = worksId.map(id =>
      wx.cloud.callFunction({
        name: 'getWork',
        data: { _id: id }
      })
    );
  
    Promise.all(fetchWorkPromises)
      .then(responses => {
        const newRows = responses.map(res => {
          const work = res.result.data;
          const formattedDate = this.formatDate(work.selectedDate);
          return {
            pureDateString: formattedDate
            // 添加其他属性
          };
        });
        this.setData({
          rows: [...this.data.rows, ...newRows],
          hidden: false
        });
      })
      .catch(err => {
        console.error('获取工作信息失败', err);
      });
  },
  */


  upload(e) {
    const index = e.currentTarget.dataset.index;
    const workInfo = {
      selectedProject: this.data.selectedProject||null,  // 选中的项目
      selectedTask: this.data.selectedTask||null,  // 选中的任务
      selectedSection: this.data.selectedSection||null,  // 选中的路段
      selectedDate: this.data.selectedDate||null,  // 选中的日期
      selectedWork: this.data.selectedWork||null,  // 选中的作业
      selectedworktype: this.data.selectedworktype||null,  // 选中的作业类型
      }; 
    wx.navigateTo({
      url: '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(workInfo),
    });
  },
  edit(e) {
    const workInfo = {
      selectedProject: this.data.selectedProject||null,  // 选中的项目
      selectedTask: this.data.selectedTask||null,  // 选中的任务
      selectedSection: this.data.selectedSection||null,  // 选中的路段
      selectedDate: this.data.selectedDate||null,  // 选中的日期
      selectedWork: this.data.selectedWork||null,  // 选中的作业
      selectedworktype: this.data.selectedworktype||null,  // 选中的作业类型
      }; 
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(workInfo),
    });
  },
  delete(e) {
    const index = e.currentTarget.dataset.index;
    const rows = this.data.rows;
    rows.splice(index, 1);
    this.setData({ rows });
  },

});