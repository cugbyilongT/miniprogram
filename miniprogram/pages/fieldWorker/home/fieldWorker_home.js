Page({
  data: {
    activeKey: 0, // 当前激活的侧边栏项索引
    projects: [], // 项目列表数据
    filteredProjects:[],
    works:[],
    activeNames: ['1'],
    sections:[],
    calendarShow:false,
    selectedProject: null, // 选中的项目
    selectedTask: null, // 选中的任务
    selectedSection: null, // 选中的路段
    selectedDate: null, // 选中的日期
    selectedWork: null, // 选中的作业
    selectedworktype: null,
  },

  onLoad() {
    this.getProjects();

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
    console.log(this.formatDate(e.detail))
    this.setData({
      selectedDate:this.formatDate(e.detail),
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
  onClose() {
    this.setData({ calendarShow: false });
  },
  formatDate(date) {
    date = new Date(date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },
  onConfirm(event) {
    this.setData({
      calendarShow: false,
      selectedDate: this.formatDate(event.detail),
      selectedWork: null,
      activeKey: 4,
    });
  },

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
      activeKey: 4,
    });
    // 这里可以将数据传递给下一个页面，先使用JSON.stringify()将数据转换为字符串

    const workInfo = JSON.stringify({
      project_id: this.data.selectedProject._id,
      task: this.data.selectedTask.name,
      section: this.data.selectedSection.road,
      work_time: this.data.selectedDate,
      work: selectedWork.workName,
      type:selectedworktype.worksType,
     })
     console.log("workInfo:",workInfo)
    // 在这里执行跳转逻辑,可以使用 wx.navigateTo 等 API
    wx.navigateTo({
      //传递参数实例  
      // url: '/pages/collectInfo/collectInfo?workInfo=' + workInfo,  
      // url: '/pages/collectInfo/collectInfo?project_id=' + this.data.selectedProject._id + '&task=' + this.data.selectedTask.name + '&section=' + this.data.selectedSection.road + '&data=' + this.data.selectedDate + '&work=' + selectedWork.workName,
      url: '/pages/addInfo/addInfo?workInfo=' + workInfo,
    })
    console.log(`点击了 ${selectedworktype.worksType}-->${selectedWork.workName}`)
  },
  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
  },
});