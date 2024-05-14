// 图片转化压缩
const fs = require('fs');
const path = require('path');
const resolve = path.resolve;
const sharp = require('sharp');

// 配置项
const config = {
  inputDir: resolve(__dirname, './input'),
  outputDir: resolve(__dirname, './output'),
  // sharp的配置选项，优先考虑无损压缩
  sharpOptions: {
    // 对于JPEG和PNG，使用较高质量以接近无损效果
    jpeg: { quality: 80 },
    png: { quality: 100 },
    // 对于WebP，直接使用无损压缩
    webp: { lossless: false }
  }
};

// 确保输出目录存在
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir);
}

// 新增函数用于处理未转换的文件，如.gif，通过直接复制文件
function handleUnprocessedFiles(filePath, outputPathBase) {
  try {
    fs.copyFileSync(filePath, outputPathBase);
    console.log(`Copied: ${filePath} -> ${outputPathBase}`);
  } catch (err) {
    console.error(`Error copying file: ${err}`);
  }
}

// 递归遍历目录中的文件
function processFiles(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) throw err;

    files.forEach((file) => {
      const filePath = path.join(dir, file.name);
      const outputPathBase = path.join(config.outputDir, path.basename(filePath));

      if (file.isDirectory()) {
        if (!fs.existsSync(path.join(config.outputDir, file.name))) {
          fs.mkdirSync(path.join(config.outputDir, file.name));
        }
        processFiles(filePath);
      } else {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.gif') {
          // 处理未转换的GIF文件
          handleUnprocessedFiles(filePath, outputPathBase);
        } else {
          let outputFormat = 'webp';
          let outputFilePath = outputPathBase + '.webp';

          // 对于已经是WebP的文件，直接处理，不更改输出路径
          if (ext === '.webp') {
            outputFilePath = outputPathBase;
          } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            // 其他格式转换为WebP
            outputFilePath = outputPathBase.replace(new RegExp(ext + '$'), '.webp');
          } else {
            console.log(`Unsupported file type: ${filePath}`);
            return;
          }

          // 根据文件类型选择压缩配置
          let pipelineOptions = config.sharpOptions[ext.slice(1)];
          if (!pipelineOptions) {
            pipelineOptions = config.sharpOptions.webp; // 默认使用WebP的配置进行压缩
          }

          sharp(filePath)
            .toFormat(outputFormat, pipelineOptions)
            .toFile(outputFilePath, (err) => {
              if (err) console.error(`Error processing ${filePath}:`, err);
              else console.log(`${filePath} -> ${outputFilePath}`);
            });
        }
      }
    });
  });
}

// 开始处理
processFiles(config.inputDir);