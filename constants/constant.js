/**
 * 用于百度翻译的常量控制
 *
 * @type {{英: string, 日: string, 文: string, 中: string}}
 */
export const transMap = { 中: 'zh', 日: 'jp', 文: 'wyw', 英: 'en', 俄: 'ru', 韩: 'kr' };
/**
 * 用于腾讯交互式翻译的常量控制
 *
 * @type {{英: string, 俄: string, 日: string, 韩: string, 中: string}}
 */
export const tencentTransMap = { 中: 'zh', 日: 'ja', 韩: 'ko', 英: 'en', 俄: 'ru' };

/**
 * 固定值 1w，目前用于哔哩哔哩的数值渲染
 * @type {number}
 */
export const TEN_THOUSAND = 10000;
/**
 * 公共的 User-Agent
 * @type {string}
 */
export const COMMON_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.25 Mobile Safari/537.36';

/**
 * 分割线
 * @type {string}
 */
export const DIVIDING_LINE = '\n━━━{}━━━';

/**
 * 保存判断机子是否是海外服务器的key
 * @type {string}
 */
export const REDIS_YUNZAI_ISOVERSEA = 'Yz:rconsole:tools:oversea';

/**
 * 哔哩哔哩简介默认长度限制
 * @type {number}
 */
export const BILI_DEFAULT_INTRO_LEN_LIMIT = 50;

/**
 * 帮助文档提示
 * @type {string}
 */
export const HELP_DOC = '\n如果您对功能有任何问题欢迎参阅文档奥~\nhttps://docs.crystelf.top/';

/**
 * 总结内容评估器的正则
 * @type {{reg: RegExp, name: string}[]}
 */
export const SUMMARY_CONTENT_ESTIMATOR_PATTERNS = [
  { reg: /(?:https?:\/\/)?mp\.weixin\.qq\.com\/[A-Za-z\d._?%&+\-=\/#]*/, name: '微信文章' },
  { reg: /(?:https?:\/\/)?arxiv.org\/[a-zA-Z\d._?%&+\-=\/#]*/, name: 'ArXiv论文' },
  { reg: /(?:https?:\/\/)?sspai.com\/[a-zA-Z\d._?%&+\-=\/#]*/, name: '少数派' },
  {
    reg: /(?:https?:\/\/)?www\.bilibili\.com\/read\/[A-Za-z\d._?%&+\-=\/#]*/,
    name: '哔哩哔哩专栏',
  },
  { reg: /(?:https?:\/\/)?www\.zhihu\.com\/question\/[A-Za-z\d._?%&+\-=\/#]*/, name: '知乎问题' },
  {
    reg: /(?:https?:\/\/)?(www\.)chinadaily.com.cn\/a\/[a-zA-Z0-9\d._?%&+\-=\/#]*/,
    name: 'ChinaDaily',
  },
  { reg: /(?:https?:\/\/)?(www\.)?github.com\/[a-zA-Z0-9\d._?%&+\-=\/#]*/, name: 'Github' },
];

const BILI_CDN_TEMPLATE = 'upos-sz-mirror{}.bilivideo.com';
export const BILI_CDN_SELECT_LIST = Object.freeze([
  { label: '不使用', value: 0, sign: '' },
  { label: '腾讯CDN【推荐】', value: 1, sign: BILI_CDN_TEMPLATE.replace('{}', 'cos') },
  { label: '百度CDN', value: 2, sign: BILI_CDN_TEMPLATE.replace('{}', 'bd') },
  { label: '华为CDN', value: 3, sign: BILI_CDN_TEMPLATE.replace('{}', 'hw') },
  { label: '阿卡迈（海外）', value: 4, sign: BILI_CDN_TEMPLATE.replace('{}', 'akamai') },
  { label: 'HK-CDN', value: 5, sign: BILI_CDN_TEMPLATE.replace('{}', 'aliov') },
]);

export const BILI_DOWNLOAD_METHOD = Object.freeze([
  { label: '稳定（原生）', value: 0 },
  { label: '性能（Aria2）', value: 1 },
  { label: '轻量（axel/wget）', value: 2 },
]);

export const BILI_RESOLUTION_LIST = Object.freeze([
  { label: '8K 超高清', value: 0, qn: 127 },
  { label: '4K 超清', value: 1, qn: 120 },
  { label: '1080P 高码率', value: 2, qn: 112 },
  { label: '1080P 高清', value: 3, qn: 80 },
  { label: '720P 高清', value: 4, qn: 64 },
  { label: '480P 清晰', value: 5, qn: 32 },
  { label: '360P 流畅', value: 6, qn: 16 },
]);

export const YOUTUBE_GRAPHICS_LIST = Object.freeze([
  { label: 'Best', value: 0 },
  { label: '1080P 高清', value: 1080 },
  { label: '720P 高清', value: 720 },
  { label: '480P 清晰', value: 480 },
]);

export const NETEASECLOUD_QUALITY_LIST = Object.freeze([
  { label: '标准', value: 'standard' },
  { label: '较高', value: 'higher' },
  { label: '极高', value: 'exhigh' },
  { label: '无损', value: 'lossless' },
  { label: 'Hi-Res', value: 'hires' },
  { label: '高清环绕声', value: 'jyeffect' },
  { label: '沉浸环绕声', value: 'sky' },
  { label: '杜比全景声(不推荐)', value: 'dolby' },
  { label: '超清母带', value: 'jymaster' },
]);
/**
 * 针对 Aria2 和 Alex 的下载检测文件时间
 * @type {number}
 */
export const DOWNLOAD_WAIT_DETECT_FILE_TIME = 3000;

/**
 * 短链接接口
 * @type {string}
 */
export const SHORT_LINKS = 'https://smolurl.com/api/links';
