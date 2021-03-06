import express from "express";
import fs from "fs";

const app = express();

app.use(express.static("public"));

app.get("/video/bad/:name", function (req, res) {
  fs.readFile(`./videos/${req.params.name}`, (err, data) => {
    if (err) return res.status(500).send(err);
    res.end(data);
  });
});

app.get("/video/good/:name", function (req, res) {
  const { name } = req.params;
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
  }
  const videoPath = `./videos/${name}`;
  const videoSize = fs.statSync(videoPath).size;
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206 - Partial Content Success
  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});


app.all("*", (req, res) => {
  res.sendStatus(404);
});

app.listen(8000, function () {
  console.log("Listening at http://localhost:8000");
});
