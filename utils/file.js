import { promises as fs } from 'fs';
import path from 'path';

/**
 * 通用错误处理函数
 * @param err
 */
function handleError(err) {
  logger.error(`错误: ${err.message}\n堆栈: ${err.stack}`);
  throw err;
}

/**
 * 检查文件是否存在并且删除
 * @param {string} file - 文件路径
 * @returns {Promise<void>}
 */
export async function checkAndRemoveFile(file) {
  try {
    await fs.access(file);
    await fs.unlink(file);
    logger.info(`文件 ${file} 删除成功。`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      handleError(err);
    }
  }
}

/**
 * 创建文件夹，如果不存在
 * @param {string} dir - 文件夹路径
 * @returns {Promise<void>}
 */
export async function mkdirIfNotExists(dir) {
  try {
    await fs.access(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`目录 ${dir} 创建成功。`);
    } else {
      handleError(err);
    }
  }
}

/**
 * 删除文件夹下所有文件
 * @param {string} folderPath - 文件夹路径
 * @returns {Promise<number>}
 */
export async function deleteFolderRecursive(folderPath) {
  try {
    const files = await readCurrentDir(folderPath);
    const actions = files.map(async (file) => {
      const curPath = path.join(folderPath, file);
      const stat = await fs.lstat(curPath);
      if (stat.isDirectory()) {
        return deleteFolderRecursive(curPath);
      } else {
        return fs.unlink(curPath);
      }
    });

    await Promise.allSettled(actions);
    logger.info(`文件夹 ${folderPath} 中的所有文件删除成功。`);
    return files.length;
  } catch (error) {
    handleError(error);
    return 0;
  }
}

/**
 * 读取当前文件夹的所有文件和文件夹
 * @param {string} dirPath - 路径
 * @returns {Promise<string[]>} 返回一个包含文件名的数组
 */
export async function readCurrentDir(dirPath) {
  try {
    return await fs.readdir(dirPath);
  } catch (err) {
    handleError(err);
  }
}
