'use strict';
const router = require('express').Router();
const mongoose = require("mongoose");
const fs = require("fs");
const Busboy = require('busboy');
// var multer  = require('multer');
// var upload = multer({ dest: 'upload/'});
const User = require('../models/user');
const async = require('async');

let Grid = require("gridfs-stream");
let conn = mongoose.connection;
Grid.mongo = mongoose.mongo;
let gfs;
// var type = upload.single('recfile');

conn.once("open", () => {
    console.log('gridfs stream open');
    gfs = Grid(conn.db);
    router.route('/upload')
    
.get((req, res, next) => {
      res.send('Hello Sheel !');
    });
    
//     router.get('/upload/img/:imgname', (req, res) => {
//         gfs.files.find({
//             filename: req.params.imgname
//         }).toArray((err, files) => {

//             if (files.length === 0) {
//                 return res.status(400).send({
//                     message: 'File not found'
//                 });
//             }
//             let data = [];
//             let readstream = gfs.createReadStream({
//                 filename: files[0].filename
//             });

//             readstream.on('data', (chunk) => {
//                 data.push(chunk);
//             });

//             readstream.on('end', () => {
//                 data = Buffer.concat(data);
//                 let img = 'data:image/png;base64,' + Buffer(data).toString('base64');
//                 res.end(img);
//             });

//             readstream.on('error', (err) => {
//                 console.log('An error occurred!', err);
//                 throw err;
//             });
//         });
//     });
    
//     router.post('/upload/img', (req, res) => {
//         var writestream = gfs.createWriteStream({
//         filename: 'mongo_file.jpg',
//         mode: 'w'
//     });
    
//     fs.createReadStream('/test/brads-shit.jpg').pipe(writestream);
 
//     writestream.on('close', function (file) {
//         // do something with `file`
//         console.log(file.filename + 'Written To DB');
//     });
//         // let part = req.files.file;
//         // let writeStream = gfs.createWriteStream({
//         //     filename: 'img_' + part.name,
//         //     mode: 'w',
//         //     content_type: part.mimetype
//         // });

//         // writeStream.on('close', (file) => {
//         //     return res.status(200).send({
//         //         message: 'Success',
//         //         file: file
//         //     });
//         // });

//         // writeStream.write(part.data);

//         // writeStream.end();
//     });
// });

router.post('/upload/img', function(req, res, next) {
  var busboy = new Busboy({ headers : req.headers });
  var fileId =  mongoose.Types.ObjectId();
  var ownerId = req.user._id;


  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    console.log('got file', filename, mimetype, encoding);
    var writeStream = gfs.createWriteStream({
      _id: fileId,
      owner: ownerId,
      filename: filename,
      mode: 'w',
      content_type: mimetype,
    });
    file.pipe(writeStream);
  }).on('finish', function(user, callback) {
      const imgURL = '/upload/img/' + fileId.toString();
      User.findOne({ _id: req.user._id }, function(err, user) {
        if (user) {
          var oldgId = user.photo.match(/([^/]+)$/ig).toString();
          gfs.remove({ _id: oldgId });
          user.photo = imgURL;
          user.save(function(err) {
            req.flash('success', 'Your picture has been updated');
          });
        }
      });
    // show a link to the uploaded file
    // res.writeHead(200, {'content-type': 'image/jpeg'});
    // res.end('<a href="/upload/img/' + fileId.toString() + '">download file</a>');
  });

  req.pipe(busboy);
});

router.get('/upload/form', function(req, res) {
  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/file" enctype="multipart/form-data" method="post">'+
    '<input type="file" name="file"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
});

router.get('/upload/img/:id', function(req, res) {
  gfs.findOne({ _id: req.params.id }, function (err, file) {
    if (err) return res.status(400).send(err);
    if (!file) return res.status(404).send('');

    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');

    var readstream = gfs.createReadStream({
      _id: file._id
    });

    readstream.on("error", function(err) {
      console.log("Got error while processing stream " + err.message);
      res.end();
    });

    readstream.pipe(res);
  });
});

});

module.exports = router;