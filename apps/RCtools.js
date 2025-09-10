import axios from 'axios';
import { exec } from 'child_process';
import { HttpsProxyAgent } from 'https-proxy-agent';
import _ from 'lodash';
import fetch from 'node-fetch';
import fs from 'node:fs';
import PQueue from 'p-queue';
import querystring from 'querystring';
import {
  BILI_CDN_SELECT_LIST,
  BILI_DEFAULT_INTRO_LEN_LIMIT,
  BILI_RESOLUTION_LIST,
  COMMON_USER_AGENT,
  DIVIDING_LINE,
  DOWNLOAD_WAIT_DETECT_FILE_TIME,
  REDIS_YUNZAI_ISOVERSEA,
} from '../constants/constant.js';
import { RESOLVE_CONTROLLER_NAME_ENUM } from '../constants/resolve.js';
import {
  ANIME_SERIES_SEARCH_LINK,
  ANIME_SERIES_SEARCH_LINK2,
  BILI_ARTICLE_INFO,
  BILI_EP_INFO,
  BILI_ONLINE,
  BILI_SSID_INFO,
  BILI_STREAM_FLV,
  BILI_STREAM_INFO,
  BILI_SUMMARY,
  MIYOUSHE_ARTICLE,
} from '../constants/tools.js';
import config from '../model/config.js';
import { startBBDown } from '../utils/bbdown-util.js';
import {
  BILI_HEADER,
  downloadBFile,
  filterBiliDescLink,
  getBiliAudio,
  getDownloadUrl,
  getDynamic,
  getVideoInfo,
  m4sToMp3,
  mergeFileToMp4,
} from '../utils/bilibili.js';
import { getWbi } from '../utils/biliWbi.js';
import {
  checkToolInCurEnv,
  formatBiliInfo,
  secondsToTime,
  truncateString,
  urlTransformShortLink,
} from '../utils/common.js';
import { convertFlvToMp4 } from '../utils/ffmpeg-util.js';
import { checkAndRemoveFile, mkdirIfNotExists } from '../utils/file.js';
import { getDS } from '../utils/mihoyo.js';
import { redisExistKey, redisGetKey, redisSetKey } from '../utils/redis-util.js';
import { textArrayToMakeForward } from '../utils/yunzai-util.js';
import GeneralLinkAdapter from '../utils/general-link-adapter.js';

export class RCtools extends plugin {
  constructor() {
    super({
      name: 'R插件工具和学习类',
      dsc: 'R插件工具相关指令',
      event: 'message.group',
      priority: 300,
      rule: [
        {
          reg: '(bilibili.com|b23.tv|bili2233.cn|m.bilibili.com|t.bilibili.com|^BV[1-9a-zA-Z]{10}$)',
          fnc: 'bili',
        },
        {
          reg: '(chenzhongtech.com|kuaishou.com|ixigua.com|h5.pipix.com|h5.pipigx.com|s.xsj.qq.com|m.okjike.com)',
          fnc: 'general',
        },
        {
          reg: '(miyoushe.com)',
          fnc: 'miyoushe',
        },
      ],
    });
    // 配置文件
    this.toolsConfig = config.getConfig('tools');
    // 视频保存路径
    this.defaultPath = this.toolsConfig.defaultPath;
    // 视频限制大小
    this.videoSizeLimit = this.toolsConfig.videoSizeLimit;
    // 获取全局禁用的解析
    this.globalBlackList = this.toolsConfig.globalBlackList;
    // 魔法接口
    this.proxyAddr = this.toolsConfig.proxyAddr;
    this.proxyPort = this.toolsConfig.proxyPort;
    // 加载识别前缀
    this.identifyPrefix = this.toolsConfig.identifyPrefix;
    // 加载直播录制时长
    this.streamDuration = this.toolsConfig.streamDuration;
    // 加载直播是否开启兼容模式
    this.streamCompatibility = this.toolsConfig.streamCompatibility;
    // 加载哔哩哔哩配置
    this.biliSessData = this.toolsConfig.biliSessData;
    // 加载哔哩哔哩的限制时长
    this.biliDuration = this.toolsConfig.biliDuration;
    // 加载是否显示哔哩哔哩的封面
    this.biliDisplayCover = this.toolsConfig.biliDisplayCover;
    // 加载是否显示哔哩哔哩的视频信息
    this.biliDisplayInfo = this.toolsConfig.biliDisplayInfo;
    // 加载是否显示哔哩哔哩的简介
    this.biliDisplayIntro = this.toolsConfig.biliDisplayIntro;
    // 加载是否显示哔哩哔哩的在线人数
    this.biliDisplayOnline = this.toolsConfig.biliDisplayOnline;
    // 加载是否显示哔哩哔哩的总结
    this.biliDisplaySummary = this.toolsConfig.biliDisplaySummary;
    // 加载哔哩哔哩是否使用BBDown
    this.biliUseBBDown = this.toolsConfig.biliUseBBDown;
    // 加载 BBDown 的CDN配置
    this.biliCDN = this.toolsConfig.biliCDN;
    // 加载网易云Cookie
    this.neteaseCookie = this.toolsConfig.neteaseCookie;
    // 加载是否转化群语音
    this.isSendVocal = this.toolsConfig.isSendVocal;
    // 加载是否自建服务器
    this.useLocalNeteaseAPI = this.toolsConfig.useLocalNeteaseAPI;
    // 加载自建服务器API
    this.neteaseCloudAPIServer = this.toolsConfig.neteaseCloudAPIServer;
    // 加载网易云解析最高音质
    this.neteaseCloudAudioQuality = this.toolsConfig.neteaseCloudAudioQuality;
    // 加载哔哩哔哩是否使用Aria2
    this.biliDownloadMethod = this.toolsConfig.biliDownloadMethod;
    // 加载哔哩哔哩最高分辨率
    this.biliResolution = this.toolsConfig.biliResolution;
    // 加载youtube的截取时长
    this.youtubeClipTime = this.toolsConfig.youtubeClipTime;
    // 加载youtube的解析时长
    this.youtubeDuration = this.toolsConfig.youtubeDuration;
    // 加载油管下载画质选项
    this.youtubeGraphicsOptions = this.toolsConfig.youtubeGraphicsOptions;
    // 加载youtube的Cookie
    this.youtubeCookiePath = this.toolsConfig.youtubeCookiePath;
    // 加载抖音Cookie
    this.douyinCookie = this.toolsConfig.douyinCookie;
    // 加载抖音是否压缩
    this.douyinCompression = this.toolsConfig.douyinCompression;
    // 加载抖音是否开启评论
    this.douyinComments = this.toolsConfig.douyinComments;
    // 加载小红书Cookie
    this.xiaohongshuCookie = this.toolsConfig.xiaohongshuCookie;
    // 并发队列
    this.queue = new PQueue({ concurrency: Number(this.toolsConfig.queueConcurrency) });
    // 视频下载的并发数量
    this.videoDownloadConcurrency = this.toolsConfig.videoDownloadConcurrency;
    // ai接口
    this.aiBaseURL = this.toolsConfig.aiBaseURL;
    // ai api key
    this.aiApiKey = this.toolsConfig.aiApiKey;
    // ai模型
    this.aiModel = this.toolsConfig.aiModel;
    // 强制使用海外服务器
    this.forceOverseasServer = this.toolsConfig.forceOverseasServer;
    // 解析图片是否合并转发
    this.globalImageLimit = this.toolsConfig.globalImageLimit;
  }

