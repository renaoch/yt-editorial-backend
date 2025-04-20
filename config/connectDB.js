
const { createClient } = require("@supabase/supabase-js");


const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY; 


const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  try {
    
    const { data, error } = await supabase
      .from("users") 
      .select("*")
      .limit(1);

    if (error) throw new Error(error.message);

    console.log("DB connected successfully");
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
