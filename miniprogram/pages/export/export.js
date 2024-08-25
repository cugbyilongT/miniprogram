// 在 page 的 js 文件中
Page({
    data: {
        dropdowns: [
            {
              label: '项目名称',
              placeholder: '请输入项目名称',
              options: ['项目A', '项目B', '项目C'], // 假设的选项
              inputValue: '',
              showDropdown: false
            },
            {
              label: '道路名称',
              placeholder: '请输入道路名称',
              options: ['道路1', '道路2', '道路3'], // 假设的选项
              inputValue: '',
              showDropdown: false
            },
            {
              label: '日期',
              placeholder: '请选择日期',
              options: [], // 日期通常由日期选择器提供
              inputValue: '',
              showDropdown: false
            },
            {
              label: '作业内容',
              placeholder: '请输入作业内容',
              options: ['作业内容1', '作业内容2', '作业内容3'], // 假设的选项
              inputValue: '',
              showDropdown: false
            },
            {
              label: '班组',
              placeholder: '请输入班组',
              options: ['班组1', '班组2', '班组3'], // 假设的选项
              inputValue: '',
              showDropdown: false
            }
          ]
    },
  
    // 输入事件处理
    onInput(event) {
      const { field } = event.currentTarget.dataset;
      this.setData({
        [`dropdownData.${field}.value`]: event.detail.value
      });
    },
  
    // 聚焦事件处理
    onFocus(event) {
      const { field } = event.currentTarget.dataset;
      // 可以设置其他的下拉框隐藏
      Object.keys(this.data.dropdownData).forEach(key => {
        this.setData({
          [`dropdownData.${key}.show`]: false
        });
      });
      // 显示当前的下拉框
      this.setData({
        [`dropdownData.${field}.show`]: true
      });
    },
  
    // 选择选项事件处理
    onSelect(event) {
      const { field, option } = event.currentTarget.dataset;
      this.setData({
        [`dropdownData.${field}.value`]: option,
        [`dropdownData.${field}.show`]: false
      });
    },
  
    // 失去焦点事件处理
    onBlur(event) {
      const { field } = event.currentTarget.dataset;
      setTimeout(() => { // 延时确保可以选择选项
        this.setData({
          [`dropdownData.${field}.show`]: false
        });
      }, 300);
    }
  });