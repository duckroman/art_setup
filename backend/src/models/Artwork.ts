import { Schema, model, Document } from 'mongoose';

// --- INTERFACES ---
interface IFrameState {
  show: boolean;
  width: number;
  height: number;
  color: string;
}

interface IMatState {
  show: boolean;
  width: number;
  height: number;
}

interface ITransformState {
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotation: number;
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IArtwork extends Document {
  title: string;
  artist: string;
  year: number;
  imageUrl: string;
  metadata: {
      width: string;
      height: string;
  };
  transform: ITransformState;
  frame: IFrameState;
  mat: IMatState;
}

// --- SCHEMAS ---
const frameStateSchema = new Schema<IFrameState>({
  show: { type: Boolean, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  color: { type: String, required: true },
}, { _id: false });

const matStateSchema = new Schema<IMatState>({
  show: { type: Boolean, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const transformStateSchema = new Schema<ITransformState>({
  perspective: { type: Number, required: true },
  rotateX: { type: Number, required: true },
  rotateY: { type: Number, required: true },
  rotation: { type: Number, required: true },
  scale: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const artworkSchema = new Schema<IArtwork>(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    year: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    metadata: {
        width: { type: String, required: true },
        height: { type: String, required: true },
    },
    transform: { type: transformStateSchema, required: true },
    frame: { type: frameStateSchema, required: true },
    mat: { type: matStateSchema, required: true },
  },
  { timestamps: true }
);

const Artwork = model<IArtwork>('Artwork', artworkSchema);

export default Artwork;
