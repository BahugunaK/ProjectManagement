const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. CREATE_TASK, UPDATE_PROJECT
    entityType: { type: String, required: true }, // e.g. Task, Project, User
    entityId: { type: mongoose.Schema.Types.ObjectId },
    method: String,
    route: String,
    statusCode: Number,
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
