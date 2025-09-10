import { exec } from 'child_process';
import fetch from 'node-fetch';
import os from 'os';
import { SHORT_LINKS, TEN_THOUSAND } from '../constants/constant.js';

/**
 * 千位数的数据处理
 * @param data
 * @return {string|*}
 */
const dataProcessing = (data) => {
  return Number(data) >= TEN_THOUSAND ? (data / TEN_THOUSAND).toFixed(1) + '万' : data;
};

/**
 * 哔哩哔哩解析的数据处理
 * @param data
 * @return {string}
 */
export function formatBiliInfo(data) {
  return Object.keys(data)
    .map((key) => `${key}：${dataProcessing(data[key])}`)
    .join(' | ');
}

/**
 * 数字转换成具体时间
 * @param seconds
 * @return {string}
 */
export function secondsToTime(seconds) {
  const pad = (num, size) => num.toString().padStart(size, '0');

  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;

  // 如果你只需要分钟和秒钟，你可以返回下面这行：
  // return `${pad(minutes, 2)}:${pad(secs, 2)}`;

  // 完整的 HH:MM:SS 格式
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}`;
}

/**
 * 超过某个长度的字符串换为...
 * @param inputString
 * @param maxLength
 * @returns {*|string}
 */
export function truncateString(inputString, maxLength = 50) {
  return maxLength === 0 || maxLength === -1 || inputString.length <= maxLength
    ? inputString
    : inputString.substring(0, maxLength) + '...';
}

/**
 * 重试 fetch 请求
 * @param {string} url 请求的URL
 * @param {object} [options] 传递给fetch的选项
 * @param {number} [retries=3] 重试次数
 * @param {number} [delay=1000] 重试之间的延迟（毫秒）
 * @returns {Promise<Response>}
 */
export async function retryFetch(url, options, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`请求失败，状态码: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      logger.mark(
        `[R插件][重试模块] 请求失败: ${error.message}，重试中... (${3 - retries + 1}/3) 次`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryFetch(url, options, retries - 1, delay);
    } else {
      throw error;
    }
  }
}

/**
 * 统计给定文本中的中文字数
 *
 * @param {string} text - The text to count words in
 * @return {number} The number of words in the text
 */
export function countChineseCharacters(text) {
  const chineseCharacterRegex = /[\u4e00-\u9fa5]/g;
  const matches = text.match(chineseCharacterRegex);
  return matches ? matches.length : 0;
}

/**
 * 根据每分钟平均单词数估计给定文本的阅读时间
 *
 * @param {string} text - The text for which the reading time is estimated.
 * @param {number} wpm - The average words per minute for calculating reading time. Default is 200.
 * @return {Object} An object containing the estimated reading time in minutes and the word count.
 */
export function estimateReadingTime(text, wpm = 200) {
  const wordCount = countChineseCharacters(text);
  const readingTimeMinutes = wordCount / wpm;
  return {
    minutes: Math.ceil(readingTimeMinutes),
    words: wordCount,
  };
}

/**
 * 检测当前环境是否存在某个命令
 * @param someCommand
 * @returns {Promise<boolean>}
 */
export function checkToolInCurEnv(someCommand) {
  // 根据操作系统选择命令
  return new Promise((resolve, reject) => {
    const command = os.platform() === 'win32' ? `where ${someCommand}` : `which ${someCommand}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`[R插件][命令环境检测]未找到${someCommand}: ${stderr || error.message}`);
        resolve(false);
        return;
      }
      logger.info(`[R插件][命令环境检测]找到${someCommand}: ${stdout.trim()}`);
      resolve(true);
    });
  });
}

/**
 * 转换短链接
 * @param url
 * @returns {Promise<string>}
 */
export async function urlTransformShortLink(url) {
  const data = {
    url: `${encodeURI(url)}`,
  };

  const resp = await fetch(SHORT_LINKS, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((response) => response.json());
  return await resp.data.short_url;
}
