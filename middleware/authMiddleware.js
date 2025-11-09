exports.isSupplier = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'supplier') {
    // Handle session expired or invalid access
    if (req.originalUrl.startsWith('/api')) {
      // If it’s an API request, send JSON
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    } else {
      // If it’s a page route, redirect to login
      return res.redirect('/login');
    }
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    } else {
      return res.redirect('/login');
    }
  }
  next();
};
