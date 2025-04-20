const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function getAuthenticatedUser(req, res, next) {
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next(); 
  }

  
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", decoded.email) 
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; 

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = getAuthenticatedUser;
