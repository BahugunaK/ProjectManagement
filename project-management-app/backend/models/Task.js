const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: {
      type: String,
      enum: ['ToDo', 'InProgress', 'Completed'],
      default: 'ToDo',
    },
    dueDate: { type: Date },
    comments: [commentSchema],
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ project: 1, status: 1, priority: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
