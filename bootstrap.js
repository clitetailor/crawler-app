function bootstrap (app) {
  Object.keys(app).forEach(componentName => {
    const Component = app[componentName];
    const crawlInstance = new Component();
    crawlInstance.run();
  });
}

module.exports = bootstrap;