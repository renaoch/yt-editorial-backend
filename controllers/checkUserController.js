const checkUserStatus = (req, res) => {
  if (!req.user) {
    
    return res.status(401).json({ message: "User not logged in" });
  }

  
  if (!req.user.role) {
    
    return res
      .status(200)
      .json({ message: "No role assigned", redirectTo: "/role" });
  }
 console.log("inside checkUserStatus controller", req.user)
  
  return res.status(200).json({
    message: "User has a role",
    userRole: req.user.role,
    redirectTo: "/app", 
    userName: req.user.name, 
    userEmail: req.user.email, 
    userAvatar: req.user.avatar,
    userId: req.user._id, 
  });
};

module.exports = { checkUserStatus };
