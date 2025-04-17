const fs = wx.getFileSystemManager();

// 需要转换的图标列表
const icons = [
  'clock',
  'clock-active',
  'task',
  'task-active',
  'stats',
  'stats-active',
  'settings',
  'settings-active'
];

// 从base64转为PNG文件
function convertSvgToPng() {
  // 确保images目录存在
  try {
    fs.accessSync('images');
  } catch (e) {
    try {
      fs.mkdirSync('images', true);
    } catch (mkdirErr) {
      console.error('创建images目录失败:', mkdirErr);
      // 目录可能已存在但权限不足，或者其他原因
    }
  }
  
  // 逐个转换图标
  let successCount = 0;
  
  icons.forEach(icon => {
    try {
      // 导入svg base64
      const base64Data = require(`../images/${icon}.png.js`);
      
      // 去掉data:image/svg+xml;base64,前缀
      const base64Content = base64Data.split(',')[1];
      
      if (!base64Content) {
        console.error(`${icon}.png base64内容为空`);
        return;
      }
      
      // 尝试使用不同的路径格式
      tryWriteFile(icon, base64Content, successCount);
      
    } catch (e) {
      console.error(`转换 ${icon}.png 时出错:`, e);
    }
  });
  
  return successCount;
}

// 尝试不同的写入方式
function tryWriteFile(icon, base64Content, successCount) {
  // 方式1: 使用相对路径
  fs.writeFile({
    filePath: `images/${icon}.png`,
    data: base64Content,
    encoding: 'base64',
    success: function() {
      console.log(`${icon}.png 创建成功(相对路径)`);
      successCount++;
    },
    fail: function(err) {
      console.error(`${icon}.png 创建失败(相对路径)`, err);
      
      // 方式2: 使用绝对路径
      const currentPath = wx.env.USER_DATA_PATH;
      fs.writeFile({
        filePath: `${currentPath}/images/${icon}.png`,
        data: base64Content,
        encoding: 'base64',
        success: function() {
          console.log(`${icon}.png 创建成功(绝对路径)`);
          successCount++;
          
          // 复制到项目目录
          try {
            fs.copyFile({
              srcPath: `${currentPath}/images/${icon}.png`,
              destPath: `images/${icon}.png`,
              success: function() {
                console.log(`复制 ${icon}.png 成功`);
              },
              fail: function(copyErr) {
                console.error(`复制 ${icon}.png 失败`, copyErr);
              }
            });
          } catch (copyErr) {
            console.error(`复制过程出错:`, copyErr);
          }
        },
        fail: function(err2) {
          console.error(`${icon}.png 创建失败(绝对路径)`, err2);
        }
      });
    }
  });
}

// 使用临时文件方法转换一个
function convertOneIcon(iconName) {
  try {
    // 导入svg base64
    const base64Data = require(`../images/${iconName}.png.js`);
    
    // 去掉data:image/svg+xml;base64,前缀
    const base64Content = base64Data.split(',')[1];
    
    // 先写入临时文件
    const tempFilePath = `${wx.env.USER_DATA_PATH}/${iconName}_temp.png`;
    
    fs.writeFileSync(
      tempFilePath,
      base64Content,
      'base64'
    );
    
    // 再从临时文件复制到目标位置
    fs.copyFileSync(
      tempFilePath,
      `images/${iconName}.png`
    );
    
    // 删除临时文件
    fs.unlinkSync(tempFilePath);
    
    return true;
  } catch (e) {
    console.error(`手动转换 ${iconName}.png 时出错:`, e);
    return false;
  }
}

module.exports = {
  convertSvgToPng,
  convertOneIcon
}; 