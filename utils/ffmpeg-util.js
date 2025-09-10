import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

/**
 * 使用 ffmpeg 将 FLV 文件转换为 MP4 文件
 * @param {string} inputFilePath - 输入的 FLV 文件路径
 * @param {string} outputFilePath - 输出的 MP4 文件路径
 * @returns {Promise<string>} - 返回一个 Promise，成功时返回输出文件路径，失败时返回错误信息
 */
export function convertFlvToMp4(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    const resolvedInputPath = path.resolve(inputFilePath);
    const resolvedOutputPath = path.resolve(outputFilePath);

    // 检查文件是否存在
    fs.access(resolvedInputPath, fs.constants.F_OK, (err) => {
      if (err) {
        reject(`[R插件][ffmpeg工具]输入文件不存在: ${resolvedInputPath}`);
        return;
      }

      const command = `ffmpeg -y -i "${resolvedInputPath}" "${resolvedOutputPath}"`;
      logger.info(`[R插件][ffmpeg工具]执行命令：${command}`);

      // 执行 ffmpeg 转换
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`[R插件][ffmpeg工具]执行 ffmpeg 命令时出错: ${error.message}`);
          return;
        }
        resolve(resolvedOutputPath);
      });
    });
  });
}
