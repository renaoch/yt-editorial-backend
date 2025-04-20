const { generateToken } = require("../utils/jwtUtils");
const {
  hashPassword,
  comparePassword,
} = require("../utils/securePasswordUtils"); 



exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    
    const hashedPassword = await hashPassword(password);

    
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    
    await newUser.save();

    
    const token = generateToken(newUser._id);

    
    return res.status(201).json({
      message: "User created successfully",
      user: { name: newUser.name, email: newUser.email },
      token,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    
    const token = generateToken(user._id);

    
    return res.json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


