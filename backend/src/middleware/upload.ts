import multer from 'multer';
import path from 'path';

// Set up storage engine to use memory
const storage = multer.memoryStorage();

// Check File Type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb(new Error('Error: Images Only!'));
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 10000000}, // 10MB limit
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
});

export default upload;
