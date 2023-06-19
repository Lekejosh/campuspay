
const redis = require("redis-promisify");

const client = redis.createClient({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
});

const logStruct = (func, error) => {
  return { func, file: "cacheLib", error };
};

client.on("error", (err) =>
  console.error(logStruct("Redis is not running", err))
);
client.on("ready", () => console.info("Redis is running"));

exports.set = async (key, value, expireIn) => {
  try {
    const response = await client.setAsync(key, JSON.stringify(value));
    if (expireIn)
      await client.expireatAsync(key, parseInt(+new Date() / 1000) + expireIn);
    return response;
  } catch (error) {
    console.error("Error -> ", logStruct("set", error));
    throw error;
  }
};
exports.get = async (key) => {
  try {
    const response = await client.getAsync(key);
    return response
  } catch (error) {
    console.error("Error -> ", logStruct("get", error));
    throw error;
  }
};

