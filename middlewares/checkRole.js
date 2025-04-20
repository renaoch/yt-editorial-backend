const ensureRoleNotAssigned = (req, res, next) => {
  console.log("req.user in middleware: ",req.user)
  if (req.user && req.user.role) {
    console.log(req.user);
    const redirectUrl = process.env.REDIRECT_URL + "/app";
  }
  next();
};

module.exports = ensureRoleNotAssigned;
