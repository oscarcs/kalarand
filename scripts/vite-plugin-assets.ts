import type { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "fs";
import path from "path";

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
        const publicAssetsDir = path.join(root, "public", "assets");
        const manifestPath = path.join(root, "src", "manifest.json");

        try {
            // Ensure public/assets directory exists
            await fs.mkdir(publicAssetsDir, { recursive: true });

            // Read assets directory
            const assetFiles = await fs.readdir(assetsDir);
            const validAssets = assetFiles.filter(file => 
                !file.startsWith('.') && 
                /\.(png|jpg|jpeg|gif|svg|webp|json|mp3|wav|ogg|m4a|ttf|otf|woff|woff2)$/i.test(file)
            );

            // Copy assets to public/assets
            const copyPromises = validAssets.map(async (file) => {
                const srcPath = path.join(assetsDir, file);
                const destPath = path.join(publicAssetsDir, file);
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
}
