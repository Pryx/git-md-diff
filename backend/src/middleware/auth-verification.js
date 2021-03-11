export default (req, res, next) => {
  const { user } = req;
  if (!user) {
    res.status(403).json({
      success: false,
    });
  } else {
    next();
  }
};
