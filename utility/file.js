const fs = require("fs");
const settings = require("../settings");
const path = require("path");

exports.deleteFile = filePath => {
  fs.unlink(path.join(settings.PROJECT_DIR, filePath), err => {
    if (err) {
      throw err;
    }
  });
};
