class NextLogger {
  constructor() {
    this.logger = console;
  }

  log() {
    var args = Array.prototype.slice.call(arguments);
    const date = new Date();
    args.unshift(`${date.toISOString()}`, `\x1b[35mlog:\x1b[0m`);
    this.logger.log.apply(this.logger, args);
  }

  info() {
    var args = Array.prototype.slice.call(arguments);
    const date = new Date();
    args.unshift(`${date.toISOString()}`, `\x1b[32minfo:\x1b[0m`);
    this.logger.info.apply(this.logger, args);
  }

  debug() {
    var args = Array.prototype.slice.call(arguments);
    const date = new Date();
    args.unshift(`${date.toISOString()}`, `\x1b[34mdebug:\x1b[0m`);
    this.logger.debug.apply(this.logger, args);
  }

  warn() {
    var args = Array.prototype.slice.call(arguments);
    const date = new Date();
    args.unshift(`${date.toISOString()}`, `\x1b[33mwarn:\x1b[0m`);
    this.logger.warn.apply(this.logger, args);
  }

  error() {
    var args = Array.prototype.slice.call(arguments);
    const date = new Date();
    args.unshift(`${date.toISOString()}`, `\x1b[31merror:\x1b[0m`);
    this.logger.error.apply(this.logger, args);
  }
}

module.exports = new NextLogger();