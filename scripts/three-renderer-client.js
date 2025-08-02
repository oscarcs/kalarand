import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Make THREE globally available for compatibility
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;

export class ThreeRenderer {
    constructor(width, height) {
        this.canvas = document.getElementById('renderCanvas');
        this.scene = new THREE.Scene();
        this.width = width;
        this.height = height;
        
        // Tile rendering constants
        this.TILE_WIDTH_PX = 64;  // pixels per tile width
        this.TILE_HEIGHT_PX = 32; // pixels per tile height
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            alpha: true,
            antialias: false,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Setup isometric camera
        this.setupCamera();
        
        // Setup lighting
        this.setupLighting();
        
        console.log('Three.js renderer ready');
    }
    
    setupCamera() {
        const distance = 8;
        
        this.camera = new THREE.OrthographicCamera(
            -4, 4,   // left, right
            4, -4,   // top, bottom
            0.1, 100 // near, far
        );
        
        // Position camera for game isometric view (30-degree angle)
        // For 30-degree dimetric projection, we calculate the proper camera position
        // The angle between ground and camera should be 30 degrees
        const angleRad = 30 * Math.PI / 180; // 30 degrees in radians
        const horizontalDistance = distance * Math.cos(angleRad);
        const verticalDistance = distance * Math.sin(angleRad);
        
        // Position camera at 45-degree azimuth angle for classic isometric look
        const azimuthRad = 45 * Math.PI / 180;
        const x = horizontalDistance * Math.cos(azimuthRad);
        const z = horizontalDistance * Math.sin(azimuthRad);
        const y = verticalDistance;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }

    // Calculate render dimensions based on footprint
    calculateRenderDimensions(footprint) {
        // Width must be EXACTLY footprint × tile width for perfect alignment
        const width = footprint.x * this.TILE_WIDTH_PX;
        
        // Height can be arbitrary - we'll crop to fit the actual content
        // Start with a reasonable estimate but allow for tall buildings
        const minHeight = footprint.y * this.TILE_HEIGHT_PX;
        const height = Math.max(minHeight, 200); // At least 200px height for tall buildings
        
        return {
            width: width,
            height: height,
            centerOffsetX: 0,
            centerOffsetY: 0
        };
    }

    // Calculate proper camera zoom for pixel-perfect rendering
    calculateCameraZoom(footprint, renderDims) {
        // Set up camera to show exactly the footprint width
        // The key insight: footprint.x world units should map to exactly renderDims.width pixels
        const worldUnitsPerPixel = footprint.x / renderDims.width;
        
        const halfWidth = (renderDims.width * worldUnitsPerPixel) / 2;
        const halfHeight = (renderDims.height * worldUnitsPerPixel) / 2;
        
        this.camera.left = -halfWidth;
        this.camera.right = halfWidth;
        this.camera.top = halfHeight;
        this.camera.bottom = -halfHeight;
        this.camera.updateProjectionMatrix();
        
        return { halfWidth, halfHeight };
    }

    setIsometricAngle(angle) {
        // Keep camera in fixed isometric position for consistent lighting
        const distance = 8;
        
        // Position camera for game isometric view (30-degree angle)
        const angleRad = 30 * Math.PI / 180; // 30 degrees in radians
        const horizontalDistance = distance * Math.cos(angleRad);
        const verticalDistance = distance * Math.sin(angleRad);
        
        // Position camera at 45-degree azimuth angle for classic isometric look
        const azimuthRad = 45 * Math.PI / 180;
        const x = horizontalDistance * Math.cos(azimuthRad);
        const z = horizontalDistance * Math.sin(azimuthRad);
        const y = verticalDistance;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }
    
    rotateModelForAngle(angle) {
        if (!this.loadedModel) return;
        
        // For isometric views, we need to rotate the model to show different corners
        // The key insight: we want to see different diagonal faces, not just side faces
        // 45° intervals around Y-axis will give us the 4 diagonal corner views we want
        const rotationY = -angle * Math.PI / 180; // Negative for correct direction
        this.loadedModel.rotation.y = rotationY;
    }
    
