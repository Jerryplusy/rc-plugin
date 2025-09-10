/**
 * AI总结API
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md
 * @type {string}
 */
export const BILI_SUMMARY = 'https://api.bilibili.com/x/web-interface/view/conclusion/get';

/**
 * 视频流URL
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/videostream_url.md
 * @type {string}
 */
export const BILI_PLAY_STREAM =
  'https://api.bilibili.com/x/player/wbi/playurl?cid={cid}&bvid={bvid}&qn={qn}&fnval=16';

/**
 * 动态信息
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/dynamic/get_dynamic_detail.md
 * @type {string}
 */
export const BILI_DYNAMIC =
  'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail?dynamic_id={}';

/**
 * BVID -> CID
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/33bde6f6afcac2ff8c6f7069f08ce84065a6cff6/docs/video/info.md?plain=1#L4352
 * @type {string}
 */
export const BILI_BVID_TO_CID =
  'https://api.bilibili.com/x/player/pagelist?bvid={bvid}&jsonp=jsonp';

/**
 * 视频基本信息API
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/info.md
 * @type {string}
 */
export const BILI_VIDEO_INFO = 'http://api.bilibili.com/x/web-interface/view';

/**
 * 登录基本信息
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/login/login_info.md#%E5%AF%BC%E8%88%AA%E6%A0%8F%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF
 * @type {string}
 */
export const BILI_NAV = 'https://api.bilibili.com/x/web-interface/nav';

/**
 * 扫码登录的二维码生成
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/login/login_action/QR.md
 * @type {string}
 */
export const BILI_SCAN_CODE_GENERATE =
  'https://passport.bilibili.com/x/passport-login/web/qrcode/generate';

/**
 * 扫码登录检测然后发送令牌数据
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/login/login_action/QR.md
 * @type {string}
 */
export const BILI_SCAN_CODE_DETECT =
  'https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key={}';

/**
 * 直播间信息获取
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/live/info.md
 * @type {string}
 */
export const BILI_STREAM_INFO = 'https://api.live.bilibili.com/room/v1/Room/get_info';

/**
 * 根据真实直播间号获取直播视频流
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/live/live_stream.md
 * @type {string}
 */
export const BILI_STREAM_FLV = 'https://api.live.bilibili.com/room/v1/Room/playUrl';

/**
 * 获取视频在线人数_web端
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/online.md
 * @type {string}
 */
export const BILI_ONLINE = 'https://api.bilibili.com/x/player/online/total?bvid={0}&cid={1}';

/**
 * 剧集基本信息
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/bangumi/info.md
 * @type {string}
 */
export const BILI_EP_INFO = 'https://api.bilibili.com/pgc/view/web/season?ep_id={}';

/**
 * 剧集基本信息
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/bangumi/info.md
 * @type {string}
 */
export const BILI_SSID_INFO = 'https://api.bilibili.com/pgc/web/season/section?season_id={}';

/**
 * 专栏信息
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/article/info.md
 * @type {string}
 */
export const BILI_ARTICLE_INFO = 'https://api.bilibili.com/x/article/viewinfo?id={}';

/**
 * 米游社网页端获取文章
 * https://github.com/UIGF-org/mihoyo-api-collect/blob/main/hoyolab/article/article.md#%E8%8E%B7%E5%8F%96%E5%AE%8C%E6%95%B4%E6%96%87%E7%AB%A0%E4%BF%A1%E6%81%AF
 * @type {string}
 */
export const MIYOUSHE_ARTICLE = 'https://bbs-api.miyoushe.com/post/wapi/getPostFull?post_id={}';

/**
 * 通用解析的请求链接
 * @type {string}
 */
export const GENERAL_REQ_LINK = {
  link: 'http://47.99.158.118/video-crack/v2/parse?content={}',
  sign: 1,
};
export const GENERAL_REQ_LINK_2 = {
  link: 'https://acid.jiuzige.com.cn/web/index/analysis?url={}',
  sign: 2,
};

export const GENERAL_REQ_LINK_3 = {
  link: 'https://picseed.com/v1/parser?auth_key=1E9DC25C-E75F-11EE-A0DD-0A5A298C6C2D&content={}',
  sign: 3,
};

/**
 * 番剧搜索链接
 * @type {string}
 */
export const ANIME_SERIES_SEARCH_LINK = 'https://ylu.cc/so.php?wd=';

/**
 * 番剧搜索链接2
 * @type {string}
 */
export const ANIME_SERIES_SEARCH_LINK2 = 'https://yhdm.one/search?q=';

/**
 * 临时 AI LLM爬虫
 * @type {string}
 */
export const PearAPI_CRAWLER = 'https://api.pearktrue.cn/api/llmreader/?url={}&type=json';

/**
 * 临时 AI 总结
 * @type {string}
 */
export const PearAPI_DEEPSEEK = 'https://api.pearktrue.cn/api/deepseek/';
