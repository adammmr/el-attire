const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, '..', 'views', 'public_pages');
const ejsDir = path.join(__dirname, '..', 'views', 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(ejsDir)) {
    fs.mkdirSync(ejsDir, { recursive: true });
}

// Read all HTML files
fs.readdir(htmlDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.html')) {
            const htmlFilePath = path.join(htmlDir, file);
            const ejsFileName = file.replace('.html', '.ejs');
            const ejsFilePath = path.join(ejsDir, ejsFileName);
            
            // Read HTML content
            fs.readFile(htmlFilePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading ${file}:`, err);
                    return;
                }
                
                // Extract body content (between body tags)
                const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                let bodyContent = bodyMatch ? bodyMatch[1] : data;
                
                // Remove header and footer if they exist (you'll need to customize this)
                // This is a basic example - you may need to adjust based on your HTML structure
                
                // Write EJS file
                fs.writeFile(ejsFilePath, bodyContent, 'utf8', (err) => {
                    if (err) {
                        console.error(`Error writing ${ejsFileName}:`, err);
                    } else {
                        console.log(`Converted: ${file} -> ${ejsFileName}`);
                    }
                });
            });
        }
    });
});

console.log('HTML to EJS conversion complete!');