module.exports = {
  apps: [{
    name: "kannada-bible-obs",
    script: "server.js",
    cwd: __dirname,
    instances: 1,
    autorestart: true,
  }],
};
