import { forbidden } from '../utils/errors.js';

export function requireRoles(...roles) {
  return (req, _res, next) => {
    const user = req.auth?.user;
    if (!user || !roles.includes(user.role)) {
      throw forbidden();
    }
    next();
  };
}

export function requireSuperAdmin(req, _res, next) {
  if (req.auth?.user?.role !== 'super_admin') {
    throw forbidden();
  }
  next();
}

export function requireClubAdminOf(clubIdGetter) {
  return (req, _res, next) => {
    const user = req.auth?.user;
    const clubId = typeof clubIdGetter === 'function' ? clubIdGetter(req) : clubIdGetter;
    if (!user) {
      throw forbidden();
    }
    if (user.role === 'super_admin') {
      return next();
    }
    if (user.role === 'club_admin' && user.club_id === clubId) {
      return next();
    }
    throw forbidden();
  };
}