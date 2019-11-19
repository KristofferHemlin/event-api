import * as multer from 'multer';
import * as fs from 'fs';

const accepted_extensions = ['jpg', 'jpeg', 'png', 'heic'];
const maxFileSize = 10;

// Enum to specify image type
export enum ImageType {"ORIGINAL"="original", "COMPRESSED"="compressed", "MINIATURE"="miniature"}

export function getStorage(folder: string, filePrefix:string) {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, folder)
        },
        filename: function (req, file, cb) {
          let ext = file.originalname.split('.').pop().toLowerCase();
          cb(null, filePrefix + '-' + Date.now() + "." + ext)
        }
      })
    return storage
}

export function uploadFile(storage, req, res, callback){
  multer({
      storage: storage,
      limits: {
        fileSize: maxFileSize * 1024 * 1024,
        file: 1,
      },
      fileFilter: (req, file, cb) => {
        // if the file extension is in our accepted list
        if (accepted_extensions.some(ext => file.originalname.toLowerCase().endsWith("." + ext))) {
          return cb(null, true);
        }
    
        // otherwise, return error
        return cb({ message: 'Only ' + accepted_extensions.join(", ") + ' files are allowed!' })
      }
  }).single('image')(req, res, callback)
}

export function processFormDataNoFile(req, res, callback) {
  multer().none()(req, res, callback);
}

export function removeFile(path){
  if (path) {
    try {
    fs.unlinkSync(path);
    } catch (error) {
      console.error("Could not remove file:", path);
    }
  }
};

export function removeAllFiles(filePaths: string[]) {
  filePaths.map(filePath => {
    removeFile(filePath);
  })
}

export function getDataUrl(imageUrl, imageType?: ImageType) {
  if(imageUrl){
    if (imageType) {
      imageUrl = imageUrl.replace(ImageType.COMPRESSED, imageType);
    }
    let encoding = 'base64';
    let [mimeType, imagePath] = imageUrl.split(':');
    try {
      let imageString = fs.readFileSync(imagePath, encoding);
      return "data:" + mimeType + ";"+encoding+"," + imageString;
    } catch (error){
      console.log("Could not read file", imagePath)
      return null;
    }
  }
  return imageUrl;
}

export async function resizeAndCompress(filePath, compressQuality) {
  const outputPath = filePath.replace(ImageType.ORIGINAL, ImageType.MINIATURE)
  const result = await compressImage(filePath, compressQuality, "public/"+ImageType.COMPRESSED)
  const compressOutputpath = filePath.replace("original", ImageType.COMPRESSED);
  
  // Need to wait here, otherwhise the file won't have time to be saved before trying to get fetched.
  await resizeImage(filePath, outputPath, 200).then(data => {
    return compressImage(outputPath, 60, "public/"+ImageType.MINIATURE)
  });
  return compressOutputpath;

}

export async function compressImage(filePath, quality, outputPath?) {
  const imagemin = require('imagemin');
  const imageminMozjpeg = require('imagemin-mozjpeg');
  const imageminPngquant = require('imagemin-pngquant');
  
  const regEx = new RegExp("\\\\", "g"); // Need four \ to escape two \
  const newFilePath = filePath.replace(regEx, "/");

  const imageminConfig = {};
  if (outputPath) {
    imageminConfig["destination"] = outputPath
  }

  imageminConfig["plugins"] =  [
      imageminMozjpeg({quality: quality}),
      imageminPngquant({
        quality: [0.5, 0.6]
      })
    ]

  return imagemin([newFilePath], imageminConfig).then(files => {
    if (outputPath) {
      return outputPath;
    }
    return files[0].data;
  })

}

export async function resizeImage(filePath, outputPath, size) {
  const sharp = require('sharp');
  return sharp(filePath)
    .resize(size)
    .toFile(outputPath)
    .then(data => {
      return outputPath;
    })
    .catch(error => {
      console.error("Error while resizing image: ", error);
    })
}


export async function compressAndResize(file, compressQuality=50) {
  let newFilePaths;
  let compressionDone;
  let pathToSave;

  if (file){
    newFilePaths = ["public/compressed/"+file.filename, "public/miniature/"+file.filename];
    compressionDone = await resizeAndCompress(file.path, compressQuality).then(compressedPath => {
      pathToSave = file.mimetype+":"+compressedPath;
      return true;
    }).catch(error => {
      console.error("Error during image compression: ", error)
      return false;
    })
  } else {
    compressionDone = true;
    newFilePaths = []
    pathToSave = null;
  }
  return {newFilePaths, compressionDone, pathToSave}
}

export function handleMulterError(error) {
  let errorMessage;
  if (error.field === "image") {
    if (error.code === "LIMIT_FILE_SIZE") {
      errorMessage = {
        type: error.name,
        message: `Image size too large, must be smaller than ${maxFileSize} MB`
      }
    } else {
      errorMessage = {
        type: error.name,
        message: "Could not upload the image"
      }
    }
  } else {
    errorMessage = {
      type: error.name,
      message: "Could not parse the input data"
    }
  }
  return errorMessage;
}