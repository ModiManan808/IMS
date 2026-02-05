const fs = require('fs');

const MAGIC_NUMBERS = {
    pdf: '25504446', // %PDF
    jpg: 'ffd8ff',   // JPEG
    png: '89504e47'  // PNG
};

exports.validateMagicNumber = (filePath, allowedTypes) => {
    try {
        const buffer = fs.readFileSync(filePath);
        const hex = buffer.toString('hex', 0, 4);
        
        for (const type of allowedTypes) {
            if (hex.startsWith(MAGIC_NUMBERS[type])) return true;
        }
        
        // Clean up invalid file immediately
        fs.unlinkSync(filePath);
        return false;
    } catch (err) {
        return false;
    }
};