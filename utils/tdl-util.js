import { exec } from 'child_process';
import path from 'path'

/**
 * 执行 TDL 进行下载
 * @param url
 * @param curPath
 * @param isOversea
 * @param proxyAddr
 * @param videoDownloadConcurrency
 * @returns {Promise<string>}
 */
export async function startTDL(url, curPath, isOversea, proxyAddr, videoDownloadConcurrency = 1) {
    return new Promise((resolve, reject) => {
        curPath = path.resolve(curPath);
        const proxyStr = isOversea ? `` : `--proxy ${ proxyAddr }`;
        const concurrencyStr = videoDownloadConcurrency > 1 ? `-t ${ videoDownloadConcurrency } -l ${ videoDownloadConcurrency }` : '';
        const command = `tdl dl -u ${ url } -d ${ curPath } ${ concurrencyStr } ${ proxyStr }`
        logger.mark(`[R插件][TDL] ${ command }`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`[R插件][TDL]执行出错: ${ error.message }`);
                return;
            }
            if (stderr) {
                reject(`[R插件][TDL]错误信息: ${ stderr }`);
                return;
            }
            resolve(stdout);
        })
    })
}

/**
 * 保存小飞机内容到小飞机的收藏
 * @param url
 * @param isOversea
 * @param proxyAddr
 * @returns {Promise<unknown>}
 */
export async function saveTDL(url, isOversea, proxyAddr) {
    return new Promise((resolve, reject) => {
        const proxyStr = isOversea ? `` : `--proxy ${ proxyAddr }`;
        const command = `tdl forward --from ${ url } ${ proxyStr }`
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`[R插件][TDL保存]执行出错: ${ error.message }`);
                return;
            }
            if (stderr) {
                reject(`[R插件][TDL保存]错误信息: ${ stderr }`);
                return;
            }
            resolve(stdout);
        })
    })
}
