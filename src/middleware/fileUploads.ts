import * as multer from 'multer';

import {ImageType} from "../types/ImageType";
import { removeAllFiles, removeFile } from '../modules/helpers';

const IMAGETYPES = ['jpg', 'jpeg', 'png'];
const FILETYPES = ['csv'];
const MAXSIZE = 10;

export function uploadActivityCoverImage(req, res, next) {
    const storage = getStorage("public/original", "activityImage");
    uploadFile(req, res, next, storage, IMAGETYPES, 'image'); 
}

export function uploadEventCoverImage(req, res, next) {
  const storage = getStorage("public/original", "eventImage");
  uploadFile(req, res, next, storage, IMAGETYPES, 'image');
}

export function uploadUserProfileImage(req, res, next) {
  const storage = getStorage("public/original", "profileImage");
  uploadFile(req, res, next, storage, IMAGETYPES, 'image');
}

export function uploadCsvFile(req, res, next) {
  const storage = getStorage("public/original", "new_file");
  uploadFile(req, res, next, storage, FILETYPES, "file");
}

export function processFormDataWithoutFile(req, res, next) {
  multer().none()(req, res, (err) => {
    if (err) {
      console.error("Error in multer without file:", err);
      res.status(400).send({
        type: err.name,
        message: "Could not process input data"})
      return;
    }
    next();
  });
}

export function compressProfileImage(req, res, next) {
  performCompression(req, res, next, 40);
}

export function compressCoverImage(req, res, next) {
  performCompression(req, res, next, 50);
}

async function performCompression(req, res, next, compressionRate) {
  const {pathToSave, newFilePaths, compressionDone} = await compressAndResizeImage(req.file, compressionRate)
  removeFile(req.file);  // Remove the original file.
  if (!compressionDone) {
      removeAllFiles(newFilePaths);
      res.status(400).send({message: "Could not upload image"});
      return;
  }
  req.body["imageUrl"] = pathToSave;
  next();
}

function getStorage(folder: string, filePrefix:string) {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, folder)
        },
        filename: function (req, file, cb) {
          let ext = file.originalname.split('.').pop().toLowerCase();
          cb(null, filePrefix + '-' + Date.now() + "." + ext);
        }
      })
    return storage;
}

function uploadFile(req, res, next, storage, fileTypes, fieldName){
    multer({
        storage: storage,
        limits: {
            fileSize: MAXSIZE * 1024 * 1024,
            file: 1,
        },
        fileFilter: (req, file, cb) => {
            // if the file extension is in our accepted list
            if (fileTypes.some(ext => file.originalname.toLowerCase().endsWith("." + ext))) {
            return cb(null, true);
            }
        
            // otherwise, return error
            return cb({ message: 'Only ' + fileTypes.join(", ") + ' files are allowed!', field: "image", code: "NOT_SUPPORTED_TYPE"});
        }
    }).single(fieldName)(req, res, async (err) => {
        if (err) {
            console.error("Error in multer: ", err);
            const errorMessage = handleMulterError(err);
            res.status(400).send(errorMessage);
            return;
        }
        if (req.file) {
          req.body["fileUrl"] = req.file.path;
        }
        next();
    })
  }

function handleMulterError(error) {
  let errorMessage;
  if (error.field === "image") {
    if (error.code === "LIMIT_FILE_SIZE") {
      errorMessage = {
        type: error.name,
        message: `Image size too large, must be smaller than ${MAXSIZE} MB`
      }
    } else if (error.code === "NOT_SUPPORTED_TYPE") {
      errorMessage = {
        type: error.name,
        message: error.message
      }
    } else {
      errorMessage = {
        type: error.name,
        message: "Could not upload the image",
      }
    }
  } else {
    errorMessage = {
      type: error.name,
      message: "Could not parse the input data",
    }
  }
  return errorMessage;
}

export async function compressAndResizeImage(file, compressQuality=50) {
let newFilePaths;
let compressionDone;
let pathToSave;

if (file){
    newFilePaths = ["public/compressed/"+file.filename, "public/miniature/"+file.filename];
    compressionDone = await resizeAndCompress(file.path, compressQuality).then(compressedPath => {
    pathToSave = file.mimetype+":"+compressedPath;
    return true;
    }).catch(error => {
    console.error("Error during image compression: ", error);
    pathToSave = null;
    return false;
    })
} else {
    compressionDone = true;
    newFilePaths = []
    pathToSave = null;
}
return {newFilePaths, compressionDone, pathToSave}
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
    // quality: 100 best, 0 worst
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