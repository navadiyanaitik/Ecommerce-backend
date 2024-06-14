const AWS = require("aws-sdk");
const ID = process.env.S3_ACCESS_ID;
const SECRET = process.env.S3_SCRETE_KEY;
const REGION = process.env.AWS_REGION;
const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
  region: REGION,
});

const uploadFile = (bucketName, file, fileName) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file.data,
      ContentType: file.mimetype,
    };
    s3.upload(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data?.location);
      }
    });
  });
};

const deleteFile = (bucket, url) => {
  console.log("🚀 ~ deleteFile ~ bucket, url:", bucket, url);
  return new Promise((resolve, reject) => {
    try {
      const params = {
        Bucket: bucket,
        Key: url,
      };

      s3.deleteObject(params, function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
        console.log(
          "🚀 ~ ------------------------------------------------data:"
        );
      });
    } catch (error) {
      console.log("error--------------------", error);
    }
  });
};

const getSignedURL = (bucketName, imgName) => {
  const params = {
    Bucket: bucketName,
    Key: imgName,
  };

  const signedUrl = s3
    .getSignedUrlPromise("getObject", params)
    .then((url) => {
      return url;
    })
    .catch((err) => {
      console.log("getting error on gernerating preSignedUrl", err);
    });
  return signedUrl;
};

module.exports = {
  uploadFile,
  deleteFile,
  getSignedURL,
};
