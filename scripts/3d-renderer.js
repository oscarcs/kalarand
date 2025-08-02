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
        this.width = options.width || 1024;
        this.height = options.height || 1024;
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
    
    async renderAllAngles(inputPath, outputDir) {        
        // Extract model name from input path
        const modelName = path.basename(inputPath, '.glb');
        
        try {
            console.log(`Loading model: ${inputPath}`);
            
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
            
            // Send the model data and texture to the browser and render all angles at once
            const renderResults = await this.page.evaluate(async (base64Data, textureData) => {
                // Convert base64 back to ArrayBuffer in the browser
                const binaryString = atob(base64Data);
                const arrayBuffer = new ArrayBuffer(binaryString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < binaryString.length; i++) {
                    uint8Array[i] = binaryString.charCodeAt(i);
                }
                
                return await window.threeRenderer.renderModelAllAngles(arrayBuffer, textureData);
            }, base64Data, textureData);
            
            // Process the results and save the images
            const results = [];
            
            for (let i = 0; i < renderResults.length; i++) {
                const renderResult = renderResults[i];
                const angleName = renderResult.angleName;
                const outputPath = path.join(outputDir, `${modelName}_${angleName}.png`);
                
                if (renderResult.success) {
                    try {
                        const base64Result = renderResult.imageData.replace(/^data:image\/png;base64,/, '');
                        const buffer = Buffer.from(base64Result, 'base64');
                        
                        await fs.promises.mkdir(outputDir, { recursive: true });
                        
                        await fs.promises.writeFile(outputPath, buffer);
                        
                        if (renderResult.renderDimensions) {
                            console.log(`Rendered: ${outputPath} (${renderResult.footprint.x}x${renderResult.footprint.y} tiles, ${renderResult.renderDimensions.width}x${renderResult.renderDimensions.height}px)`);
                        }
                        else {
                            console.log(`Rendered: ${outputPath} (${renderResult.footprint.x}x${renderResult.footprint.y} tiles)`);
                        }
                        
                        results.push({
                            angle: renderResult.angle,
                            angleName: renderResult.angleName,
                            outputPath,
                            success: true,
                            footprint: renderResult.footprint,
                            worldSize: renderResult.worldSize,
                            renderDimensions: renderResult.renderDimensions
                        });
                    }
                    catch (error) {
                        console.error(`Failed to save image for angle ${renderResult.angle}° for ${modelName}:`, error);
                        results.push({
                            angle: renderResult.angle,
                            angleName: renderResult.angleName,
                            outputPath,
                            success: false,
                            error: error.message
                        });
                    }
                }
                else {
                    console.error(`Failed to render angle ${renderResult.angle}° for ${modelName}:`, renderResult.error);
                    results.push({
                        angle: renderResult.angle,
                        angleName: renderResult.angleName,
                        outputPath,
                        success: false,
                        error: renderResult.error
                    });
                }
            }
            
            // Prepare metadata (in memory only - no disk writes)
            const successfulResults = results.filter(r => r.success);
            let modelMetadata = null;
            
            console.log(`Metadata preparation: ${successfulResults.length} successful renders out of ${results.length} total`);
            
            if (successfulResults.length > 0) {
                // Use the first successful render for base metadata (typically 0° angle)
                const baseResult = successfulResults.find(r => r.angle === 0) || successfulResults[0];
                
                modelMetadata = {
                    modelName,
                    baseFootprint: baseResult.footprint, // Base footprint from reference angle
                    worldSize: baseResult.worldSize,
                    renderDimensions: baseResult.renderDimensions,
                    angles: successfulResults.map(r => ({
                        angle: r.angle,
                        angleName: r.angleName,
                        file: path.basename(r.outputPath),
                        footprint: r.footprint, // Angle-adjusted footprint
                        renderDimensions: r.renderDimensions
                    })),
                    renderDate: new Date().toISOString()
                };
                
                console.log(`Created metadata for model: ${modelName}`);
            }
            else {
                console.log(`No successful renders for model: ${modelName}, metadata will be null`);
            }
            
            return {
                renderResults: results,
                metadata: modelMetadata
            };
        }
        catch (error) {
            console.error(`Error rendering all angles for ${inputPath}:`, error);
            throw error;
        }
    }
    
    /**
     * Render multiple models and write consolidated metadata at the end
     */
    async renderMultipleModels(modelPaths, outputDir) {
        const allMetadata = {};
        const allResults = [];
        
        for (const modelPath of modelPaths) {
            try {
                console.log(`\nProcessing model: ${modelPath}`);
                const { renderResults, metadata } = await this.renderAllAngles(modelPath, outputDir);
                allResults.push(...renderResults);
                
                if (metadata) {
                    console.log(`Adding metadata for model: ${metadata.modelName}`);
                    allMetadata[metadata.modelName] = metadata;
                }
                else {
                    console.log(`No metadata returned for model: ${path.basename(modelPath, '.glb')}`);
                }
            }
            catch (error) {
                console.error(`Failed to render model ${modelPath}:`, error);
                // Continue with other models
            }
        }
        
        // Write single consolidated metadata file
        if (Object.keys(allMetadata).length > 0) {
            const consolidatedMetadataPath = path.join(outputDir, 'models-metadata.json');
            await fs.promises.writeFile(consolidatedMetadataPath, JSON.stringify(allMetadata, null, 2));
            console.log(`Consolidated metadata written: ${consolidatedMetadataPath} (${Object.keys(allMetadata).length} models)`);
        }
        else {
            console.log('No metadata to write (no successful renders across all models)');
        }
        
        return {
            allResults,
            metadata: allMetadata
        };
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