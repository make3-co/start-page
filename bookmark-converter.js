const fs = require('fs');
const { JSDOM } = require('jsdom');

/**
 * Converts HTML bookmarks file to your start page JSON format
 * Usage: node bookmark-converter.js <bookmarks.html> [output.json]
 */
function parseBookmarksHTML(htmlContent) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const groups = [];
    
    // Find all DL (definition list) elements which contain bookmarks
    const dlElements = document.querySelectorAll('DL');
    
    function processDL(dl, parentTitle = null) {
        const links = [];
        let currentGroup = null;
        
        Array.from(dl.children).forEach(child => {
            if (child.tagName === 'DT') {
                const a = child.querySelector('A');
                const nestedDL = child.querySelector('DL');
                
                if (a && nestedDL) {
                    // This is a folder/bookmark group
                    const folderName = a.textContent.trim();
                    const nestedLinks = processDL(nestedDL, folderName);
                    
                    if (nestedLinks.length > 0) {
                        groups.push({
                            id: 'g' + Date.now() + Math.random().toString(36).substr(2, 9),
                            title: folderName,
                            links: nestedLinks,
                            branded: false,
                            brandUrl: null,
                            brandData: null
                        });
                    }
                } else if (a) {
                    // This is a bookmark link
                    const name = a.textContent.trim();
                    const url = a.getAttribute('HREF') || '';
                    
                    if (name && url) {
                        links.push({
                            id: 'l' + Math.random().toString(36).substr(2, 9),
                            name: name,
                            url: url,
                            useFavicon: false
                        });
                    }
                }
            }
        });
        
        return links;
    }
    
    // Process the main DL structure
    const mainDL = document.querySelector('DL');
    if (mainDL) {
        const dtElements = mainDL.querySelectorAll(':scope > DT');
        dtElements.forEach(dt => {
            const a = dt.querySelector('A');
            const nestedDL = dt.querySelector('DL');
            
            if (a && nestedDL) {
                // This is a folder
                const folderName = a.textContent.trim();
                const links = processDL(nestedDL, folderName);
                
                if (links.length > 0) {
                    groups.push({
                        id: 'g' + Date.now() + Math.random().toString(36).substr(2, 9),
                        title: folderName,
                        links: links,
                        branded: false,
                        brandUrl: null,
                        brandData: null
                    });
                }
            } else if (a) {
                // Top-level bookmark (not in a folder)
                const name = a.textContent.trim();
                const url = a.getAttribute('HREF') || '';
                
                if (name && url) {
                    // Create a default group for orphaned bookmarks
                    if (groups.length === 0 || groups[groups.length - 1].title !== 'Imported Bookmarks') {
                        groups.push({
                            id: 'g' + Date.now() + Math.random().toString(36).substr(2, 9),
                            title: 'Imported Bookmarks',
                            links: [],
                            branded: false,
                            brandUrl: null,
                            brandData: null
                        });
                    }
                    groups[groups.length - 1].links.push({
                        id: 'l' + Math.random().toString(36).substr(2, 9),
                        name: name,
                        url: url,
                        useFavicon: false
                    });
                }
            }
        });
    }
    
    return { groups };
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node bookmark-converter.js <bookmarks.html> [output.json]');
    console.log('\nExample:');
    console.log('  node bookmark-converter.js Safari_Bookmarks.html converted-bookmarks.json');
    process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || 'converted-bookmarks.json';

if (!fs.existsSync(inputFile)) {
    console.error(`Error: File "${inputFile}" not found.`);
    process.exit(1);
}

try {
    console.log(`📖 Reading bookmarks from: ${inputFile}`);
    const htmlContent = fs.readFileSync(inputFile, 'utf8');
    const result = parseBookmarksHTML(htmlContent);
    
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\n✅ Converted ${result.groups.length} groups with links`);
    console.log(`📁 Output saved to: ${outputFile}`);
    console.log(`\n📊 Summary:`);
    result.groups.forEach(group => {
        console.log(`   - ${group.title}: ${group.links.length} links`);
    });
    console.log(`\n💡 Tip: You can copy the contents of ${outputFile} into your data.js file or import via Settings.`);
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

