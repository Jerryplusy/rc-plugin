/**
 * 判断某个key是否存在
 * @param key
 * @returns {Promise<boolean>}
 * @example
 * const exists = await redisExistKey('myKey');
 * console.log(exists); // true or false
 */
export async function redisExistKey(key) {
  return redis.exists(key);
}

/**
 * 获取某个key的值
 * @param key
 * @returns {Promise<Object>}
 * @example
 * const value = await redisGetKey('myKey');
 * console.log(value); // { ... }
 */
export async function redisGetKey(key) {
  return JSON.parse(await redis.get(key));
}

/**
 * 为某个key设置值，value必须是个键值对
 * @param key
 * @param value
 * @returns {Promise<*>}
 * @example
 * await redisSetKey('myKey', { foo: 'bar' });
 */
export async function redisSetKey(key, value = {}) {
  return redis.set(key, JSON.stringify(value));
}
