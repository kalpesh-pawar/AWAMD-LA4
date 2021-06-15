const express = require("express");
const app = express();
const fs = require("fs");
const mongodb = require('mongodb');
const url = 'mongodb://user:password@db:27017';

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index1.html");
});
app.get("/contacts", function (req, res) {
    res.sendFile(__dirname + "/views/contact.html");
  });
  
// Sorry about this monstrosity
app.get('/init-video', function (req, res) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/songs", function (error, client) {
    if (error) {
      res.json(error);
      return;
    }
    const db = client.db('songs');
    const bucket = new mongodb.GridFSBucket(db);
    const videoUploadStream = bucket.openUploadStream('bigbuck1');
    const videoReadStream = fs.createReadStream('./views/bigbuck.mp4');
    //console.log(videoReadStream)
    videoReadStream.pipe(videoUploadStream);
    console.log('append')
    res.status(200).send("Done...");
  });
});

app.get("/mongo-video", function (req, res) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/", function (error, client) {
    if (error) {
      res.status(500).json(error);
      return;
    }

    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }

    const db = client.db('songs');
    // GridFS Collection
    db.collection('fs.files').findOne({}, (err, video) => {
        console.log('SONG')
      if (!video) {
          console.log("no video")
        res.status(404).send("No video uploaded!");
        return;
      }

      // Create response headers
      const videoSize = video.length;
      const start = Number(range.replace(/\D/g, ""));
      const end = videoSize - 1;

      const contentLength = end - start + 1;
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
      };

      // HTTP Status 206 for Partial Content
      res.writeHead(206, headers);

      const bucket = new mongodb.GridFSBucket(db);
      const downloadStream = bucket.openDownloadStreamByName('bigbuck', {
        start
      });

      // Finally pipe video to response
      downloadStream.pipe(res);
    });
  });
});

app.listen(8000, function () {
  console.log("Listening on port 8000!");
});