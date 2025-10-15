import { Schema, model, Document } from 'mongoose';

interface IScenario extends Document {
  name: string;
  imageUrl: string;
}

const scenarioSchema = new Schema<IScenario>(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Scenario = model<IScenario>('Scenario', scenarioSchema);

export default Scenario;
