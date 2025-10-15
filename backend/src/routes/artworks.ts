import { Router } from 'express';
import { getArtworks, createArtwork, updateArtwork, deleteArtwork } from '../controllers/artworkController';
import upload from '../middleware/upload';

const router = Router();

router.get('/', getArtworks);
router.post('/', upload.single('artworkImage'), createArtwork);
router.put('/:id', upload.single('artworkImage'), updateArtwork);
router.delete('/:id', deleteArtwork);

export default router;
