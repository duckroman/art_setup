import { Schema, model, Document } from 'mongoose';

interface IScenario extends Document {
  name: string;
  imageDataUrl: string;
}

const scenarioSchema = new Schema<IScenario>(
  {
    name: { type: String, required: true },
    imageDataUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Scenario = model<IScenario>('Scenario', scenarioSchema);

export default Scenario;
