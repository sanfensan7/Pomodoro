const fs = require('fs');
const path = require('path');

// 确保images目录存在
const imagesDir = path.join(__dirname, '../images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// 基本的SVG图标数据
const icons = {
  play: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5v14l11-7z" fill="currentColor"/>
  </svg>`,
  
  pause: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
  </svg>`,
  
  reset: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
  </svg>`,

  back: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
  </svg>`
};

// 将SVG转换为PNG并保存
const sharp = require('sharp');

async function createIcon(name, color = '#000000') {
  const svg = icons[name].replace('currentColor', color);
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(48, 48)
    .png()
    .toBuffer();
  
  fs.writeFileSync(path.join(imagesDir, `${name}.png`), pngBuffer);
  console.log(`Created ${name}.png`);
}

async function createAllIcons() {
  try {
    for (const [name] of Object.entries(icons)) {
      await createIcon(name);
    }
    console.log('All icons created successfully');
  } catch (error) {
    console.error('Error creating icons:', error);
  }
}

createAllIcons(); 