/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

const express = require('express');
const cookieParser = require('cookie-parser');
//  const exformidable = require('express-formidable');

const app = express();
const port = 3000;
app.use(express.json());
app.use(cookieParser());
//  app.use(exformidable());

const fs = require('fs');
const formidable = require('formidable');
const exURL = require('./exURL');

function config() {
  const configFile = './config.json';
  return JSON.parse(fs.readFileSync(configFile));
}

require('./backend/config')(app, exURL, config, fs);

function loggedIn(req, res) {
  if (req.cookies.password != config().password) {
    res.sendFile(__dirname + '/frontend/login.html');
    return false;
  } else {
    return true;
  }
}

async function exists(req, type, callback) {
  fs.access(exURL.requestLocalDir(req), fs.constants.F_OK, (err) => {
    //  finds out if file or folder exists
    if (err) {
      callback(false);
    } else {
      // if exists
      if (type == 'dir' && fs.lstatSync(exURL.requestLocalDir(req)).isDirectory()) {
        callback(true);
      } else if (fs.lstatSync(exURL.requestLocalDir(req)).isFile()) {
        // is file, is it readable?

        extension = exURL.fileFromUrl(req).split('.')[1];
        // eg yml

        if (type == 'text' && config().textdocument.indexOf(extension) >= 0) {
          callback(true);
        } else if (type == 'file') {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    }
  });
}

app.get('/', function(req, res) {
  if (loggedIn(req, res)) {
    res.sendFile(__dirname + '/frontend/client.html');
  }
});

app.post('/login', function(req, res) {
  pw = req.body.pw;
  if (pw == config().password) {
    res.cookie('password', pw);
    res.send('success');
  } else {
    res.send('fail');
  }
});

app.get('/logout', function(req, res) {
  res.clearCookie('password');
  res.redirect(exURL.halfUrl(req));
});


app.get('/:file.js', function(req, res) {
  if (config().jsfiles.indexOf(req.params.file) >= 0) {
    res.sendFile(__dirname + '/frontend/' + req.params.file + '.js');
  } else {
    res.status(404).send('file not found');
  }
});

app.post('/save/:dir(*)', function(req, res) {
  //  post request to save/update a file
  if (loggedIn(req, res)) {
    fs.writeFile(exURL.requestLocalDir(req), req.body.data, function(err) {
      if (err) {
        res.send('failed try again');
      } else {
        res.send('success');
      }
    });
  }
});

app.get('/delete/:dir(*)', function(req, res) {
  //  get request to delete a file
  if (loggedIn(req, res)) {
    fs.unlink(exURL.requestLocalDir(req), function(err) {
      res.redirect(exURL.move(exURL.urlwithoutFile(req), 'delete', 'files'));
    });
  }
});

app.post('/upload/:dir(*)', (req, res) => {
  if (loggedIn(req, res)) {
    new formidable.IncomingForm().parse(req)
        .on('fileBegin', (name, file) => {
          file.path = exURL.requestAbsoluteDir(req) + file.name;
        })
        .on('error', (err) => {
          res.send(err);
        })
        .on('end', () => {
          res.redirect(exURL.move(exURL.urlwithoutFile(req), 'upload', 'files'));
        });
  }
});

app.get('/files/:dir(*)', function(req, res) {
  if (loggedIn(req, res)) {
    exists(req, 'dir', function(exists) {
      if (exists) {
        fs.readdir(exURL.requestLocalDir(req), (err, files) => {
        // form to upload file
          res.write('<html><body>');
          res.write('<form action="'+exURL.halfUrl(req)+'/upload/'+exURL.urlDir(req)+'" method="post" enctype="multipart/form-data" >');
          res.write('<input type="file" name="filetoupload">');
          res.write('<input type="submit">');
          res.write('</form>');
          for (i = 0; i < files.length; i++) {
          //  generate a list of files in directory
            const deleteUrl = exURL.halfUrl(req)+'/delete/'+exURL.urlDir(req)+files[i];
            const downloadUrl = exURL.halfUrl(req)+'/dl/'+exURL.urlDir(req)+files[i];

            let fileUrl;

            extension = files[i].split('.')[1];

            if (fs.lstatSync(exURL.requestLocalDir(req)+files[i]).isDirectory()) {
              fileUrl = exURL.halfUrl(req)+'/files/'+exURL.urlDir(req)+files[i] + '/';
            } else if (config().textdocument.indexOf(extension) >= 0) {
              fileUrl = exURL.halfUrl(req)+'/edit/'+exURL.urlDir(req)+files[i];
            } else {
              fileUrl = exURL.halfUrl(req)+'/dl/'+exURL.urlDir(req)+files[i];
            }

            res.write('<a href="'+deleteUrl+'">[delete]</a> ');
            res.write('<a href="'+downloadUrl+'">[download]</a> ');
            res.write('<a href="'+fileUrl+'">' +files[i]+ '</a><br>');
          }
          res.write('</html></body>');
          res.end();
        });
      } else {
        res.send('file or folder doesnt exist');
      }
    });
  }
});

app.get('/edit/:dir(*)', function(req, res) {
  // put the ducument in a textarea so client can edit it
  if (loggedIn(req, res)) {
    exists(req, 'text', function(exists) {
      if (exists) {
        const file = fs.readFileSync(exURL.requestAbsoluteDir(req));
        res.write('<html><body>');
        res.write('<script src="' + exURL.halfUrl(req) + '/edit.js' + '"></script>');
        res.write('<button onclick="save()">Save</button>');
        res.write('<p id=response></p>');
        res.write('<textarea id="ta" style="width:100%;height:90%;">');
        res.write(file);
        res.write('</textarea>');
        res.write('</body></html>');
        res.end();
      }
    });

    exists(req, 'dir', function(exists) {
      if (exists) {
        res.redirect(exURL.move(exURL.fullUrl(req), 'edit', 'files'));
      }
    });
  }
});

app.get('/raw/:dir(*)', function(req, res) {
  //  return the file
  if (loggedIn(req, res)) {
    exists(req, 'text', function(exists) {
      if (exists) {
        const file = fs.readFileSync(exURL.requestAbsoluteDir(req));
        res.send(file.toString());
      }
    });
  }
});

app.get('/dl/:dir(*)', function(req, res) {
  //  download the file
  if (loggedIn(req, res)) {
    exists(req, 'file', function(exists) {
      if (exists) {
        res.download(exURL.requestAbsoluteDir(req));
      }
    });
  }
});

app.listen(port, () => console.log(`listening on port ${port}`));
