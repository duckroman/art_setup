import { Request, Response } from 'express';
import Scenario from '../models/Scenario';
import fs from 'fs';
import path from 'path';

export const getScenarios = async (req: Request, res: Response) => {
  try {
    const scenarios = await Scenario.find();
    res.json(scenarios);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createScenario = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Scenario image is required' });
        }

        const scenario = new Scenario({
            name: req.file.originalname, // Use original file name as default
            imageUrl: `/uploads/${req.file.filename}`,
        });

        const newScenario = await scenario.save();
        res.status(201).json(newScenario);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteScenario = async (req: Request, res: Response) => {
  try {
    const deletedScenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!deletedScenario) return res.status(404).json({ message: 'Scenario not found' });

    // Delete the image file from storage
    const imagePath = path.join(__dirname, '../../public', deletedScenario.imageUrl);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Scenario deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};