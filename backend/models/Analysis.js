import mongoose from 'mongoose'

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: String,
  dataset: [{ label: String, value: Number }],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Analysis', analysisSchema)
