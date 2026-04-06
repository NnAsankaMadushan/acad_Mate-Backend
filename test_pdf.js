const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
    try {
        const filePath = 'D:\\Project\\Ravindu\\backend\\src\\Pastpapers\\Grade 01\\Buddhism\\2021-Grade-01-Buddhism-3rd-Term-Test-Paper-Ediriweera-Sarachchandra-College.pdf';
        const dataBuffer = fs.readFileSync(filePath);
        
        // Convert to Uint8Array
        const uint8Array = new Uint8Array(dataBuffer);
        
        // Create parser instance
        const parser = new PDFParse(uint8Array);
        
        // Get info
        const info = await parser.getInfo();
        console.log('Successfully parsed PDF');
        console.log('Info object:', info);
        console.log('Number of pages:', info.pages);
        
        // Clean up
        await parser.destroy();
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
