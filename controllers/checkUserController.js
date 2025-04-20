const checkUserStatus = (req, res) => {
  console.log("checkUserStatus hit");

  if (!req.user) {
    console.log("No user found in req");
    return res.status(401).json({ message: "User not logged in" });
  }

  console.log("User found:", req.user);

  if (!req.user.role) {
    console.log("User has no role assigned yet");
    return res
      .status(200)
      .json({ message: "No role assigned", redirectTo: "/role" });
  }

  console.log("User has a role:", req.user.role);
  console.log("User details:");
  console.log("Name:", req.user.name);
  console.log("Email:", req.user.email);
  console.log("Avatar:", req.user.avatar);
  console.log("ID:", req.user._id);

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
