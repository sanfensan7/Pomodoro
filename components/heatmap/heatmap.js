Component({
  properties: {
    // 数据源：{ date: 'YYYY-MM-DD', count: number, details?: any }[]
    data: {
      type: Array,
      value: []
    },
    // 标题
    title: {
      type: String,
      value: '活动热力图'
    },
    // 副标题
    subtitle: {
      type: String,
      value: ''
    },
    // 单位
    unit: {
      type: String,
      value: '次'
    },
    // 是否显示统计信息
    showStats: {
      type: Boolean,
      value: true
    },
    // 主题色
    themeColor: {
      type: String,
      value: '#40c463'
    },
    // 显示的周数（默认显示最近52周）
    weeks: {
      type: Number,
      value: 52
    }
  },

  data: {
    weeks: [],
    monthLabels: [],
    weekLabels: ['', '一', '', '三', '', '五', ''],
    legendColors: [],
    stats: {
      totalDays: 0,
      activeDays: 0,
      totalCount: 0,
      maxStreak: 0
    }
  },

  observers: {
    'data, themeColor, weeks': function(data, themeColor, weeks) {
      this.generateHeatmap();
    }
  },

  methods: {
    generateHeatmap() {
      const { data, themeColor, weeks } = this.properties;
      
      // 生成颜色等级
      const colors = this.generateColors(themeColor);
      this.setData({ legendColors: colors });
      
      // 计算日期范围
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (weeks * 7 - 1));
      
      // 创建数据映射
      const dataMap = {};
      data.forEach(item => {
        dataMap[item.date] = item;
      });
      
      // 生成周数据
      const weeksData = [];
      const monthLabels = [];
      let currentDate = new Date(startDate);
      
      // 调整到周一开始
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentDate.setDate(currentDate.getDate() - daysToMonday);
      
      for (let week = 0; week < weeks; week++) {
        const weekData = [];
        
        for (let day = 0; day < 7; day++) {
          const dateStr = this.formatDate(currentDate);
          const dayData = dataMap[dateStr] || { date: dateStr, count: 0 };
          
          // 检查是否是今天
          const today = this.formatDate(new Date());
          const isToday = dateStr === today;
          
          // 计算颜色
          const colorInfo = this.getColorForCount(dayData.count, colors);
          
          weekData.push({
            date: dateStr,
            count: dayData.count,
            details: dayData.details,
            color: colorInfo.color,
            borderColor: colorInfo.borderColor,
            isToday
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        weeksData.push(weekData);
        
        // 生成月份标签
        if (week % 4 === 0 || week === weeks - 1) {
          const monthDate = new Date(weekData[0].date);
          monthLabels.push(this.getMonthLabel(monthDate));
        } else {
          monthLabels.push('');
        }
      }
      
      // 计算统计信息
      const stats = this.calculateStats(data);
      
      this.setData({
        weeks: weeksData,
        monthLabels,
        stats
      });
    },

    generateColors(themeColor) {
      // 基于主题色生成5个等级的颜色
      const baseColor = this.hexToRgb(themeColor);
      return [
        '#ebedf0', // 0级 - 灰色
        this.rgbToHex(baseColor.r + 100, baseColor.g + 100, baseColor.b + 100), // 1级 - 很浅
        this.rgbToHex(baseColor.r + 50, baseColor.g + 50, baseColor.b + 50),   // 2级 - 浅
        themeColor, // 3级 - 原色
        this.rgbToHex(Math.max(0, baseColor.r - 30), Math.max(0, baseColor.g - 30), Math.max(0, baseColor.b - 30)) // 4级 - 深
      ];
    },

    getColorForCount(count, colors) {
      let level = 0;
      if (count > 0) {
        if (count >= 10) level = 4;
        else if (count >= 6) level = 3;
        else if (count >= 3) level = 2;
        else level = 1;
      }
      
      return {
        color: colors[level],
        borderColor: level > 0 ? colors[level] : '#e1e4e8'
      };
    },

    calculateStats(data) {
      const totalCount = data.reduce((sum, item) => sum + item.count, 0);
      const activeDays = data.filter(item => item.count > 0).length;
      
      // 计算最长连续天数
      let maxStreak = 0;
      let currentStreak = 0;
      
      // 按日期排序
      const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      for (let i = 0; i < sortedData.length; i++) {
        if (sortedData[i].count > 0) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      
      return {
        totalDays: this.properties.weeks * 7,
        activeDays,
        totalCount,
        maxStreak
      };
    },

    onDayTap(e) {
      const { date, count, details } = e.currentTarget.dataset;
      
      this.triggerEvent('dayTap', {
        date,
        count,
        details
      });
      
      // 显示详情
      if (count > 0) {
        wx.showModal({
          title: date,
          content: `${this.properties.unit}数: ${count}`,
          showCancel: false
        });
      }
    },

    // 工具方法
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    getMonthLabel(date) {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      return months[date.getMonth()];
    },

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 107, b: 107 };
    },

    rgbToHex(r, g, b) {
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
  }
});
