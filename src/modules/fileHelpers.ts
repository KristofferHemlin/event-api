import * as multer from 'multer';

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

export function uploadFile(req, res, storage, callback){
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
    }).single('image')
}
