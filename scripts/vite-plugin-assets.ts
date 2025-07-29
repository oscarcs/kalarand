import type { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "fs";
import path from "path";
import { Renderer3D } from "./3d-renderer.js";

interface AssetEntry {
    alias: string[];
    src: string[];
    data: {
        tags: Record<string, any>;
    };
}

interface ManifestBundle {
    name: string;
    assets: AssetEntry[];
}

interface Manifest {
    bundles: ManifestBundle[];
}

export function assetsPlugin() {
    let mode: ResolvedConfig["command"];
    let config: ResolvedConfig;

    return {
        name: "vite-plugin-assets",
        configResolved(resolvedConfig) {
            mode = resolvedConfig.command;
            config = resolvedConfig;
        },
        buildStart: async () => {
            await processAssets();
        },
        configureServer(server) {
            // Also process assets in dev mode
            processAssets();
        },
    } as Plugin;

    async function processAssets() {
        const root = config.root || process.cwd();
        const assetsDir = path.join(root, "assets");
        const assets2dDir = path.join(assetsDir, "2d");
        const assets3dDir = path.join(assetsDir, "3d");
        const publicAssetsDir = path.join(root, "public", "assets");
        const manifestPath = path.join(root, "src", "manifest.json");

        try {
            // Ensure directories exist
            await fs.mkdir(publicAssetsDir, { recursive: true });
            await fs.mkdir(assets2dDir, { recursive: true });

            // Generate 2D assets from 3D models
            await generate2DAssets(assets3dDir, assets2dDir);

            // Process all assets (existing 2D + newly generated 2D)
            const assetFiles = await getAllAssetFiles(assetsDir);
            const validAssets = assetFiles.filter(file => 
                !file.startsWith('.') && 
                /\.(png|jpg|jpeg|gif|svg|webp|json|mp3|wav|ogg|m4a|ttf|otf|woff|woff2)$/i.test(file)
            );

            // Copy assets to public/assets
            const copyPromises = validAssets.map(async (file) => {
                const srcPath = path.join(assetsDir, file);
                const destPath = path.join(publicAssetsDir, file);
                
                // Ensure destination directory exists
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                await fs.copyFile(srcPath, destPath);
                console.log(`Copied ${file} to public/assets/`);
            });

            await Promise.all(copyPromises);

            // Generate manifest
            const assets: AssetEntry[] = validAssets.map(file => ({
                alias: [file],
                src: [file],
                data: {
                    tags: {}
                }
            }));

            const manifest: Manifest = {
                bundles: [
                    {
                        name: "default",
                        assets: assets
                    }
                ]
            };

            // Write manifest file
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
            console.log(`Generated manifest with ${assets.length} assets`);
        }
        catch (error) {
            console.error("Error processing assets:", error);
        }
    }

    async function getAllAssetFiles(assetsDir: string): Promise<string[]> {
        const files: string[] = [];
        
        async function scanDirectory(dir: string, relativePath: string = "") {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue;
                    
                    const fullPath = path.join(dir, entry.name);
                    const relativeFilePath = path.join(relativePath, entry.name);
                    
                    if (entry.isDirectory()) {
                        await scanDirectory(fullPath, relativeFilePath);
                    } else {
                        files.push(relativeFilePath);
                    }
                }
            }
            catch (error) {
                // Directory might not exist, ignore
            }
        }
        
        await scanDirectory(assetsDir);
        return files;
    }

    async function generate2DAssets(assets3dDir: string, assets2dDir: string) {
        try {
            // Find all GLB files in 3d directory
            const glbFiles = await findGlbFiles(assets3dDir);
            
            if (glbFiles.length === 0) {
                console.log("No 3D models found to convert");
                return;
            }

            console.log(`Found ${glbFiles.length} 3D models to process`);

            // Check which models need regeneration
            const modelsToGenerate: string[] = [];
            for (const glbFile of glbFiles) {
                const needsGeneration = await needs2DGeneration(glbFile, assets2dDir);
                if (needsGeneration) {
                    modelsToGenerate.push(glbFile);
                }
            }

            if (modelsToGenerate.length === 0) {
                console.log("All 2D assets are up to date");
                return;
            }

            console.log(`Generating 2D assets for ${modelsToGenerate.length} models...`);

            // Initialize renderer
            const renderer = new Renderer3D({
                width: 512,
                height: 512
            });

            try {
                await renderer.init();

                // Generate 2D assets for each model
                for (const glbFile of modelsToGenerate) {
                    const modelName = path.basename(glbFile, '.glb');
                    console.log(`Generating 2D assets for ${modelName}...`);
                    
                    try {
                        await renderer.renderAllAngles(glbFile, assets2dDir);
                    }
                    catch (error) {
                        console.error(`Failed to generate 2D assets for ${modelName}:`, error);
                    }
                }
            }
            finally {
                await renderer.dispose();
            }

            console.log("2D asset generation completed");
            
            // Create consolidated metadata file
            await createConsolidatedMetadata(assets2dDir);
        }
        catch (error) {
            console.error("Error in 2D asset generation:", error);
        }
    }

    async function createConsolidatedMetadata(assets2dDir: string) {
        try {
            const consolidatedMetadata: Record<string, any> = {};
            
            // Find all individual metadata files
            const metadataFiles = await fs.readdir(assets2dDir);
            const modelMetadataFiles = metadataFiles.filter(file => file.endsWith('_metadata.json'));
            
            for (const metadataFile of modelMetadataFiles) {
                const metadataPath = path.join(assets2dDir, metadataFile);
                const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                const metadata = JSON.parse(metadataContent);
                
                consolidatedMetadata[metadata.modelName] = metadata;
                
                // Clean up individual metadata file
                await fs.unlink(metadataPath);
            }
            
            // Write consolidated metadata
            const consolidatedPath = path.join(assets2dDir, 'models-metadata.json');
            await fs.writeFile(consolidatedPath, JSON.stringify(consolidatedMetadata, null, 2));
            
            console.log(`Created consolidated metadata for ${Object.keys(consolidatedMetadata).length} models`);
        }
        catch (error) {
            console.error("Error creating consolidated metadata:", error);
        }
    }

    async function findGlbFiles(dir: string): Promise<string[]> {
        const glbFiles: string[] = [];
        
        async function scanForGlb(currentDir: string) {
            try {
                const entries = await fs.readdir(currentDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue;
                    
                    const fullPath = path.join(currentDir, entry.name);
                    
                    if (entry.isDirectory()) {
                        await scanForGlb(fullPath);
                    }
                    else if (entry.name.endsWith('.glb')) {
                        // TODO: Filter out detail files for now - we'll handle them specially later
                        if (!entry.name.startsWith('detail-')) {
                            glbFiles.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                // Directory might not exist, ignore
            }
        }
        
        await scanForGlb(dir);
        return glbFiles;
    }

    async function needs2DGeneration(glbPath: string, assets2dDir: string): Promise<boolean> {
        try {
            const modelName = path.basename(glbPath, '.glb');
            const angleNames = ['ne', 'nw', 'sw', 'se'];
            
            // Get GLB file modification time
            const glbStats = await fs.stat(glbPath);
            const glbTime = glbStats.mtime.getTime();
            
            // Check if all 2D files exist and are newer than GLB
            for (const angleName of angleNames) {
                const pngPath = path.join(assets2dDir, `${modelName}_${angleName}.png`);
                
                try {
                    const pngStats = await fs.stat(pngPath);
                    const pngTime = pngStats.mtime.getTime();
                    
                    // If PNG is older than GLB, regeneration needed
                    if (pngTime < glbTime) {
                        return true;
                    }
                }
                catch (error) {
                    // PNG doesn't exist, regeneration needed
                    return true;
                }
            }
            
            // All PNG files exist and are newer than GLB
            return false;
        }
        catch (error) {
            // Error checking files, safer to regenerate
            return true;
        }
    }
}
