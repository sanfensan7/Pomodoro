Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    achievement: {
      type: Object,
      value: {}
    }
  },

  data: {
    rarityText: '',
    difficultyText: ''
  },

  observers: {
    'achievement': function(achievement) {
      if (achievement && achievement.rarity) {
        this.setData({
          rarityText: this.getRarityText(achievement.rarity),
          difficultyText: this.getDifficultyText(achievement.difficulty)
        });
      }
    }
  },

  methods: {
    hideUnlock: function() {
      this.setData({ show: false });
      this.triggerEvent('hide');
    },

    getRarityText: function(rarity) {
      var rarityMap = {
        'common': '普通',
        'uncommon': '稀有',
        'rare': '史诗',
        'epic': '传说',
        'legendary': '神话'
      };
      return rarityMap[rarity] || '未知';
    },

    getDifficultyText: function(difficulty) {
      var difficultyMap = {
        'bronze': '青铜',
        'silver': '白银',
        'gold': '黄金',
        'diamond': '钻石',
        'mythic': '神话'
      };
      return difficultyMap[difficulty] || '未知';
    }
  },

  lifetimes: {
    attached: function() {
      // 组件初始化
    }
  }
});
