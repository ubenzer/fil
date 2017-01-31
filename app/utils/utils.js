
export class Utils {
  requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
  }
}
const utils = new Utils();
export default utils;
