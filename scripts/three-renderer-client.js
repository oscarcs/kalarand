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
        
        // Add some padding to prevent edge cropping - show 20% more than the calculated footprint
        const paddingFactor = 1.2;
        
        const halfWidth = (renderDims.width * worldUnitsPerPixel * paddingFactor) / 2;
        const halfHeight = (renderDims.height * worldUnitsPerPixel * paddingFactor) / 2;
        
        console.log(`Camera zoom: footprint=${footprint.x}x${footprint.y}, renderDims=${renderDims.width}x${renderDims.height}, worldUnitsPerPixel=${worldUnitsPerPixel.toFixed(4)}, halfWidth=${halfWidth.toFixed(4)}`);
        
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
        // Calculate bounding box BEFORE scaling
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Store original world size
        const originalWorldSize = { x: size.x, y: size.z };
        
        // Calculate target footprint using smart rounding (round to nearest whole number)
        const targetX = Math.max(1, Math.round(size.x));
        const targetY = Math.max(1, Math.round(size.z));
        const targetFootprint = { x: targetX, y: targetY };
        
        // Calculate scale factors needed to fit target footprint
        const scaleX = targetFootprint.x / size.x;
        const scaleZ = targetFootprint.y / size.z;
        
        // Use uniform scaling - pick the more restrictive factor to ensure model fits
        const uniformScale = Math.min(scaleX, scaleZ);
        
        // Center the model BEFORE scaling
        model.position.sub(center);
        
        // Position the model so its base sits on the ground (Y=0) BEFORE scaling
        const minY = box.min.y;
        model.position.y -= minY;
        
        // Apply the scaling to the model AFTER positioning
        model.scale.setScalar(uniformScale);

        // Calculate the new bounding box after scaling
        const newBox = new THREE.Box3().setFromObject(model);
        const newSize = newBox.getSize(new THREE.Vector3());

        // Store footprint metadata on the model (base orientation)
        model.userData.baseFootprint = targetFootprint;
        model.userData.worldSize = originalWorldSize;
        model.userData.scaleFactor = uniformScale;
        
        console.log(`Model footprint: ${targetFootprint.x}x${targetFootprint.y} tiles (world size: ${originalWorldSize.x.toFixed(2)}x${originalWorldSize.y.toFixed(2)}, scale: ${uniformScale.toFixed(2)}x)`);
        console.log(`New bounding box size: ${newSize.x.toFixed(4)}x${newSize.z.toFixed(4)} (target was: ${targetFootprint.x}x${targetFootprint.y})`);
        console.log(`Model bounds after scaling: min(${newBox.min.x.toFixed(4)}, ${newBox.min.z.toFixed(4)}) max(${newBox.max.x.toFixed(4)}, ${newBox.max.z.toFixed(4)})`);

        // Get current footprint for this angle
        const currentFootprint = this.getFootprintForAngle(angle);
        
        return { 
            footprint: currentFootprint,
            worldSize: originalWorldSize
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
                if (alpha > 5) { // Use threshold to catch faint anti-aliased edges
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
        
        // Add padding to prevent cutting off anti-aliased edges
        const padding = 2;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(tempCanvas.width - 1, maxX + padding);
        maxY = Math.min(tempCanvas.height - 1, maxY + padding);
        
        // Calculate cropped dimensions
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
    
    async renderModelAllAngles(arrayBuffer, textureData) {
        const angles = [0, 90, 180, 270];
        const angleNames = ['ne', 'nw', 'sw', 'se'];
        const results = [];

        try {
            // Clear scene of any previous models
            const modelsToRemove = [];
            this.scene.traverse((child) => {
                if (child !== this.scene && child.type === 'Group') {
                    modelsToRemove.push(child);
                }
            });
            modelsToRemove.forEach(model => this.scene.remove(model));
            
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
            
            const gltf = await this.loadModel(arrayBuffer);
            const model = gltf.scene;
            
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
            
            // Center and scale the model once (using first angle as reference)
            const modelInfo = this.centerAndScaleModel(model, angles[0]);
            
            // Store reference to loaded model for rotation
            this.loadedModel = model;
            this.scene.add(model);
            
            // Wait a moment for material updates to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Render all angles
            for (let i = 0; i < angles.length; i++) {
                const angle = angles[i];
                const angleName = angleNames[i];
                
                try {
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
                    
                    // Set camera to fixed isometric position
                    this.setIsometricAngle(angle);
                    
                    // Render the scene with pixel-perfect dimensions
                    this.renderer.render(this.scene, this.camera);
                    
                    // Get final footprint metadata (angle-adjusted)
                    const footprint = actualFootprint;
                    const worldSize = this.loadedModel.userData.worldSize || { x: 1, y: 1 };
                    
                    // Use cropping to get clean image data without empty space
                    const imageData = this.cropCanvas();
                    
                    results.push({
                        angle,
                        angleName,
                        success: true,
                        imageData,
                        footprint,
                        worldSize,
                        renderDimensions: renderDims
                    });
                    
                }
                catch (error) {
                    console.error(`Error rendering angle ${angle}:`, error);
                    results.push({
                        angle,
                        angleName,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            // Reset renderer size for next render
            this.renderer.setSize(this.width, this.height);
            
            return results;
            
        }
        catch (error) {
            console.error('Render all angles error:', error);
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
