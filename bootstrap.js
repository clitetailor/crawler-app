function bootstrap (app) {
  app.forEach(Component => {
    const crawlInstance = new Component();
    crawlInstance.run();
  });
}

module.exports = bootstrap;