    setupLighting() {
        // Natural ambient lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
        
        // Main sun light from top-right
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(10, 15, 8);
        sunLight.castShadow = false; // Keep it simple for now
        this.scene.add(sunLight);
        
        // Subtle fill light from opposite side (bounce light)
        const fillLight = new THREE.DirectionalLight(0xb3d9ff, 0.5);
        fillLight.position.set(-8, 5, -5);
        this.scene.add(fillLight);
    }
    
    centerAndScaleModel(model, angle = 0) {
        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate tile footprint (1 world unit = 1 tile)
        // Z is 'depth' in our coordinate system
        const tilesX = Math.max(1, Math.ceil(size.x));
        const tilesY = Math.max(1, Math.ceil(size.z));
        
        // Store footprint metadata on the model (base orientation)
        model.userData.baseFootprint = { x: tilesX, y: tilesY };
        model.userData.worldSize = { x: size.x, y: size.z };
        
        console.log(`Model footprint: ${tilesX}x${tilesY} tiles (world size: ${size.x.toFixed(2)}x${size.z.toFixed(2)})`);
        
        // Get current footprint for this angle
        const currentFootprint = this.getFootprintForAngle(angle);
        
        // Simple centering - put model at origin
        model.position.sub(center);
        
        // Position the model so its base sits on the ground (Y=0)
        const minY = box.min.y;
        model.position.y -= minY;
        
        return { 
            footprint: currentFootprint,
            worldSize: { x: size.x, y: size.z }
        };
    }
    
    getFootprintForAngle(angle) {
        if (!this.loadedModel || !this.loadedModel.userData.baseFootprint) {
            return { x: 1, y: 1 };
        }
        
        const base = this.loadedModel.userData.baseFootprint;
        
        // Keep the same footprint for all angles - the model rotation doesn't change its footprint
        // The footprint represents the ground space it occupies, which should be consistent
        return { x: base.x, y: base.y };
    }
    
