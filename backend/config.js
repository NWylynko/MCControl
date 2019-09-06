/* eslint-disable max-len */
module.exports = function(app, exURL, config, fs) {
  app.get('/config/:var', function(req, res) {
    if (req.params.var != 'password') {
      res.send(config()[req.params.var].toString());
    } else {
      res.status(404).send('not found');
    }
  });

  app.get('/config', function(req, res) {
    res.write('<html><body>');

    //  change current version
    res.write('version: ');
    res.write('<select id="select_version">');
    for (i = 0; i < config().versions.length; i++) {
      if (config().versions[i] == config().version) {
        res.write('<option value="' + config().versions[i] + '" selected>' + config().versions[i] +'</option>');
      } else {
        res.write('<option value="' + config().versions[i] + '">' + config().versions[i] +'</option>');
      }
    }
    res.write('</select>');

    res.write('<br><br>');

    //  change password
    res.write('password: ');
    res.write('<input id="input_password" type="text" value="' + config().password + '">');

    res.write('<br><br>');

    //  script to save config
    res.write('<script src="' + exURL.halfUrl(req) + '/config.js' + '"></script>');
    res.write('<button onclick="save()">Save</button>');
    //  res.write('<button onclick="gotofiles()">Files</button>');
    res.write('<p id=response ></p>');

    res.write('</body></html>');
    res.end();
  });

  app.post('/config', function(req, res) {
    file = './config.json';

    newConfig = config();
    newConfig.version = req.body.version;
    newConfig.password = req.body.password;

    fs.writeFile(file, JSON.stringify(newConfig), function(err) {
      if (err) {
        res.send('failed, try again');
      } else {
        res.send('success');
      }
    });
  });
};
