import { Request, Response } from 'express';
import Artwork from '../models/Artwork';
import fs from 'fs';
import path from 'path';

export const getArtworks = async (req: Request, res: Response) => {
  try {
    const artworks = await Artwork.find();
    res.json(artworks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createArtwork = async (req: Request, res: Response) => {
    try {
        const {
            title,
            artist,
            year,
            metadata,
            transform,
            frame,
            mat
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Artwork image is required' });
        }

        const artwork = new Artwork({
            title,
            artist,
            year,
            imageUrl: `/uploads/${req.file.filename}`,
            metadata: JSON.parse(metadata),
            transform: JSON.parse(transform),
            frame: JSON.parse(frame),
            mat: JSON.parse(mat),
        });

        const newArtwork = await artwork.save();
        res.status(201).json(newArtwork);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateArtwork = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingArtwork = await Artwork.findById(id);
        if (!existingArtwork) {
            return res.status(404).json({ message: 'Artwork not found' });
        }

        // If a new file is uploaded, delete the old one
        if (req.file) {
            const oldImagePath = path.join(__dirname, '../../public', existingArtwork.imageUrl);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const updatedData = { ...req.body };
        if(req.file) {
            updatedData.imageUrl = `/uploads/${req.file.filename}`;
        }
        
        // Parse stringified JSON fields from form-data
        if (updatedData.metadata) updatedData.metadata = JSON.parse(updatedData.metadata);
        if (updatedData.transform) updatedData.transform = JSON.parse(updatedData.transform);
        if (updatedData.frame) updatedData.frame = JSON.parse(updatedData.frame);
        if (updatedData.mat) updatedData.mat = JSON.parse(updatedData.mat);

        const updatedArtwork = await Artwork.findByIdAndUpdate(id, updatedData, { new: true });
        res.json(updatedArtwork);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteArtwork = async (req: Request, res: Response) => {
  try {
    const deletedArtwork = await Artwork.findByIdAndDelete(req.params.id);
    if (!deletedArtwork) return res.status(404).json({ message: 'Artwork not found' });

    // Delete the image file from storage
    const imagePath = path.join(__dirname, '../../public', deletedArtwork.imageUrl);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Artwork deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};