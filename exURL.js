/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

module.exports = {
  urlwithoutFile: function(req) {
    return module.exports.fullUrl(req).replace(module.exports.fileFromUrl(req), '');
    // eg http://192.168.0.88:3000/delete/1.8.8/
  },

  move: function(url, from, to) {
    return url.replace(from, to);
    // eg http://192.168.0.88:3000/files/1.8.8/config.yml
  },

  fileFromUrl: function(req) {
    const findfile = module.exports.fullUrl(req).split('/');
    return findfile[findfile.length-1];
    //  eg help.yml
  },

  halfUrl: function(req) {
    return req.protocol + '://' + req.get('host');
    //  eg http://192.168.0.88:3000
  },

  fullUrl: function(req) {
    return module.exports.halfUrl(req) + req.originalUrl;
    //  eg http://192.168.0.88:3000/delete/1.8.8/help.yml
  },

  requestLocalDir: function(req) {
    return './servers/' + req.params.dir;
    // eg ./servers/1.8.8/config.yml
  },

  requestAbsoluteDir: function(req) {
    return __dirname + '/servers/' + req.params.dir;
    // eg /Users/nick/Desktop/MC/servers/1.8.8/config.yml
  },

  urlDir: function(req) {
    dir = req.params.dir;

    if (dir.charAt(dir.length-1) != '/') {
      dir += '/';
    }

    return dir;
    // eg 1.8.8/
  },

};
