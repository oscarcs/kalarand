import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 3D to 2D renderer using Puppeteer + Three.js
 * Renders GLB models with isometric/dimetric projection to PNG files
 */
export class Renderer3D {
    constructor(options = {}) {
        this.width = options.width || 512;
        this.height = options.height || 512;
        this.browser = null;
        this.page = null;
        this.server = null;
        this.serverPort = 0;
    }
    
    async startLocalServer() {
        const projectRoot = path.dirname(__dirname);
        const nodeModulesPath = path.join(projectRoot, 'node_modules');
        const scriptsPath = path.join(projectRoot, 'scripts');
        
        return new Promise((resolve, reject) => {
            this.server = createServer((req, res) => {
                // Add CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                
                if (req.method === 'OPTIONS') {
                    res.writeHead(200);
                    res.end();
                    return;
                }
                
                const parsedUrl = parse(req.url, true);
                let filePath;
                
                // Serve our client script file
                if (parsedUrl.pathname === '/three-renderer-client.js') {
                    filePath = path.join(scriptsPath, 'three-renderer-client.js');
                }
                else {
                    // Serve Three.js files from node_modules
                    filePath = path.join(nodeModulesPath, parsedUrl.pathname);
                    
                    // Security check - ensure we're only serving from node_modules
                    if (!filePath.startsWith(nodeModulesPath)) {
                        res.writeHead(403);
                        res.end('Forbidden');
                        return;
                    }
                }
                
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    
                    // Set appropriate content type
                    const ext = path.extname(filePath);
                    const contentType = ext === '.js' ? 'application/javascript' : 'text/plain';
                    
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                });
            });
            
            this.server.listen(0, 'localhost', () => {
                this.serverPort = this.server.address().port;
                console.log(`Local server started on port ${this.serverPort}`);
                resolve();
            });
            
            this.server.on('error', reject);
        });
    }
    
    async init() {
        // Start local server for Three.js files
        await this.startLocalServer();
        
        // Launch headless browser
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu-sandbox',
                '--disable-software-rasterizer'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Add console logging from the page
        this.page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        this.page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        // Set longer timeout for loading Three.js
        this.page.setDefaultTimeout(60000);
        this.page.setDefaultNavigationTimeout(60000);
        
        // Set viewport size
        await this.page.setViewport({
            width: this.width,
            height: this.height,
            deviceScaleFactor: 1
        });
        
        // Create the HTML page with Three.js
        const htmlContent = this.createRendererHTML();
        await this.page.setContent(htmlContent, { 
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });
        
        // Wait for Three.js to load with timeout
        await this.page.waitForFunction(() => window.THREE !== undefined, { 
            timeout: 30000 
        });
        
        // Wait for our renderer to be ready
        await this.page.waitForFunction(() => window.renderReady === true, { 
            timeout: 30000 
        });
        
        console.log('Renderer initialized successfully');
    }
    
    createRendererHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="renderCanvas" width="${this.width}" height="${this.height}"></canvas>
    
    <script type="importmap">
    {
        "imports": {
            "three": "http://localhost:${this.serverPort}/three/build/three.module.js",
            "three/examples/jsm/": "http://localhost:${this.serverPort}/three/examples/jsm/"
        }
    }
    </script>
    
    <script type="module" src="http://localhost:${this.serverPort}/three-renderer-client.js"></script>
</body>
</html>`;
    }
    
    async renderModel(inputPath, outputPath, angle = 45) {
        try {
            console.log(`Loading model: ${inputPath} (angle: ${angle}°)`);
            
            // Read the GLB file and convert to base64
            const glbBuffer = await fs.promises.readFile(inputPath);
            const base64Data = glbBuffer.toString('base64');
            
            // Check for textures in the same directory
            const modelDir = path.dirname(inputPath);
            const texturesDir = path.join(modelDir, 'Textures');
            let textureData = null;
            
            try {
                const colorMapPath = path.join(texturesDir, 'colormap.png');
                if (await fs.promises.access(colorMapPath).then(() => true).catch(() => false)) {
                    const textureBuffer = await fs.promises.readFile(colorMapPath);
                    textureData = textureBuffer.toString('base64');
                }
            }
            catch (error) {
                // No textures found, proceed without
            }
            
            // Send the model data, texture, and angle to the browser and render
            const dataUrl = await this.page.evaluate(async (base64Data, textureData, angle) => {
                // Convert base64 back to ArrayBuffer in the browser
                const binaryString = atob(base64Data);
                const arrayBuffer = new ArrayBuffer(binaryString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < binaryString.length; i++) {
                    uint8Array[i] = binaryString.charCodeAt(i);
                }
                
                return await window.threeRenderer.renderModel(arrayBuffer, textureData, angle);
            }, base64Data, textureData, angle);
            
            // Convert data URL to buffer
            const base64Result = dataUrl.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Result, 'base64');
            
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            await fs.promises.mkdir(outputDir, { recursive: true });
            
            // Write PNG file
            await fs.promises.writeFile(outputPath, buffer);
            console.log(`Rendered: ${outputPath}`);
            
        }
        catch (error) {
            console.error(`Error rendering ${inputPath}:`, error);
            throw error;
        }
    }
    
    async renderAllAngles(inputPath, outputDir) {
        const angles = [0, 90, 180, 270];
        const angleNames = ['ne', 'nw', 'sw', 'se'];
        
        // Extract model name from input path
        const modelName = path.basename(inputPath, '.glb');
        
        const results = [];
        
        for (let i = 0; i < angles.length; i++) {
            const angle = angles[i];
            const angleName = angleNames[i];
            const outputPath = path.join(outputDir, `${modelName}_${angleName}.png`);
            
            try {
                await this.renderModel(inputPath, outputPath, angle);
                results.push({
                    angle,
                    angleName,
                    outputPath,
                    success: true
                });
            }
            catch (error) {
                console.error(`Failed to render angle ${angle}° for ${modelName}:`, error);
                results.push({
                    angle,
                    angleName,
                    outputPath,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    async dispose() {
        if (this.browser) {
            await this.browser.close();
        }
        if (this.server) {
            this.server.close();
        }
    }
}

// Test function - render a single model
export async function testRender(inputGlb, outputPng, angle = 45) {
    const renderer = new Renderer3D({
        width: 512,
        height: 512
    });
    
    try {
        await renderer.init();
        await renderer.renderModel(inputGlb, outputPng, angle);
        console.log('Test render completed successfully!');
    }
    catch (error) {
        console.error('Test render failed:', error);
        throw error;
    }
    finally {
        await renderer.dispose();
    }
}

// Test function - render all angles of a model
export async function testRenderAllAngles(inputGlb) {
    const renderer = new Renderer3D({
        width: 512,
        height: 512
    });
    
    try {
        await renderer.init();
        
        // Use assets/2d for organized output
        const outputDir = '/Users/oscar/Dev/kalarand/assets/2d';
        const results = await renderer.renderAllAngles(inputGlb, outputDir);
        
        console.log('Multi-angle render completed!');
        console.log('Results:');
        results.forEach(result => {
            if (result.success) {
                console.log(`  ✅ ${result.angleName} (${result.angle}°): ${result.outputPath}`);
            }
            else {
                console.log(`  ❌ ${result.angleName} (${result.angle}°): ${result.error}`);
            }
        });
        
        return results;
    }
    catch (error) {
        console.error('Multi-angle render failed:', error);
        throw error;
    }
    finally {
        await renderer.dispose();
    }
}
