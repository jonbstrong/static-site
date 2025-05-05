const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

// Configure marked for security
marked.setOptions({
    headerIds: false,
    mangle: false
});

// Ensure build directory exists
fs.ensureDirSync('public');

// Copy static assets
fs.copySync('src/css', 'public/css');
fs.copySync('src/js', 'public/js');

// Function to parse front matter
function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, content };
    
    const metadata = {};
    match[1].split('\n').forEach(line => {
        const [key, value] = line.split(': ');
        if (key && value) metadata[key.trim()] = value.trim();
    });
    
    return { metadata, content: match[2] };
}

// Function to convert markdown to HTML
function convertMarkdownToHtml(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content: markdownContent } = parseFrontMatter(content);
    const htmlContent = marked(markdownContent);
    
    // Read template
    const template = fs.readFileSync('src/template.html', 'utf-8');
    
    // Replace placeholders
    const finalHtml = template
        .replace('{{title}}', metadata.title || 'My Site')
        .replace('{{content}}', htmlContent);
    
    return finalHtml;
}

// Function to create HTML from markdown string
function createHtmlFromMarkdown(markdown, title) {
    const htmlContent = marked(markdown);
    const template = fs.readFileSync('src/template.html', 'utf-8');
    return template
        .replace('{{title}}', title)
        .replace('{{content}}', htmlContent);
}

// Build pages
function buildPages() {
    const pagesDir = 'content/pages';
    const files = fs.readdirSync(pagesDir);
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(pagesDir, file);
            const html = convertMarkdownToHtml(filePath);
            const outputPath = path.join('public', file.replace('.md', '.html'));
            fs.writeFileSync(outputPath, html);
        }
    });
}

// Build blog posts
function buildBlog() {
    const blogDir = 'content/blog';
    fs.ensureDirSync(blogDir); // Ensure blog directory exists
    const files = fs.readdirSync(blogDir);
    
    // Create blog index
    let blogIndex = '# Blog\n\n';
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(blogDir, file);
            const html = convertMarkdownToHtml(filePath);
            const outputPath = path.join('public', 'blog', file.replace('.md', '.html'));
            fs.ensureDirSync(path.dirname(outputPath));
            fs.writeFileSync(outputPath, html);
            
            // Add to blog index
            const { metadata } = parseFrontMatter(fs.readFileSync(filePath, 'utf-8'));
            blogIndex += `- [${metadata.title}](${file.replace('.md', '.html')})\n`;
        }
    });
    
    // Create blog index page
    const blogIndexHtml = createHtmlFromMarkdown(blogIndex, 'Blog');
    fs.ensureDirSync(path.join('public', 'blog'));
    fs.writeFileSync(path.join('public', 'blog', 'index.html'), blogIndexHtml);
}

// Run build
buildPages();
buildBlog();

console.log('Build completed successfully!'); 