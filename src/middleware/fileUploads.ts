import * as multer from 'multer';

import {ImageType} from "../types/ImageType";
import { removeAllFiles, removeFile } from '../modules/fileHelpers';

const FILETYPES = ['jpg', 'jpeg', 'png'];
const MAXSIZE = 10;

export function uplodActivityCoverImage(req, res, next) {
    const storage = getStorage("public/original", "activityImage");
    uploadFile(req, res, next, storage, 50); 
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

function uploadFile(req, res, next, storage, compressionRate){
    multer({
        storage: storage,
        limits: {
            fileSize: MAXSIZE * 1024 * 1024,
            file: 1,
        },
        fileFilter: (req, file, cb) => {
            // if the file extension is in our accepted list
            if (FILETYPES.some(ext => file.originalname.toLowerCase().endsWith("." + ext))) {
            return cb(null, true);
            }
        
            // otherwise, return error
            return cb({ message: 'Only ' + FILETYPES.join(", ") + ' files are allowed!' });
        }
    }).single('image')(req, res, async (err) => {
        if (err) {
            console.error("Error in multer: ", err);
            const errorMessage = handleMulterError(err);
            res.status(400).send(errorMessage);
            return;
        }

        const {pathToSave, newFilePaths, compressionDone} = await compressAndResizeImage(req.file, 50)
        removeFile(req.file);  // Remove the original file.

        if (!compressionDone) {
            removeAllFiles(newFilePaths);
            res.status(400).send({message: "Could not upload image"});
            return;
        }
        req.body["imageUrl"] = pathToSave;

        next();
    })
  }

function handleMulterError(error) {
    let errorMessage;
    if (error.code === "LIMIT_FILE_SIZE") {
      errorMessage = {
        type: error.name,
        message: `Image size too large, must be smaller than ${MAXSIZE} MB`
      }
    } else if (error.message) {
      errorMessage = {
        type: error.name,
        message: error.message,
        details: error
      }
    } else {
      errorMessage = {
        type: error.name,
        message: "Could not parse form data",
        details: error,
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