const fs = require('fs');
const path = require('path');

// Function to remove comments from a file
const removeCommentsFromFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Remove single-line comments (//)
    let updatedContent = fileContent.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments (/* */)
    updatedContent = updatedContent.replace(/\/\*[\s\S]*?\*\//g, '');

    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Comments removed from ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
};

// Function to recursively go through the directory and process all .js files
const processDirectory = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursively process subdirectories
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      // Remove comments from .js files
      removeCommentsFromFile(fullPath);
    }
  });
};

// Start the process from the current working directory (i.e., root folder of your Express app)
processDirectory(__dirname);
