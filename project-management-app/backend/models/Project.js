const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: {
      type: String,
      enum: ['Active', 'OnHold', 'Completed', 'Archived'],
      default: 'Active',
    },
    deadline: { type: Date },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
