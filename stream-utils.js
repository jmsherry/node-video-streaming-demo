import split2 from "split2";
import through2 from "through2";
import stream from "stream";
import { promisify } from "util";
import axios from "axios";

// File Download
const finished = promisify(stream.finished);

export async function downloadFile(fileUrl, outputLocationPath) {
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then(async (response) => {
    response.data.pipe(writer);
    return await finished(writer);
  });
}

const threeSecondsOperation = (lines = [], delay = 3000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
};

const streamFile2 = async (filePath, promiseThunk, bufferSize = 100) => {
  return new Promise((resolve, reject) => {
    //create the NodeJS read stream
    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    //how many lines should we process at a time?
    let buffer = [];
    stream
      //ensure parsing line by line
      .pipe(split2())
      //ensure that the next chunk will be processed by the
      //stream only when we want to
      .pipe(
        through2((chunk, enc, callback) => {
          //put the chunk along with the other ones
          buffer.push(chunk.toString());
          if (buffer.length < bufferSize) {
            callback(); //next step, no process
          } else {
            //call the method that creates a promise, and at the end
            //just empty the buffer, and process the next chunk
            promiseThunk(buffer).finally(() => {
              buffer = [];
              callback();
            });
          }
        })
      )
      .on("error", (error) => {
        reject(error);
      })
      .on("finish", () => {
        //any remaining data still needs to be sent
        //resolve the outer promise only when the final batch has completed processing
        if (buffer.length > 0) {
          promiseThunk(buffer).finally(() => {
            resolve(true);
          });
        } else {
          resolve(true);
        }
      });
  });
};

export const processFileLineByLine = async (filePath) => {
  //create the function that returns a new Promise, and accepts an
  //array of lines as an argument
  const batchProcessorFunction = (lines) => threeSecondsOperation(lines);
  //call our method, passing the thunk as an argument.
  return streamFile2(filePath, batchProcessorFunction, 100);
};