  /**
   * 下载直播片段
   * @param e
   * @param stream_url
   * @param second
   */
  async sendStreamSegment(e, stream_url, second = this.streamDuration) {
    let outputFilePath = `${this.getCurDownloadPath(e)}/stream_${second}s.flv`;
    // 删除临时文件
    if (this.streamCompatibility) {
      await checkAndRemoveFile(outputFilePath.replace('flv', 'mp4'));
    } else {
      await checkAndRemoveFile(outputFilePath);
    }

    // 创建一个取消令牌
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    try {
      const response = await axios.get(stream_url, {
        responseType: 'stream',
        cancelToken: source.token,
      });
      logger.info('[R插件][发送直播流] 正在下载直播流...');

      const file = fs.createWriteStream(outputFilePath);
      response.data.pipe(file);

      // 设置 streamDuration 秒后停止下载
      setTimeout(async () => {
        logger.info(`[R插件][发送直播流] 直播下载 ${second} 秒钟到，停止下载！`);
        // 取消请求
        source.cancel('[R插件][发送直播流] 下载时间到，停止请求');
        response.data.unpipe(file); // 取消管道连接
        file.end(); // 结束写入
        // 这里判断是否开启兼容模式
        if (this.streamCompatibility) {
          logger.info(`[R插件][发送直播流] 开启兼容模式，开始转换mp4格式...`);
          const resolvedOutputPath = await convertFlvToMp4(
            outputFilePath,
            outputFilePath.replace('.flv', '.mp4')
          );
          fs.unlinkSync(outputFilePath);
          outputFilePath = resolvedOutputPath;
          logger.info(`[R插件][发送直播流] 转换完成，开始发送视频...`);
        }
        await this.sendVideoToUpload(e, outputFilePath);
      }, second * 1000);

      // 监听请求被取消的情况
      response.data.on('error', (err) => {
        if (axios.isCancel(err)) {
          logger.info('请求已取消:', err.message);
        } else {
          logger.error('下载过程中发生错误:', err.message);
        }
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        logger.info('请求已取消:', error.message);
      } else {
        logger.error(`下载失败: ${error.message}`);
      }
      await fs.promises.unlink(outputFilePath); // 下载失败时删除文件
    }
  }

  // B 站解析
  async bili(e) {
    // 切面判断是否需要解析
    if (!(await this.isEnableResolve(RESOLVE_CONTROLLER_NAME_ENUM.bili))) {
      logger.info(`[R插件][全局解析控制] ${RESOLVE_CONTROLLER_NAME_ENUM.bili} 已拦截`);
      return true;
    }
    const urlRex = /(?:https?:\/\/)?www\.bilibili\.com\/[A-Za-z\d._?%&+\-=\/#]*/g;
    const bShortRex = /(http:|https:)\/\/(b23.tv|bili2233.cn)\/[A-Za-z\d._?%&+\-=\/#]*/g;
    let url =
      e.msg === undefined
        ? e.message.shift().data.replaceAll('\\', '')
        : e.msg.trim().replaceAll('\\', '');
    // 直接发送BV号的处理
    if (/^BV[1-9a-zA-Z]{10}$/.exec(url)?.[0]) {
      url = `https://www.bilibili.com/video/${url}`;
      logger.info(url);
    }
    // 短号处理
    if (url.includes('b23.tv') || url.includes('bili2233.cn')) {
      const bShortUrl = bShortRex.exec(url)?.[0];
      await fetch(bShortUrl, {
        method: 'HEAD',
      }).then((resp) => {
        url = resp.url;
      });
    } else if (url.includes('www.bilibili.com')) {
      url = urlRex.exec(url)[0];
    }
    // 补充https
    url = url.startsWith('https://') ? url : 'https://' + url;
    // 直播间分享
    // logger.info(url)
    if (url.includes('live.bilibili.com')) {
      // 提取直播间id
      const idPattern = /\/(\d+)$/;
      const parsedUrl = new URL(url);
      const streamId = parsedUrl.pathname.match(idPattern)?.[1];
      // logger.info(streamId)
      // 提取相关信息
      const liveData = await this.getBiliStreamInfo(streamId);
      // saveJsonToFile(liveData.data);
      const {
        title,
        user_cover,
        keyframe,
        description,
        tags,
        live_time,
        parent_area_name,
        area_name,
      } = liveData.data.data;
      e.reply([
        segment.image(user_cover),
        segment.image(keyframe),
        [
          `${this.identifyPrefix}识别：哔哩哔哩直播，${title}`,
          `${description ? `📝 简述：${description.replace(`&lt;p&gt;`, '').replace(`&lt;/p&gt;`, '')}` : ''}`,
          `${tags ? `🔖 标签：${tags}` : ''}`,
          `📍 分区：${parent_area_name ? `${parent_area_name}` : ''}${area_name ? `-${area_name}` : ''}`,
          `${live_time ? `⏰ 直播时间：${live_time}` : ''}`,
          `📺 独立播放器: https://www.bilibili.com/blackboard/live/live-activity-player.html?enterTheRoom=0&cid=${streamId}`,
        ]
          .filter((item) => item.trim() !== '')
          .join('\n'),
      ]);
      const streamData = await this.getBiliStream(streamId);
      const { url: streamUrl } = streamData.data.data.durl[0];
      await this.sendStreamSegment(e, streamUrl);
      return true;
    }
    // 处理专栏
    if ((e.msg !== undefined && url.includes('read\/cv')) || url.includes('read\/mobile')) {
      await this.biliArticle(e, url);
      return true;
    }
    // 动态处理
    if (
      url.includes('t.bilibili.com') ||
      url.includes('bilibili.com\/opus') ||
      url.includes('bilibili.com\/dynamic')
    ) {
      if (_.isEmpty(this.biliSessData)) {
        e.reply('检测到没有填写biliSessData，无法解析动态');
        return true;
      }
      url = this.biliDynamic(e, url, this.biliSessData);
      return true;
    }
    // 创建文件，如果不存在，
    const path = `${this.getCurDownloadPath(e)}/`;
    await mkdirIfNotExists(path);
    // 处理番剧
    if (url.includes('play\/ep') || url.includes('play\/ss')) {
      const ep = await this.biliEpInfo(url, e);
      // 如果使用了BBDown && 没有填写session 就放开下载
      if (this.biliUseBBDown) {
        // 下载文件
        await this.biliDownloadStrategy(e, `https://www.bilibili.com/bangumi/play/ep${ep}`, path);
      }
      return true;
    }
    // 视频信息获取例子：http://api.bilibili.com/x/web-interface/view?bvid=BV1hY411m7cB
    // 请求视频信息
    const videoInfo = await getVideoInfo(url);
    // 打印获取到的视频信息，用于调试时长问题
    logger.debug(
      `[R插件][Bili Debug] Video Info for ${url}: duration=${videoInfo.duration}, pages=${JSON.stringify(videoInfo.pages)}`
    );
    const { duration, bvid, cid, owner, pages } = videoInfo;

    let durationForCheck;
    let displayTitle = videoInfo.title; // 始终使用总标题
    let partTitle = null; // 用于存储分P标题
    let targetPageInfo = null; // 用于后续下载决策

    const urlParts = url.split('?');
    const queryParams = urlParts.length > 1 ? querystring.parse(urlParts[1]) : {};
    const pParam = queryParams.p ? parseInt(queryParams.p, 10) : null;

    // 只有当分P数量大于1时才认为是多P，并处理分P标题
    if (pages && pages.length > 1) {
      if (pParam && pages.length >= pParam && pParam > 0) {
        // 如果URL指定了有效的p参数
        targetPageInfo = pages[pParam - 1];
        durationForCheck = targetPageInfo.duration;
        partTitle = targetPageInfo.part; // 存储分P标题
        logger.info(
          `[R插件][Bili Duration] 分析到合集 P${pParam} (分P标题: ${partTitle}), 时长: ${durationForCheck}s`
        );
      } else {
        // 否则，默认检查第一个分P
        targetPageInfo = pages[0];
        durationForCheck = targetPageInfo.duration;
        // 在多P情况下，即使用户没有指定p，也显示第一个分p的标题
        partTitle = targetPageInfo.part;
        logger.info(
          `[R插件][Bili Duration] 分析到合集 P1 (分P标题: ${partTitle}), 时长: ${durationForCheck}s`
        );
      }
    } else {
      // 单P或无分P信息
      durationForCheck = duration;
      // 对于单P视频，我们不设置 partTitle，以避免混淆
      logger.info(
        `[R插件][Bili Duration] Using total duration (Title: ${displayTitle}): ${durationForCheck}s`
      );
    }

    const isLimitDuration = durationForCheck > this.biliDuration;
    // 动态构造哔哩哔哩信息
    let biliInfo = await this.constructBiliInfo(
      videoInfo,
      displayTitle,
      partTitle,
      pParam || (pages && pages.length > 1 ? 1 : null)
    );
    // 总结
    if (this.biliDisplaySummary) {
      const summary = await this.getBiliSummary(bvid, cid, owner.mid);
      // 封装总结
      summary &&
        e.reply(
          await Bot.makeForwardMsg(
            textArrayToMakeForward(e, [`「R插件 x bilibili」联合为您总结内容：`, summary])
          )
        );
    }
    // 限制视频解析
    if (isLimitDuration) {
      const durationInMinutes = (durationForCheck / 60).toFixed(0); // 使用 durationForCheck
      biliInfo.push(
        `${DIVIDING_LINE.replace('{}', '限制说明')}\n当前视频时长约：${durationInMinutes}分钟，\n大于管理员设置的最大时长 ${(this.biliDuration / 60).toFixed(2).replace(/\.00$/, '')} 分钟！`
      );
      e.reply(biliInfo);
      return true;
    } else {
      e.reply(biliInfo);
    }
    // 只提取音乐处理
    if (e.msg !== undefined && e.msg.startsWith('音乐')) {
      return await this.biliMusic(e, url);
    }
    // 下载文件
    await this.biliDownloadStrategy(e, url, path);
    return true;
  }

  /**
   * 提取哔哩哔哩专栏
   * @param e
   * @param url
   * @returns {Promise<void>}
   */
  async biliArticle(e, url) {
    const cvid = url.match(/read\/cv(\d+)/)?.[1] || url.match(/read\/mobile\?id=(\d+)/)?.[1];
    const articleResp = await fetch(BILI_ARTICLE_INFO.replace('{}', cvid), {
      headers: {
        ...BILI_HEADER,
      },
    });
    const articleData = (await articleResp.json()).data;
    const { title, author_name, origin_image_urls } = articleData;
    if (origin_image_urls) {
      const titleMsg = {
        message: { type: 'text', text: `标题：${title}\n作者：${author_name}` },
        nickname: e.sender.card || e.user_id,
        user_id: e.user_id,
      };
      await e.reply(
        Bot.makeForwardMsg(
          origin_image_urls
            .map((item) => {
              return {
                message: segment.image(item),
                nickname: e.sender.card || e.user_id,
                user_id: e.user_id,
              };
            })
            .concat(titleMsg)
        )
      );
    }
  }

  /**
   * 构造哔哩哔哩信息
   * @param videoInfo
   * @param displayTitle
   * @param partTitle
   * @param pParam
   * @returns {Promise<(string|string|*)[]>}
   */
  async constructBiliInfo(videoInfo, displayTitle, partTitle, pParam) {
    // 增加 partTitle 和 pParam 参数
    const { desc, bvid, cid, pic } = videoInfo;
    // 视频信息
    const { view, danmaku, reply, favorite, coin, share, like } = videoInfo.stat;
    // 格式化数据
    let combineContent = '';
    // 是否显示信息
    if (this.biliDisplayInfo) {
      // 构造一个可扩展的Map
      const dataProcessMap = {
        点赞: like,
        硬币: coin,
        收藏: favorite,
        分享: share,
        总播放量: view,
        弹幕数量: danmaku,
        评论: reply,
      };
      combineContent += `\n${formatBiliInfo(dataProcessMap)}`;
    }
    // 是否显示简介
    if (this.biliDisplayIntro) {
      // 过滤简介中的一些链接
      const filteredDesc = await filterBiliDescLink(desc);
      combineContent += `\n📝 简介：${truncateString(filteredDesc, this.toolsConfig.biliIntroLenLimit || BILI_DEFAULT_INTRO_LEN_LIMIT)}`;
    }
    // 是否显示在线人数
    if (this.biliDisplayOnline) {
      // 拼接在线人数
      const onlineTotal = await this.biliOnlineTotal(bvid, cid);
      combineContent += `\n🏄‍♂️️ 当前视频有 ${onlineTotal.total} 人在观看，其中 ${onlineTotal.count} 人在网页端观看`;
    }

    let finalTitle = `${this.identifyPrefix}识别：哔哩哔哩，${displayTitle}`;
    // 如果有多P标题，并且它和主标题不一样，则添加
    if (partTitle && partTitle !== displayTitle) {
      finalTitle += `|${pParam}P: ${partTitle}`;
    }

    let biliInfo = [finalTitle, combineContent];
    // 是否显示封面
    if (this.biliDisplayCover) {
      // 加入图片
      biliInfo.unshift(segment.image(pic));
    }
    return biliInfo;
  }

  /**
   * 获取哔哩哔哩番剧信息
   * @param url
   * @param e
   * @returns {Promise<void>}
   */
  async biliEpInfo(url, e) {
    let ep;
    // 处理ssid
    if (url.includes('play\/ss')) {
      const ssid = url.match(/\/ss(\d+)/)?.[1];
      let resp = await (
        await fetch(BILI_SSID_INFO.replace('{}', ssid), {
          headers: BILI_HEADER,
        })
      ).json();
      ep = resp.result.main_section.episodes[0].share_url.replace(
        'https://www.bilibili.com/bangumi/play/ep',
        ''
      );
    }
    // 处理普通情况，上述情况无法处理的
    if (_.isEmpty(ep)) {
      ep = url.match(/\/ep(\d+)/)?.[1];
    }
    const resp = await (
      await fetch(BILI_EP_INFO.replace('{}', ep), {
        headers: BILI_HEADER,
      })
    ).json();
    const result = resp.result;
    const { views, danmakus, likes, coins, favorites, favorite } = result.stat;
    // 封装成可以format的数据
    const dataProcessMap = {
      播放: views,
      弹幕: danmakus,
      点赞: likes,
      分享: coins,
      追番: favorites,
      收藏: favorite,
    };
    // 截断标题，查看Redis中是否存在，避免频繁走网络连接
    const title = result.title;
    e.reply(
      [
        segment.image(resp.result.cover),
        `${this.identifyPrefix}识别：哔哩哔哩番剧，${title}\n🎯 评分: ${result?.rating?.score ?? '-'} / ${result?.rating?.count ?? '-'}\n📺 ${result.new_ep.desc}, ${result.seasons[0].new_ep.index_show}\n`,
        `${formatBiliInfo(dataProcessMap)}`,
        `\n\n🪶 在线观看： ${await urlTransformShortLink(ANIME_SERIES_SEARCH_LINK + title)}`,
        `\n🌸 在线观看： ${await urlTransformShortLink(ANIME_SERIES_SEARCH_LINK2 + title)}`,
      ],
      true
    );
    return ep;
  }

  /**
   * 哔哩哔哩下载策略
   * @param e     事件
   * @param url   链接
   * @param path  保存路径
   * @returns {Promise<void>}
   */
  async biliDownloadStrategy(e, url, path) {
    return this.queue.add(async () => {
      // =================以下是调用BBDown的逻辑=====================
      // 下载视频和音频
      const tempPath = `${path}temp`;
      // 检测是否开启BBDown
      if (this.biliUseBBDown) {
        // 检测环境的 BBDown
        const isExistBBDown = await checkToolInCurEnv('BBDown');
        // 存在 BBDown
        if (isExistBBDown) {
          // 删除之前的文件
          await checkAndRemoveFile(`${tempPath}.mp4`);
          // 下载视频
          await startBBDown(url, path, {
            biliSessData: this.biliSessData,
            biliUseAria2: this.biliDownloadMethod === 1,
            biliCDN: BILI_CDN_SELECT_LIST.find((item) => item.value === this.biliCDN)?.sign,
            biliResolution: this.biliResolution,
          });
          // 发送视频
          return this.sendVideoToUpload(e, `${tempPath}.mp4`);
        }
        e.reply('🚧 R插件提醒你：开启但未检测到当前环境有【BBDown】，即将使用默认下载方式 ( ◡̀_◡́)ᕤ');
      }
      // =================默认下载方式=====================
      try {
        // 获取分辨率参数 QN，如果没有默认使用 480p --> 32
        const qn = BILI_RESOLUTION_LIST.find((item) => item.value === this.biliResolution).qn || 32;
        // 获取下载链接
        const data = await getDownloadUrl(url, this.biliSessData, qn);

        if (data.audioUrl != null) {
          await this.downBili(tempPath, data.videoUrl, data.audioUrl);
        } else {
          // 处理无音频的情况
          await downloadBFile(
            data.videoUrl,
            `${tempPath}.mp4`,
            _.throttle(
              (value) =>
                logger.mark('视频下载进度', {
                  data: value,
                }),
              1000
            )
          );
        }

        // 上传视频
        return this.sendVideoToUpload(e, `${tempPath}.mp4`);
      } catch (err) {
        // 错误处理
        logger.error('[R插件][哔哩哔哩视频发送]下载错误，具体原因为:', err);
        e.reply('解析失败，请重试一下');
      }
    });
  }

  /**
   * 获取在线人数
   * @param bvid
   * @param cid
   * @returns {Promise<{total: *, count: *}>}
   */
  async biliOnlineTotal(bvid, cid) {
    const onlineResp = await axios.get(BILI_ONLINE.replace('{0}', bvid).replace('{1}', cid));
    const online = onlineResp.data.data;
    return {
      total: online.total,
      count: online.count,
    };
  }

  // 下载哔哩哔哩音乐
  async biliMusic(e, url) {
    const videoId = /video\/[^?\/ ]+/.exec(url)[0].split('/')[1];
    this.queue.add(() => {
      getBiliAudio(videoId, '').then(async (audioUrl) => {
        const path = this.getCurDownloadPath(e);
        const biliMusicPath = await m4sToMp3(audioUrl, path);
        // 发送语音
        e.reply(segment.record(biliMusicPath));
        // 上传群文件
        await this.uploadGroupFile(e, biliMusicPath);
      });
    });
    return true;
  }

  // 发送哔哩哔哩动态的算法
  biliDynamic(e, url, session) {
    // 去除多余参数
    if (url.includes('?')) {
      url = url.substring(0, url.indexOf('?'));
    }
    const dynamicId = /[^/]+(?!.*\/)/.exec(url)[0];
    getDynamic(dynamicId, session).then(async (resp) => {
      if (resp.dynamicSrc.length > 0 || resp.dynamicDesc) {
        // 先发送动态描述文本
        if (resp.dynamicDesc) {
          e.reply(`${this.identifyPrefix}识别：哔哩哔哩动态\n${resp.dynamicDesc}`);
        }

        // 处理图片消息
        if (resp.dynamicSrc.length > 0) {
          if (resp.dynamicSrc.length > this.globalImageLimit) {
            let dynamicSrcMsg = [];
            resp.dynamicSrc.forEach((item) => {
              dynamicSrcMsg.push({
                message: segment.image(item),
                nickname: e.sender.card || e.user_id,
                user_id: e.user_id,
              });
            });
            await e.reply(await Bot.makeForwardMsg(dynamicSrcMsg));
          } else {
            const images = resp.dynamicSrc.map((item) => segment.image(item));
            await e.reply(images);
          }
        }
      } else {
        await e.reply(`${this.identifyPrefix}识别：哔哩哔哩动态, 但是失败！`);
      }
    });
    return url;
  }

  /**
   * 哔哩哔哩总结
   * @author zhiyu1998
   * @param bvid 稿件
   * @param cid 视频 cid
   * @param up_mid UP主 mid
   * @return {Promise<string>}
   */
  async getBiliSummary(bvid, cid, up_mid) {
    // 这个有点用，但不多
    let wbi = 'wts=1701546363&w_rid=1073871926b3ccd99bd790f0162af634';
    if (!_.isEmpty(this.biliSessData)) {
      wbi = await getWbi({ bvid, cid, up_mid }, this.biliSessData);
    }
    // 构造API
    const summaryUrl = `${BILI_SUMMARY}?${wbi}`;
    logger.info(summaryUrl);
    // 构造结果：https://api.bilibili.com/x/web-interface/view/conclusion/get?bvid=BV1L94y1H7CV&cid=1335073288&up_mid=297242063&wts=1701546363&w_rid=1073871926b3ccd99bd790f0162af634
    return axios
      .get(summaryUrl, {
        headers: {
          Cookie: `SESSDATA=${this.biliSessData}`,
        },
      })
      .then((resp) => {
        logger.debug(resp);
        const data = resp.data.data?.model_result;
        logger.debug(data);
        const summary = data?.summary;
        const outline = data?.outline;
        let resReply = '';
        // 总体总结
        if (summary) {
          resReply = `\n摘要：${summary}\n`;
        }
        // 分段总结
        if (outline) {
          const specificTimeSummary = outline.map((item) => {
            const smallTitle = item.title;
            const keyPoint = item?.part_outline;
            // 时间点的总结
            const specificContent = keyPoint
              .map((point) => {
                const { timestamp, content } = point;
                const specificTime = secondsToTime(timestamp);
                return `${specificTime}  ${content}\n`;
              })
              .join('');
            return `- ${smallTitle}\n${specificContent}\n`;
          });
          resReply += specificTimeSummary.join('');
        }
        return resReply;
      });
  }

  /**
   * 获取直播间信息
   * @param liveId
   * @returns {Promise<*>}
   */
  async getBiliStreamInfo(liveId) {
    return axios.get(`${BILI_STREAM_INFO}?room_id=${liveId}`, {
      headers: {
        'User-Agent': COMMON_USER_AGENT,
      },
    });
  }

  /**
   * 获取直播流
   * @param liveId
   * @returns {Promise<*>}
   */
  async getBiliStream(liveId) {
    return axios.get(`${BILI_STREAM_FLV}?cid=${liveId}`, {
      headers: {
        'User-Agent': COMMON_USER_AGENT,
      },
    });
  }

  /**
   * 通用解析
   * @param e
   * @return {Promise<void>}
   */
  async general(e) {
    // 切面判断是否需要解析
    if (!(await this.isEnableResolve(RESOLVE_CONTROLLER_NAME_ENUM.general))) {
      logger.info(`[R插件][全局解析控制] ${RESOLVE_CONTROLLER_NAME_ENUM.general} 已拦截`);
      return true;
    }
    try {
      const adapter = await GeneralLinkAdapter.create(e.msg);
      logger.debug(
        `[R插件][General Adapter Debug] Adapter object: ${JSON.stringify(adapter, null, 2)}`
      );
      e.reply(
        `${this.identifyPrefix}识别：${adapter.name}${adapter.desc ? `, ${adapter.desc}` : ''}`
      );
      logger.debug(adapter);
      logger.debug(
        `[R插件][General Adapter Debug] adapter.images: ${JSON.stringify(adapter.images)}`
      );
      logger.debug(`[R插件][General Adapter Debug] adapter.video: ${adapter.video}`);
      if (adapter.video && adapter.video !== '') {
        logger.debug(
          `[R插件][General Adapter Debug] Entering video sending logic for ${adapter.name}. Video URL: ${adapter.video}`
        );
        const url = adapter.video;
        this.downloadVideo(url).then((path) => {
          logger.debug(`[R插件][General Adapter Debug] Video downloaded to path: ${path}`);
          this.sendVideoToUpload(e, `${path}/temp.mp4`);
        });
      } else if (adapter.images && adapter.images.length > 0) {
        logger.debug(
          `[R插件][General Adapter Debug] Entering image sending logic for ${adapter.name}`
        );
        const images = adapter.images.map((item) => {
          return {
            message: segment.image(item),
            nickname: this.e.sender.card || this.e.user_id,
            user_id: this.e.user_id,
          };
        });
        e.reply(Bot.makeForwardMsg(images));
      } else {
        logger.debug(
          `[R插件][General Adapter Debug] No images or video found for ${adapter.name}. Replying with failure message.`
        );
        e.reply('解析失败：无法获取到资源');
      }
    } catch (err) {
      logger.error('解析失败 ', err);
      return true;
    }
    return true;
  }

  // 米游社
  async miyoushe(e) {
    // 切面判断是否需要解析
    if (!(await this.isEnableResolve(RESOLVE_CONTROLLER_NAME_ENUM.miyoushe))) {
      logger.info(`[R插件][全局解析控制] ${RESOLVE_CONTROLLER_NAME_ENUM.miyoushe} 已拦截`);
      return true;
    }
    let url = e.msg === undefined ? e.message.shift().data.replaceAll('\\', '') : e.msg.trim();
    let msg = /(?:https?:\/\/)?(m|www)\.miyoushe\.com\/[A-Za-z\d._?%&+\-=\/#]*/.exec(url)?.[0];
    const id = /\/(\d+)$/.exec(msg)?.[0].replace('\/', '');

    fetch(MIYOUSHE_ARTICLE.replace('{}', id), {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        'x-rpc-app_version': '2.87.0',
        'x-rpc-client_type': '4',
        Referer: 'https://www.miyoushe.com/',
        DS: getDS(),
      },
    }).then(async (resp) => {
      const respJson = await resp.json();
      // debug专用
      // fs.writeFile('data.json', JSON.stringify(respJson), (err) => {
      //     if (err) {
      //         logger.error('Error writing file:', err);
      //     } else {
      //         console.log('JSON saved to file successfully.');
      //     }
      // });
      // return;
      const data = respJson.data.post.post;
      // 分别获取：封面、主题、内容、图片
      const { cover, subject, content, images } = data;
      let realContent;
      // safe JSON.parse
      try {
        realContent = JSON.parse(content);
      } catch (e) {
        realContent = content;
      }
      const normalMsg = `${this.identifyPrefix}识别：米游社，${subject}\n${realContent?.describe || ''}`;
      const replyMsg = cover ? [segment.image(cover), normalMsg] : normalMsg;
      e.reply(replyMsg);
      // 图片
      if (images) {
        if (images.length > this.globalImageLimit) {
          const replyImages = images.map((item) => {
            return {
              message: segment.image(item),
              nickname: this.e.sender.card || this.e.user_id,
              user_id: this.e.user_id,
            };
          });
          e.reply(Bot.makeForwardMsg(replyImages));
        } else {
          const imageSegments = images.map((item) => segment.image(item));
          e.reply(imageSegments);
        }
      }
      // 视频
      let vod_list = respJson.data.post?.vod_list;
      if (vod_list.length > 0) {
        const resolutions = vod_list?.[0]?.resolutions;
        // 逐个遍历是否包含url
        for (let i = 0; i < resolutions.length; i++) {
          if (resolutions) {
            // 暂时选取分辨率较低的video进行解析
            const videoUrl = resolutions[i].url;
            this.downloadVideo(videoUrl).then((path) => {
              this.sendVideoToUpload(e, `${path}/temp.mp4`);
            });
            break;
          }
        }
      }
    });
  }

  /**
   * 哔哩哔哩下载
   * @param title
   * @param videoUrl
   * @param audioUrl
   * @returns {Promise<unknown>}
   */
  async downBili(title, videoUrl, audioUrl) {
    return Promise.all([
      downloadBFile(
        videoUrl,
        title + '-video.m4s',
        _.throttle(
          (value) =>
            logger.mark('视频下载进度', {
              data: value,
            }),
          1000
        ),
        this.biliDownloadMethod,
        this.videoDownloadConcurrency
      ),
      downloadBFile(
        audioUrl,
        title + '-audio.m4s',
        _.throttle(
          (value) =>
            logger.mark('音频下载进度', {
              data: value,
            }),
          1000
        ),
        this.biliDownloadMethod,
        this.videoDownloadConcurrency
      ),
    ]).then((data) => {
      return mergeFileToMp4(data[0].fullFileName, data[1].fullFileName, `${title}.mp4`);
    });
  }

  /**
   * 获取当前发送人/群的下载路径
   * @param e Yunzai 机器人事件
   * @returns {string}
   */
  getCurDownloadPath(e) {
    return `${this.defaultPath}${e.group_id || e.user_id}`;
  }

  /**
   * 提取视频下载位置
   * @returns {{groupPath: string, target: string}}
   */
  getGroupPathAndTarget() {
    const groupPath = `${this.defaultPath}${this.e.group_id || this.e.user_id}`;
    const target = `${groupPath}/temp.mp4`;
    return { groupPath, target };
  }

  /**
   * 工具：根据URL多线程下载视频 / 音频
   * @param url
   * @param isProxy
   * @param headers
   * @param numThreads
   * @returns {Promise<string>}
   */
  async downloadVideo(
    url,
    isProxy = false,
    headers = null,
    numThreads = this.videoDownloadConcurrency
  ) {
    // 构造群信息参数
    const { groupPath, target } = this.getGroupPathAndTarget.call(this);
    await mkdirIfNotExists(groupPath);
    // 构造header部分内容
    const userAgent =
      'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.25 Mobile Safari/537.36';

    // 构造代理参数
    const proxyOption = {
      ...(isProxy && {
        httpAgent: new HttpsProxyAgent(`http://${this.proxyAddr}:${this.proxyPort}`),
      }),
    };

    /**
     * 构造下载视频参数
     * 构造信息：链接、头信息、userAgent、代理信息、下载位置、返回的路径
     * @type {{headers: null, userAgent: string, groupPath: string, url, proxyOption: {}, target: string}}
     */
    const downloadVideoParams = {
      url,
      headers,
      userAgent,
      proxyOption,
      target,
      groupPath,
    };
    logger.info(`[R插件][视频下载]：当前队列长度为 ${this.queue.size + 1}`);
    return await this.queue.add(async () => {
      // 如果是用户设置了单线程，则不分片下载
      if (numThreads === 1) {
        return this.downloadVideoWithSingleThread(downloadVideoParams);
      } else if (numThreads !== 1 && this.biliDownloadMethod === 1) {
        return this.downloadVideoWithAria2(downloadVideoParams, numThreads);
      } else if (numThreads !== 1 && this.biliDownloadMethod === 2) {
        return this.downloadVideoUseAxel(downloadVideoParams, numThreads);
      } else {
        return this.downloadVideoWithMultiThread(downloadVideoParams, numThreads);
      }
    });
  }

  /**
   * 多线程下载视频
   * @link {downloadVideo}
   * @param downloadVideoParams
   * @param numThreads
   * @returns {Promise<*>}
   */
  async downloadVideoWithMultiThread(downloadVideoParams, numThreads) {
    const { url, headers, userAgent, proxyOption, target, groupPath } = downloadVideoParams;
    try {
      // Step 1: 请求视频资源获取 Content-Length
      const headRes = await axios.head(url, {
        headers: headers || { 'User-Agent': userAgent },
        ...proxyOption,
      });
      const contentLength = headRes.headers['content-length'];
      if (!contentLength) {
        throw new Error('无法获取视频大小');
      }

      // Step 2: 计算每个线程应该下载的文件部分
      const partSize = Math.ceil(contentLength / numThreads);
      let promises = [];

      for (let i = 0; i < numThreads; i++) {
        const start = i * partSize;
        let end = start + partSize - 1;
        if (i === numThreads - 1) {
          end = contentLength - 1; // 确保最后一部分可以下载完整
        }

        // Step 3: 并发下载文件的不同部分
        const partAxiosConfig = {
          headers: {
            'User-Agent': userAgent,
            Range: `bytes=${start}-${end}`,
          },
          responseType: 'stream',
          ...proxyOption,
        };

        promises.push(
          axios.get(url, partAxiosConfig).then((res) => {
            return new Promise((resolve, reject) => {
              const partPath = `${target}.part${i}`;
              logger.mark(`[R插件][视频下载引擎] 正在下载 part${i}`);
              const writer = fs.createWriteStream(partPath);
              res.data.pipe(writer);
              writer.on('finish', () => {
                logger.mark(`[R插件][视频下载引擎] part${i + 1} 下载完成`); // 记录线程下载完成
                resolve(partPath);
              });
              writer.on('error', reject);
            });
          })
        );
      }

      // 等待所有部分都下载完毕
      const parts = await Promise.all(promises);

      // Step 4: 合并下载的文件部分
      await checkAndRemoveFile(target); // 确保目标文件不存在
      const writer = fs.createWriteStream(target, { flags: 'a' });
      for (const partPath of parts) {
        await new Promise((resolve, reject) => {
          const reader = fs.createReadStream(partPath);
          reader.pipe(writer, { end: false });
          reader.on('end', () => {
            fs.unlinkSync(partPath); // 删除部分文件
            resolve();
          });
          reader.on('error', reject);
        });
      }

      writer.close();

      return groupPath;
    } catch (err) {
      logger.error(`下载视频发生错误！\ninfo:${err}`);
    }
  }

  /**
   * 使用Aria2进行多线程下载
   * @param downloadVideoParams
   * @param numThreads
   * @returns {Promise<unknown>}
   */
  async downloadVideoWithAria2(downloadVideoParams, numThreads) {
    const { url, headers, userAgent, proxyOption, target, groupPath } = downloadVideoParams;

    // 构造aria2c命令参数
    const aria2cArgs = [
      `"${url}"`,
      `--out="temp.mp4"`,
      `--dir="${groupPath}"`,
      `--user-agent="${userAgent}"`,
      `--max-connection-per-server=${numThreads}`, // 每个服务器的最大连接数
      `--split=${numThreads}`, // 分成 6 个部分进行下载
    ];

    // 如果有自定义头信息
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        aria2cArgs.push(`--header="${key}: ${value}"`);
      }
    }

    // 如果使用代理
    if (proxyOption && proxyOption.httpAgent) {
      const proxyUrl = proxyOption.httpAgent.proxy.href;
      aria2cArgs.push(`--all-proxy="${proxyUrl}"`);
    }

    try {
      await checkAndRemoveFile(target);
      logger.mark(`开始下载: ${url}`);

      // 执行aria2c命令
      const command = `aria2c ${aria2cArgs.join(' ')}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`下载视频发生错误！\ninfo:${stderr}`);
          throw error;
        } else {
          logger.mark(`下载完成: ${url}`);
        }
      });

      // 监听文件生成完成
      let count = 0;
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          logger.info(logger.red(`[R插件][Aria2] 没有检测到文件！重试第${count + 1}次`));
          count += 1;
          if (fs.existsSync(target)) {
            logger.info('[R插件][Aria2] 检测到文件！');
            clearInterval(checkInterval);
            resolve(groupPath);
          }
          if (count === 6) {
            logger.error(`[R插件][Aria2] 下载视频发生错误！`);
            clearInterval(checkInterval);
            reject();
          }
        }, DOWNLOAD_WAIT_DETECT_FILE_TIME);
      });
    } catch (err) {
      logger.error(`下载视频发生错误！\ninfo:${err}`);
      throw err;
    }
  }

  /**
   * 使用Axel进行多线程下载
   * @param downloadVideoParams
   * @param numThreads
   * @returns {Promise<unknown>}
   */
  async downloadVideoUseAxel(downloadVideoParams, numThreads) {
    const { url, headers, userAgent, proxyOption, target, groupPath } = downloadVideoParams;

    // 构造axel命令参数
    const axelArgs = [`-n ${numThreads}`, `-o "${target}"`, `-U "${userAgent}"`, url];

    // 如果有自定义头信息
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        axelArgs.push(`-H "${key}: ${value}"`);
      }
    }

    // 如果使用代理
    if (proxyOption && proxyOption.httpAgent) {
      const proxyUrl = proxyOption.httpAgent.proxy.href;
      axelArgs.push(`--proxy="${proxyUrl}"`);
    }

    try {
      await checkAndRemoveFile(target);
      logger.mark(`开始下载: ${url}`);

      // 执行axel命令
      const command = `axel ${axelArgs.join(' ')}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`下载视频发生错误！\ninfo:${stderr}`);
          throw error;
        } else {
          logger.mark(`下载完成: ${url}`);
        }
      });

      let count = 0;
      // 监听文件生成完成
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          logger.info(logger.red(`[R插件][Aria2] 没有检测到文件！重试第${count + 1}次`));
          count += 1;
          if (fs.existsSync(target)) {
            logger.info('[R插件][Axel] 检测到文件！');
            clearInterval(checkInterval);
            logger.info(`[R插件][Axel] 下载到${groupPath}`);
            resolve(groupPath);
          }
          if (count === 6) {
            logger.error(`[R插件][Axel] 下载视频发生错误！`);
            clearInterval(checkInterval);
            reject();
          }
        }, DOWNLOAD_WAIT_DETECT_FILE_TIME);
      });
    } catch (err) {
      logger.error(`下载视频发生错误！\ninfo:${err}`);
      throw err;
    }
  }

  /**
   * 单线程下载视频
   * @link {downloadVideo}
   * @returns {Promise<unknown>}
   * @param downloadVideoParams
   */
  async downloadVideoWithSingleThread(downloadVideoParams) {
    const { url, headers, userAgent, proxyOption, target, groupPath } = downloadVideoParams;
    const axiosConfig = {
      headers: headers || { 'User-Agent': userAgent },
      responseType: 'stream',
      ...proxyOption,
    };

    try {
      await checkAndRemoveFile(target);

      const res = await axios.get(url, axiosConfig);
      logger.mark(`开始下载: ${url}`);
      const writer = fs.createWriteStream(target);
      res.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(groupPath));
        writer.on('error', reject);
      });
    } catch (err) {
      logger.error(`下载视频发生错误！\ninfo:${err}`);
    }
  }

  /**
   * 判断是否启用解析
   * @param resolveName
   * @returns {Promise<boolean>}
   */
  async isEnableResolve(resolveName) {
    const controller = this.globalBlackList;
    // 如果不存在，那么直接放行
    if (controller == null) {
      return true;
    }
    // 找到禁用列表中是否包含 `resolveName`
    const foundItem = controller.find((item) => item === resolveName);
    // 如果 undefined 说明不在禁用列表就放行
    return foundItem === undefined;
  }

  /**
   * 判断是否是海外服务器
   * @return {Promise<Boolean>}
   */
  async isOverseasServer() {
    // 如果配置了强制使用海外服务器，则返回true
    if (this.forceOverseasServer) {
      return true;
    }
    // 如果第一次使用没有值就设置
    if (!(await redisExistKey(REDIS_YUNZAI_ISOVERSEA))) {
      await redisSetKey(REDIS_YUNZAI_ISOVERSEA, {
        os: false, // 默认不使用海外服务器
      });
      return false;
    }
    // 如果有就取出来
    return (await redisGetKey(REDIS_YUNZAI_ISOVERSEA)).os;
  }

  /**
   * 发送转上传视频
   * @param e              交互事件
   * @param path           视频所在路径
   * @param videoSizeLimit 发送转上传视频的大小限制，默认70MB
   */
  async sendVideoToUpload(e, path, videoSizeLimit = this.videoSizeLimit) {
    try {
      // 判断文件是否存在
      if (!fs.existsSync(path)) {
        return e.reply('视频不存在');
      }
      const stats = fs.statSync(path);
      const videoSize = Math.floor(stats.size / (1024 * 1024));
      // 正常发送视频
      if (videoSize > videoSizeLimit) {
        e.reply(
          `当前视频大小：${videoSize}MB，\n大于设置的最大限制：${videoSizeLimit}MB，\n改为上传群文件`
        );
        await this.uploadGroupFile(e, path); // uploadGroupFile 内部会处理删除
      } else {
        await e.reply(segment.video(path));
        await checkAndRemoveFile(path); // 发送成功后删除
      }
    } catch (err) {
      logger.error(`[R插件][发送视频判断是否需要上传] 发生错误:\n ${err}`);
      // 如果发送失败，也尝试删除，避免残留
      await checkAndRemoveFile(path);
    }
  }

  /**
   * 上传到群文件
   * @param e             交互事件
   * @param path          上传的文件所在路径
   * @return {Promise<void>}
   */
  async uploadGroupFile(e, path) {
    // 判断是否是ICQQ
    if (e.bot?.sendUni) {
      await e.group.fs.upload(path);
    } else {
      await e.group.sendFile(path);
    }
  }
}
