import * as multer from 'multer';
import * as fs from 'fs';

const accepted_extensions = ['jpg', 'jpeg', 'png', 'heic', 'JPG', 'JPEG', 'PNG', 'HEIC'];

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
        fileSize: 5 * 1024 * 1024,
        file: 1,
      },
      fileFilter: (req, file, cb) => {
        // if the file extension is in our accepted list
        if (accepted_extensions.some(ext => file.originalname.endsWith("." + ext))) {
          return cb(null, true);
        }
    
        // otherwise, return error
        return cb({ message: 'Only ' + accepted_extensions.join(", ") + ' files are allowed!' })
      }
  }).single('image')(req, res, callback)
}

export function removeFile(path){
  if (path) {
    fs.unlinkSync(path);
  }
};

export function getDataUrl(imageUrl) {
  if(imageUrl){
    let encoding = 'base64';
    let [mimeType, imagePath] = imageUrl.split(':');
    let imageString = fs.readFileSync(imagePath, encoding);
    return "data:" + mimeType + ";"+encoding+"," + imageString;
  }
  return imageUrl;
}
