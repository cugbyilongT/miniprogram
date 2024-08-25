Page({
  data: {
    activeKey: 0, // 当前激活的侧边栏项索引
    projects: [], // 项目列表数据
    filteredProjects: [],
    userAccount: "",
    userRole:"",
    works: [],
    works_id: [],
    activeNames: ['1'],
    sections: [],
    calendarShow: false,
    selectedProject: null, // 选中的项目
    selectedTask: null, // 选中的任务
    selectedSection: null, // 选中的路段
    selectedDate: null, // 选中的日期
    selectedWork: null, // 选中的作业
    selectedworktype: null,
    minDate: "",
    rows: [
    ],
    outerIndex1: 0,
    innerIndex1: 0,
  },

  onLoad() {
    this.setData({
      userAccount:getApp().globalData.userAccount ,
      userRole:getApp().globalData.userRole
    }, () => {
    console.log(this.data.userAccount, this.data.userRole);
    // 在 onLoad 生命周期函数中,将 this 赋值给 pageInstance
    this.getProjects();
    this.setData({ 
      userAccount : getApp().globalData.userAccount,
      rows: [] });
    console.log(this.data.userAccount); // 使用账户信息
    })
    let minDate = new Date(2023, 0, 1).getTime();
    console.log("minDate", minDate);
    this.setData({
      minDate: minDate
    })
  },



  getProjects() {
    wx.cloud.callFunction({
      name: 'getProjects',
    })
      .then(res => {
        //筛选porjeccts
        const userAccount = this.data.userAccount;

        const newProjects = res.result.data.filter(project => {
          const { manager, members } = project;

          return (
            Array.isArray(members) &&
            (members.includes(userAccount) || manager === userAccount)
          );
        });
        // const newProjects = res.result.data.filter(project => {
        //   const members = project.members;
        //   return Array.isArray(members) && members.findIndex(member => member === this.data.userAccount) !== -1;
        // });      
      console.log('获取项目列表成功', newProjects);
      this.setData({
        projects: newProjects,
        filteredProjects: newProjects,
      });
      
        console.log("reeeeeeeeee",newProjects)
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
    console.log("sssssppppp",selectedProject)
  },

  handleTaskSelect(e) {
    const selectedTask = e.detail
    console.log("selectedTask:", selectedTask)
    this.setData({
      selectedTask: e.detail,
      selectedSection: null,
      selectedDate: null,
      selectedWork: null,
      activeKey: 2
    });
    console.log("selectedTask1111:", selectedTask)
  },

  handleSectionSelect(e) {

    const selectedSection = e.detail
    console.log("selectedSection:", selectedSection)
    const works = e.detail.works
    this.setData({
      selectedSection: e.detail,
      works: e.detail.works,
      selectedDate: null,
      selectedWork: null,
      calendarShow: true,
      activeKey: 3,
    });
    console.log("workssssss",works)
  },
  combineDateAndTime(date, time) {
    const datePart = new Date(date);
    const timePart = new Date(time);
  
    const year = datePart.getFullYear();
    const month = (datePart.getMonth() + 1).toString().padStart(2, '0');
    const day = datePart.getDate().toString().padStart(2, '0');
  
    const hours = timePart.getHours().toString().padStart(2, '0');
    const minutes = timePart.getMinutes().toString().padStart(2, '0');
    const seconds = timePart.getSeconds().toString().padStart(2, '0');
  
    const combinedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    return new Date(combinedDate);
  },

  handleDateSelect(e) {
      // 获取当前时间
    const currentTime = new Date();
      // 组合日期和时间
    const selectedDate = this.combineDateAndTime(e.detail, currentTime);
    console.log("Combined selectedDate", selectedDate);
    this.setData({
      selectedDate: selectedDate,
      // selectedDate: this.getDate(e.detail),
      selectedWork: null,
      activeKey: 4,

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
      calendarShow: true
    })
  },
  handleBackToWorkSelector(e) {
    const key = 4
    this.setData({
      activeKey: key,
      selectedWork: null, // 重置已选任务
      calendarShow: true
    })
  },
  onClose() {
    this.setData({ calendarShow: false });
  },
  getDate() {
    const date1 = new Date();
    return date1
    //return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  formatDatetoMonthDay(dataInfo) {
    const date = new Date(dataInfo);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },
 

  async onCellClick(e) {
    const outerIndex = e.currentTarget.dataset.outerIndex; // 获取外层循环的索引
    const innerIndex = e.target.dataset.innerIndex; // 获取内层循环的索引
    console.log(`外层循环索引：${outerIndex}`);
    console.log(`内层循环索引：${innerIndex}`);
    this.setData({
      outerIndex1:outerIndex,
      innerIndex1:innerIndex,
    });
    console.log("outerIndex1:", this.data.outerIndex1), console.log("innerIndex1:", this.data.innerIndex1);

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
    
    const selectedWork = this.data.works[outerIndex].worksDetail[innerIndex];
    const selectedworktype = this.data.works[outerIndex];
    this.setData({
      selectedWork: this.data.works[outerIndex].worksDetail[innerIndex],
      selectedworktype: this.data.works[outerIndex],
      activeKey: 5,
    });
    this.getWorksBysectionId();
  },
  async getWorksBysectionId() {
    
    const rows = []
    const works_id = []
    this.setData({
      rows: [],
      works_id: [],
    });
    const DateMouthDay = this.formatDatetoMonthDay(this.data.selectedDate);
    console.log(this.data.selectedProject._id);
    const res = await wx.cloud.callFunction({
      name: 'getWorksBySection',
      data: {
        Project_id:this.data.selectedProject._id,
        Task:this.data.selectedTask.name,
        Section:this.data.selectedSection.road,
        DateMouthDay:DateMouthDay,
        Work:this.data.selectedWork.workName,
      }
      })
      .then(res => {
        console.log('获取作业列表成功', res.result.data)
        
        console.log(this.data.userRole)
        if (this.data.userRole === "fieldWorker") {
          
          const newWorks = res.result.data.filter(work => {
            const workName = work.Workername;
            const hasUserInWorks = workName === this.data.userAccount;
            console.log("workName:", workName);
            console.log("hasUserInWorks:", hasUserInWorks);
            return  hasUserInWorks;
          });
          res.result.data = newWorks;
        }
        const works = res.result.data;
        console.log("works:", works);
        if (works.length === 0) {
          console.log("没有作业")
          return
        }
        works.forEach(work => {
          const row = {
            pureDateString: this.formatDatetoHourMinute(work.Date), // 设置 pureDateString 属性
            work: work._id,
            startWell:work.startWell,
            endWell:work.endWell,
          };
          rows.push(row);
          works_id.push(work._id)
        })
        this.setData({
          rows,
          works_id,
        })
      })
      .catch(err => {
        console.error('获取作业列表失败', err)
      })
  },
  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
    console.log("eeeeee",event.detail);

  },

  createNewWork: async function (event) {
    console.log("createNewWork",this.data.selectedDate);
    const now = new Date();
    //修改 日期来源  
    const DateMouthDay = this.formatDatetoMonthDay(this.data.selectedDate); 
    console.log("DateMouthDay",DateMouthDay)
    const formattedDate = this.formatDatetoHourMinute(now);
    console.log("formattedDate",formattedDate)
    const workInfo = {
      Project_id: this.data.selectedProject._id || null,  // 选中的项目
      Project:this.data.selectedProject.name||null,  //   选中的项目
      Task: this.data.selectedTask.name || null,  // 选中的任务
      Section: this.data.selectedSection.road || null,  // 选中的路段  
      Date: this.data.selectedDate || null,  // 选中的日期
      DateMouthDay: DateMouthDay,  // 日期月日
      Work: this.data.selectedWork.workName || null,  // 选中的作业
      Workername: this.data.userAccount,  // 当前用户
      pureDateString:formattedDate || null,  // 时间戳
    }; // 从 data 中获取 workInfo

    console.log('创建作业成功', workInfo);
    console.log("outerIndex123232:", this.data.outerIndex1), console.log("innerIndex132323:", this.data.innerIndex1);
    // 调用云函数创建作业
    try {
      const res = await wx.cloud.callFunction({ // 调用云函数 createWork
        name: 'createWork',
        data:
          { workInfo },
      });
      const newWorkId = res.result.data._id;
      console.log('创建工作成功', newWorkId);
      if (res.result && res.result.data && res.result.data._id) {
        const newWorks = [...this.data.works_id, newWorkId]; // 创建新数组,包含原数组和新 ID
        this.setData({
          works_id: newWorks // 更新 works 数组
        }, () => {
          console.log(this.data.works_id);
        });
        //更新rows数组
       
        const newRow = {
          pureDateString: formattedDate, // 设置 pureDateString 属性
          work: newWorkId, // 设置 work 属性
        };
        
        const Rows = [...this.data.rows, newRow];
        this.setData({ rows: Rows });
        console.log("update newRow ", this.data.rows);
        //传输数据到采集信息页面
        workInfo._id = newWorkId;

      // 判断外层和内层循环索引来选择导航的页面
      //let targetUrl = '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(workInfo);
      let targetUrl =  '/pages/ledger/ledger?workInfo=' + JSON.stringify(workInfo);
      //if (this.data.outerIndex1 === 4 && this.data.innerIndex1 === 3) {
      //  targetUrl = '/pages/ledger/ledger?workInfo=' + JSON.stringify(workInfo);
      //}
      wx.navigateTo({
        url: targetUrl,
      });
        /*wx.navigateTo({
          url: '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(workInfo),
        });*/
      } else {
        console.error('创建工作成功,但返回数据无效');
      }
    } catch (err) {
      console.error('创建工作失败', err);
    }
  },
  formatDatetoHourMinute(dateInfo) {
    const newDate = new Date(dateInfo);
    console.log("newDate", newDate);
    const hour = (newDate.getHours()).toString().padStart(2, '0'); // 补零
    console.log("hour", hour);
    const minute = newDate.getMinutes().toString().padStart(2, '0'); // 补零
    console.log("minute", minute);
    return `${hour}:${minute}`;
  },

  editWork(e) {
    const workId = e.target.dataset.workid;
    console.log("edit workId:", workId);
    const workInfo = {
      _id: workId,
    }; // 从 data 中获取 workInfo

    console.log("edit workInfo:", workInfo);

          // 判断外层和内层循环索引来选择导航的页面
    let targetUrl = '/pages/ledger/ledger?workInfo=' + JSON.stringify(workInfo);

    if (this.data.outerIndex1 === 4 && this.data.innerIndex1 === 3) {
      targetUrl = '/pages/ledger/ledger?workInfo=' + JSON.stringify(workInfo);
      }
    wx.navigateTo({
        url: targetUrl,
    });
    /*wx.navigateTo({
      url: '/pages/collectInfo/collectInfo?workInfo=' + JSON.stringify(workInfo),
    });*/
  },

  deleteWork(e) {
    const workId = e.target.dataset.workid;
    console.log("delete workId:", workId);
    wx.showModal({
      title: '提示',
      content: '确定删除该作业吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'deleteWork',
            data: {
              _id: workId,
            },
          })
            .then(res => {
              console.log('删除作业成功', res.result.data);
              const works_id = this.data.works_id.filter(work => work !== workId);
              const rows = this.data.rows.filter(row => row.work !== workId);
              console.log("works_id:", works_id);
              console.log("rows:", rows);
              this.setData({
                works_id,
                rows,rows,
              });
            })
            .catch(err => {
              console.error('删除作业失败', err);
            });
        } else if (res.cancel) {
          console.log('取消删除作业');
        }
      }
    },);
  },


});