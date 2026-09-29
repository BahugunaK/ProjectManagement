const AuditLog = require('../models/AuditLog');

/**
 * Attaches req.logAction(action, entityType, entityId, metadata) so controllers
 * can record meaningful audit events (not just raw HTTP access logs).
 * Failure to write an audit log never breaks the actual request.
 */
const auditLogger = (req, res, next) => {
  req.logAction = async (action, entityType, entityId, metadata = {}) => {
    try {
      await AuditLog.create({
        user: req.user ? req.user._id : undefined,
        action,
        entityType,
        entityId,
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        metadata,
        ipAddress: req.ip,
      });
    } catch (err) {
      console.error('Audit log write failed:', err.message);
    }
  };
  next();
};

module.exports = auditLogger;