    async loadModel(arrayBuffer) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.parse(arrayBuffer, '', (gltf) => {
                resolve(gltf);
            }, (error) => {
                reject(error);
            });
        });
    }
    
    cropCanvas() {
        // Create a 2D canvas to copy the WebGL content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the WebGL canvas onto the 2D canvas
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Now we can use getImageData on the 2D canvas
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        let minX = tempCanvas.width;
        let minY = tempCanvas.height;
        let maxX = 0;
        let maxY = 0;
        
        // Find the bounds of non-transparent pixels
        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const alpha = data[(y * tempCanvas.width + x) * 4 + 3]; // Alpha channel
                if (alpha > 0) { // Non-transparent pixel
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        // If no content found, return original canvas
        if (minX >= maxX || minY >= maxY) {
            return tempCanvas.toDataURL('image/png');
        }
        
        // Calculate cropped dimensions (no padding for pixel-perfect alignment)
        const croppedWidth = maxX - minX + 1;
        const croppedHeight = maxY - minY + 1;
        
        // Create new canvas with cropped dimensions
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        // Copy the cropped region
        croppedCtx.drawImage(
            tempCanvas,
            minX, minY, croppedWidth, croppedHeight,  // Source
            0, 0, croppedWidth, croppedHeight         // Destination
        );
        
        return croppedCanvas.toDataURL('image/png');
    }
    
    async renderModel(arrayBuffer, textureData, angle = 45) {
        try {
            // Clear scene of any previous models
            const modelsToRemove = [];
            this.scene.traverse((child) => {
                if (child !== this.scene && child.type === 'Group') {
                    modelsToRemove.push(child);
                }
            });
            modelsToRemove.forEach(model => this.scene.remove(model));
            
            // Load texture if provided
            let texture = null;
            if (textureData) {
                texture = await new Promise((resolve, reject) => {
                    const textureLoader = new THREE.TextureLoader();
                    const dataUrl = 'data:image/png;base64,' + textureData;
                    const loadedTexture = textureLoader.load(dataUrl, 
                        (tex) => resolve(tex),
                        undefined,
                        (error) => reject(error)
                    );
                });
                
                texture.flipY = false;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.colorSpace = THREE.SRGBColorSpace;
            }
            
            // Load and add new model
            const gltf = await this.loadModel(arrayBuffer);
            const model = gltf.scene;
            
            // Apply texture and enhance materials for better visibility
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    
                    materials.forEach((mat, index) => {
                        if (texture) {
                            // Apply texture to existing material
                            if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                                mat.map = texture;
                                mat.color.setHex(0xffffff);
                                
                                if (mat.isMeshStandardMaterial) {
                                    mat.roughness = 0.8;
                                    mat.metalness = 0.0;
                                    // Reduce emission for more natural look
                                    mat.emissive.setHex(0x050505);
                                }
                                
                                mat.needsUpdate = true;
                            }
                            else {
                                // Replace with textured material
                                const newMaterial = new THREE.MeshLambertMaterial({
                                    map: texture,
                                    transparent: false,
                                    side: THREE.DoubleSide,
                                    color: 0xffffff
                                });
                                
                                if (Array.isArray(child.material)) {
                                    child.material[index] = newMaterial;
                                }
                                else {
                                    child.material = newMaterial;
                                }
                            }
                        }
                        else {
                            // No texture - enhance for visibility with natural colors
                            if (mat.color) {
                                mat.color.setHex(0xaaaaaa); // Natural gray
                            }
                            if (mat.emissive) {
                                mat.emissive.setHex(0x101010); // Very subtle emission
                            }
                            mat.needsUpdate = true;
                        }
                    });
                }
            });
            
            // Center and scale the model, get footprint and pivot information
            const modelInfo = this.centerAndScaleModel(model, angle);
            
            // Store reference to loaded model for rotation
            this.loadedModel = model;
            
            // Rotate model to desired angle (keeping camera and lighting fixed)
            this.rotateModelForAngle(angle);
            
            // Calculate the actual footprint for this specific angle after rotation
            const actualFootprint = this.getFootprintForAngle(angle);
            
            // Calculate optimal render dimensions for this angle's footprint
            const renderDims = this.calculateRenderDimensions(actualFootprint);
            
            // Update renderer size for optimal rendering
            this.renderer.setSize(renderDims.width, renderDims.height);
            
            // Update camera frustum for pixel-perfect tile alignment
            this.calculateCameraZoom(actualFootprint, renderDims);
            
            this.scene.add(model);
            
            // Set camera to fixed isometric position
            this.setIsometricAngle(angle);
            
            // Wait a moment for texture/material updates to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Render the scene with pixel-perfect dimensions
            this.renderer.render(this.scene, this.camera);
            
            // Get final footprint metadata (angle-adjusted)
            const footprint = actualFootprint;
            const worldSize = this.loadedModel.userData.worldSize || { x: 1, y: 1 };
            
            // Use cropping to get clean image data without empty space
            const imageData = this.cropCanvas();
            
            // Reset renderer size for next render
            this.renderer.setSize(this.width, this.height);
            
            // Return both image and metadata
            return {
                imageData,
                footprint,
                worldSize,
                renderDimensions: renderDims
            };
            
        }
        catch (error) {
            console.error('Render error:', error);
            throw error;
        }
    }
}

// Initialize renderer when the page loads
const canvas = document.getElementById('renderCanvas');
const width = parseInt(canvas.getAttribute('width'));
const height = parseInt(canvas.getAttribute('height'));

window.threeRenderer = new ThreeRenderer(width, height);
window.renderReady = true;
