const MistakeManager = require('../../utils/mistake-manager');

Page({
  data: {
    themeColor: '#ff6b6b',
    subjects: [],
    showAddDialog: false,
    showEditDialog: false,
    editingSubject: null,
    newSubject: {
      name: '',
      color: '#ff6b6b',
      chapters: []
    },
    colorOptions: [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
      '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
    ],
    newChapter: '',
    showChapterInput: false
  },

  onLoad: function() {
    try {
      console.log('科目管理页面加载中...');
      this.mistakeManager = new MistakeManager();
      console.log('MistakeManager 初始化完成');
      this.loadTheme();
      this.loadSubjects();
    } catch (error) {
      console.error('页面加载失败:', error);
    }
  },

  onShow: function() {
    // 页面显示时刷新数据
    if (this.mistakeManager) {
      this.loadSubjects();
    }
  },

  loadTheme: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({ themeColor });
  },

  loadSubjects: function() {
    try {
      console.log('加载科目列表...');
      const subjects = this.mistakeManager.getSubjects();
      console.log('获取到的科目:', subjects);
      this.setData({ subjects });
    } catch (error) {
      console.error('加载科目失败:', error);
    }
  },

  // 显示添加科目对话框
  showAddSubject: function() {
    this.setData({
      showAddDialog: true,
      newSubject: {
        name: '',
        color: this.data.colorOptions[0],
        chapters: []
      }
    });
  },

  // 隐藏添加科目对话框
  hideAddDialog: function() {
    this.setData({ showAddDialog: false });
  },

  // 显示编辑科目对话框
  showEditSubject: function(e) {
    const index = e.currentTarget.dataset.index;
    const subject = this.data.subjects[index];

    this.setData({
      showEditDialog: true,
      editingSubject: { ...subject, index }
    });
  },

  // 隐藏编辑科目对话框
  hideEditDialog: function() {
    this.setData({ showEditDialog: false, editingSubject: null });
  },

  // 科目名称输入
  onSubjectNameInput: function(e) {
    let value = e.detail.value;

    // 限制科目名称长度，截断超出部分
    if (value.length > 10) {
      value = value.substring(0, 10);
      wx.showToast({
        title: '科目名称最多10个字符',
        icon: 'none',
        duration: 1000
      });
    }

    if (this.data.showEditDialog) {
      this.setData({
        'editingSubject.name': value
      });
    } else {
      this.setData({
        'newSubject.name': value
      });
    }
  },

  // 选择科目颜色
  selectColor: function(e) {
    const color = e.currentTarget.dataset.color;
    if (this.data.showEditDialog) {
      this.setData({
        'editingSubject.color': color
      });
    } else {
      this.setData({
        'newSubject.color': color
      });
    }
  },

  // 显示章节输入
  showChapterInput: function() {
    this.setData({ showChapterInput: true });
  },

  // 隐藏章节输入
  hideChapterInput: function() {
    this.setData({ showChapterInput: false, newChapter: '' });
  },

  // 章节输入
  onChapterInput: function(e) {
    let value = e.detail.value;

    // 限制章节名称长度，截断超出部分
    if (value.length > 15) {
      value = value.substring(0, 15);
      wx.showToast({
        title: '章节名称最多15个字符',
        icon: 'none',
        duration: 1000
      });
    }

    this.setData({ newChapter: value });
  },

  // 添加章节
  addChapter: function() {
    const chapter = this.data.newChapter.trim();
    if (!chapter) return;

    if (this.data.showEditDialog) {
      const chapters = [...this.data.editingSubject.chapters];
      if (!chapters.includes(chapter)) {
        chapters.push(chapter);
        this.setData({
          'editingSubject.chapters': chapters
        });
      }
    } else {
      const chapters = [...this.data.newSubject.chapters];
      if (!chapters.includes(chapter)) {
        chapters.push(chapter);
        this.setData({
          'newSubject.chapters': chapters
        });
      }
    }

    this.setData({ newChapter: '', showChapterInput: false });
  },

  // 删除章节
  removeChapter: function(e) {
    const index = e.currentTarget.dataset.index;

    if (this.data.showEditDialog) {
      const chapters = [...this.data.editingSubject.chapters];
      chapters.splice(index, 1);
      this.setData({
        'editingSubject.chapters': chapters
      });
    } else {
      const chapters = [...this.data.newSubject.chapters];
      chapters.splice(index, 1);
      this.setData({
        'newSubject.chapters': chapters
      });
    }
  },

  // 保存新科目
  saveNewSubject: function() {
    try {
      console.log('开始保存新科目');
      const subject = this.data.newSubject;
      console.log('新科目数据:', subject);

      if (!subject.name.trim()) {
        wx.showToast({
          title: '请输入科目名称',
          icon: 'none'
        });
        return;
      }

      // 检查科目名称是否重复
      const exists = this.data.subjects.some(s => s.name === subject.name.trim());
      if (exists) {
        wx.showToast({
          title: '科目名称已存在',
          icon: 'none'
        });
        return;
      }

      // 检查 mistakeManager 是否存在
      if (!this.mistakeManager) {
        console.error('mistakeManager 未初始化');
        this.mistakeManager = new MistakeManager();
      }

      const subjects = [...this.data.subjects];
      const newSubject = {
        id: 'subject_' + Date.now(),
        name: subject.name.trim(),
        color: subject.color,
        chapters: subject.chapters || []
      };

      console.log('准备添加的科目:', newSubject);
      subjects.push(newSubject);
      console.log('更新后的科目列表:', subjects);

      const saveResult = this.mistakeManager.saveSubjects(subjects);
      console.log('保存结果:', saveResult);

      if (saveResult) {
        // 重新加载科目列表以确保数据同步
        this.loadSubjects();
        this.hideAddDialog();
        // 重置新科目表单
        this.setData({
          newSubject: {
            name: '',
            color: this.data.colorOptions[0],
            chapters: []
          }
        });
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '添加失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('保存新科目时发生错误:', error);
      wx.showToast({
        title: '保存失败: ' + error.message,
        icon: 'none'
      });
    }
  },

  // 保存编辑的科目
  saveEditSubject: function() {
    try {
      console.log('开始保存编辑的科目');
      const editingSubject = this.data.editingSubject;
      console.log('编辑的科目数据:', editingSubject);

      if (!editingSubject.name.trim()) {
        wx.showToast({
          title: '请输入科目名称',
          icon: 'none'
        });
        return;
      }

      // 检查科目名称是否与其他科目重复
      const exists = this.data.subjects.some((s, index) =>
        s.name === editingSubject.name.trim() && index !== editingSubject.index
      );
      if (exists) {
        wx.showToast({
          title: '科目名称已存在',
          icon: 'none'
        });
        return;
      }

      // 检查 mistakeManager 是否存在
      if (!this.mistakeManager) {
        console.error('mistakeManager 未初始化');
        this.mistakeManager = new MistakeManager();
      }

      const subjects = [...this.data.subjects];
      subjects[editingSubject.index] = {
        id: editingSubject.id,
        name: editingSubject.name.trim(),
        color: editingSubject.color,
        chapters: editingSubject.chapters || []
      };

      console.log('更新后的科目列表:', subjects);
      const saveResult = this.mistakeManager.saveSubjects(subjects);
      console.log('保存结果:', saveResult);

      if (saveResult) {
        // 重新加载科目列表以确保数据同步
        this.loadSubjects();
        this.hideEditDialog();
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('保存编辑科目时发生错误:', error);
      wx.showToast({
        title: '保存失败: ' + error.message,
        icon: 'none'
      });
    }
  },

  // 删除科目
  deleteSubject: function(e) {
    try {
      console.log('开始删除科目');
      const index = e.currentTarget.dataset.index;
      const subject = this.data.subjects[index];
      console.log('要删除的科目:', subject);
      const self = this;

      // 检查 mistakeManager 是否存在
      if (!this.mistakeManager) {
        console.error('mistakeManager 未初始化');
        this.mistakeManager = new MistakeManager();
      }

      // 检查是否有错题使用该科目
      const mistakes = this.mistakeManager.getAllMistakes();
      const hasRelatedMistakes = mistakes.some(m => m.subject === subject.name);
      console.log('相关错题数量:', mistakes.filter(m => m.subject === subject.name).length);

      if (hasRelatedMistakes) {
        wx.showModal({
          title: '无法删除',
          content: '该科目下还有错题记录，请先删除相关错题后再删除科目。',
          showCancel: false
        });
        return;
      }

      wx.showModal({
        title: '确认删除',
        content: `确定要删除科目"${subject.name}"吗？`,
        success: function(res) {
          if (res.confirm) {
            try {
              const subjects = [...self.data.subjects];
              subjects.splice(index, 1);
              console.log('删除后的科目列表:', subjects);

              const saveResult = self.mistakeManager.saveSubjects(subjects);
              console.log('删除保存结果:', saveResult);

              if (saveResult) {
                // 重新加载科目列表
                self.loadSubjects();
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'error'
                });
              }
            } catch (error) {
              console.error('删除科目时发生错误:', error);
              wx.showToast({
                title: '删除失败: ' + error.message,
                icon: 'none'
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('删除科目操作失败:', error);
      wx.showToast({
        title: '操作失败: ' + error.message,
        icon: 'none'
      });
    }
  },

  // 重置为默认科目
  resetToDefault: function() {
    try {
      console.log('开始重置为默认科目');
      const self = this;

      wx.showModal({
        title: '确认重置',
        content: '确定要重置为默认科目配置吗？这将删除所有自定义科目。',
        success: function(res) {
          if (res.confirm) {
            try {
              // 检查 mistakeManager 是否存在
              if (!self.mistakeManager) {
                console.error('mistakeManager 未初始化');
                self.mistakeManager = new MistakeManager();
              }

              const defaultSubjects = [
                { id: 'math', name: '数学', color: '#ff6b6b', chapters: ['高等数学', '线性代数', '概率论'] },
                { id: 'english', name: '英语', color: '#4ecdc4', chapters: ['阅读理解', '完形填空', '翻译', '作文'] },
                { id: 'politics', name: '政治', color: '#45b7d1', chapters: ['马原', '毛概', '史纲', '思修'] },
                { id: 'professional', name: '专业课', color: '#96ceb4', chapters: ['专业基础', '专业综合'] }
              ];

              console.log('默认科目配置:', defaultSubjects);
              const saveResult = self.mistakeManager.saveSubjects(defaultSubjects);
              console.log('重置保存结果:', saveResult);

              if (saveResult) {
                // 重新加载科目列表
                self.loadSubjects();
                wx.showToast({
                  title: '重置成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '重置失败',
                  icon: 'error'
                });
              }
            } catch (error) {
              console.error('重置科目时发生错误:', error);
              wx.showToast({
                title: '重置失败: ' + error.message,
                icon: 'none'
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('重置操作失败:', error);
      wx.showToast({
        title: '操作失败: ' + error.message,
        icon: 'none'
      });
    }
  },

  // 导出科目配置
  exportSubjects: function() {
    try {
      console.log('开始导出科目配置');
      const subjects = this.data.subjects;
      const exportData = {
        subjects: subjects,
        exportTime: new Date().toISOString(),
        version: '1.0'
      };

      wx.setClipboardData({
        data: JSON.stringify(exportData),
        success: function() {
          wx.showToast({
            title: '科目配置已复制到剪贴板',
            icon: 'success'
          });
        },
        fail: function() {
          wx.showToast({
            title: '导出失败',
            icon: 'error'
          });
        }
      });
    } catch (error) {
      console.error('导出科目配置失败:', error);
      wx.showToast({
        title: '导出失败: ' + error.message,
        icon: 'none'
      });
    }
  },

  // 导入科目配置
  importSubjects: function() {
    const self = this;
    wx.showModal({
      title: '导入科目配置',
      content: '请确保已将科目配置数据复制到剪贴板',
      success: function(res) {
        if (res.confirm) {
          wx.getClipboardData({
            success: function(clipRes) {
              try {
                const importData = JSON.parse(clipRes.data);
                if (importData.subjects && Array.isArray(importData.subjects)) {
                  // 验证数据格式
                  const isValid = importData.subjects.every(subject =>
                    subject.id && subject.name && subject.color && Array.isArray(subject.chapters)
                  );

                  if (isValid) {
                    const saveResult = self.mistakeManager.saveSubjects(importData.subjects);
                    if (saveResult) {
                      self.loadSubjects();
                      wx.showToast({
                        title: '导入成功',
                        icon: 'success'
                      });
                    } else {
                      wx.showToast({
                        title: '保存失败',
                        icon: 'error'
                      });
                    }
                  } else {
                    wx.showToast({
                      title: '数据格式不正确',
                      icon: 'none'
                    });
                  }
                } else {
                  wx.showToast({
                    title: '数据格式不正确',
                    icon: 'none'
                  });
                }
              } catch (error) {
                console.error('解析导入数据失败:', error);
                wx.showToast({
                  title: '数据格式错误',
                  icon: 'none'
                });
              }
            },
            fail: function() {
              wx.showToast({
                title: '读取剪贴板失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
});