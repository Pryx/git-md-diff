export const verifyAuth = (req, res, next) => {
  const user = req.user
  if (!user) {
    return res.status(403).json({
      success: false
    })
  } else {
    next()
  }
}
