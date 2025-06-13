document.addEventListener('DOMContentLoaded', () => {
    // --- Navbar Mobile Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    });


    // --- Word Rotator Logic for Header ---
    const wordRotator = document.querySelector('.word-rotator');
    const spans = wordRotator.querySelectorAll('span');
    let currentIndex = 0;
    let isDragging = 0;
    let momentum = 0.01;

    // Set the first span as active initially
    spans[currentIndex].classList.add('active');

    function updateWords() {
        const currentSpan = spans[currentIndex];
        const nextIndex = (currentIndex + 1) % spans.length;
        const nextSpan = spans[nextIndex];

        // 1. Animate current word out
        currentSpan.classList.remove('active');
        setTimeout(() => {
          currentSpan.classList.remove('leaving');
        }, 500);

        // Small delay to ensure the browser registers the 'leaving' class change
        // before we reset 'currentSpan' and apply 'entering' to 'nextSpan'.
        // This is crucial for the leaving animation to play correctly.
        setTimeout(() => {
            // Animate next word in
            nextSpan.classList.add('entering');
            if (nextSpan.id != "current") wordRotator.style.width = nextSpan.id;

            // After next word enters, remove the 'entering' class
            // This allows it to stay 'active' without the temporary animation class
            setTimeout(() => {
                nextSpan.classList.remove('entering');
                    nextSpan.classList.add('active');
            }, 500); // Matches CSS transition duration (0.5s)

        }, 50); // Short delay (e.g., 50ms) to allow the 'leaving' transition to begin

        currentIndex = nextIndex;
    }

    // Start the animation loop for the word rotator
    setInterval(updateWords, 2000); // Change words every 2 seconds for a smoother read


    // --- 3D Image Carousel Logic (Three.js) ---
    // This function sets up and animates a 3D carousel on a given canvas
    function setupThreeDCarousel(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas with ID '${canvasId}' not found.`);
            return;
        }

        const baseImageUrls = JSON.parse(canvas.dataset.images);
        if (!baseImageUrls || baseImageUrls.length === 0) {
            console.warn(`No image URLs found for canvas '${canvasId}'.`);
            return;
        }

        let scene, camera, renderer;
        let meshes = [];
        let targetRotationX = 0.001; // Base rotation speed for automatic scroll
        let currentRotationX = 0;

        const container = canvas.parentElement;

        // Configuration for 3D planes
        const numRows = 2;
        const imgPlaneWidth = 150; // Smaller size for more images to fit
        const imgPlaneHeight = 90;
        const horizontalSpacing = 25; // Space between images horizontally
        const verticalSpacing = 120; // Vertical distance between rows (adjust as needed)

        // Calculate total number of image planes needed for seamless loop (2 full sets for horizontal scroll)
        const totalHorizontalItemsInOneSet = baseImageUrls.length;
        const totalMeshesToCreate = totalHorizontalItemsInOneSet * numRows * 2; // (images * rows) * 2 for seamless loop

        function init() {
            // Scene
            scene = new THREE.Scene();

            // Camera
            // Adjusted camera position to better frame two rows
            camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            camera.position.z = 200; // Keep camera relatively close
            camera.position.y = 0; // Center camera vertically

            // Renderer
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(container.clientWidth, container.clientHeight);

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
            scene.add(ambientLight);

            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 1, 1).normalize();
            scene.add(directionalLight);

            // Texture Loader
            const loader = new THREE.TextureLoader();

            // Create image planes for two rows and seamless looping
            for (let i = 0; i < totalMeshesToCreate; i++) {
                const originalImageIndex = i % baseImageUrls.length; // Cycles through the original image array
                const currentRowIndex = Math.floor(i / baseImageUrls.length) % numRows; // Determines which of the two rows it's in conceptually

                loader.load(baseImageUrls[originalImageIndex],
                    // onLoad callback
                    function (texture) {
                        const geometry = new THREE.PlaneGeometry(imgPlaneWidth, imgPlaneHeight);
                        const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }); // DoubleSide for better visibility
                        const mesh = new THREE.Mesh(geometry, material);

                        // Calculate X position: This is based on the column index within the full, horizontally duplicated set
                        // The `(i % totalHorizontalItemsInOneSet)` gives the column for the *current set*
                        const x = ((i % totalHorizontalItemsInOneSet) * (imgPlaneWidth + horizontalSpacing)) -
                                  (totalHorizontalItemsInOneSet * (imgPlaneWidth + horizontalSpacing) / 2) + // Center the initial block
                                  (i >= totalMeshesToCreate / 2 ? totalHorizontalItemsInOneSet * (imgPlaneWidth + horizontalSpacing) : 0); // Offset for the duplicate set for seamless loop

                        // Calculate Y position: Place meshes in two rows
                        const y = (currentRowIndex === 0 ? verticalSpacing / 2 : -verticalSpacing / 2);

                        mesh.position.set(x, y, 0); // z position can be varied for depth effect if desired
                        meshes.push(mesh);
                        scene.add(mesh);
                    },
                    // onProgress callback
                    undefined,
                    // onError callback for individual image - uses a grey placeholder
                    function (err) {
                        console.error('An error happened loading an image texture:', baseImageUrls[originalImageIndex], err);
                        const geometry = new THREE.PlaneGeometry(imgPlaneWidth, imgPlaneHeight);
                        const material = new THREE.MeshBasicMaterial({ color: 0x888888 }); // Grey placeholder
                        const mesh = new THREE.Mesh(geometry, material);
                        const x = ((i % totalHorizontalItemsInOneSet) * (imgPlaneWidth + horizontalSpacing)) -
                                  (totalHorizontalItemsInOneSet * (imgPlaneWidth + horizontalSpacing) / 2) +
                                  (i >= totalMeshesToCreate / 2 ? totalHorizontalItemsInOneSet * (imgPlaneWidth + horizontalSpacing) : 0);
                        const y = (currentRowIndex === 0 ? verticalSpacing / 2 : -verticalSpacing / 2);
                        mesh.position.set(x, y, 0);
                        meshes.push(mesh);
                        scene.add(mesh);
                    }
                );
            }


            // Mouse interaction for horizontal scroll
            let isDragging = false;
            let startMouseX = 0;
            let startRotationX = 0;
            let momentum = 0; // For smooth stop/start

            canvas.addEventListener('mousedown', (event) => {
                isDragging = true;
                startMouseX = event.clientX;
                startRotationX = currentRotationX;
                targetRotationX = 0; // Stop automatic scroll when dragging
                momentum = 0; // Reset momentum
                canvas.style.cursor = 'grabbing';
            });

            canvas.addEventListener('mousemove', (event) => {
                if (!isDragging) return;
                const deltaX = (event.clientX - startMouseX) * 0.001; // Sensitivity adjusted
                currentRotationX = startRotationX + deltaX;
            });

            canvas.addEventListener('mouseup', () => {
                isDragging = false;
                canvas.style.cursor = 'grab';
                // Apply slight momentum on release
                momentum = (currentRotationX - startRotationX) * 0.1; // Derived from last drag
                targetRotationX = 0.005; // Resume base rotation, momentum will add to it
            });

            canvas.addEventListener('mouseleave', () => {
                isDragging = false;
                canvas.style.cursor = 'grab';
            });

            // Touch events for mobile
            canvas.addEventListener('touchstart', (event) => {
                event.preventDefault(); // Prevent scrolling the page
                isDragging = true;
                startMouseX = event.touches[0].clientX;
                startRotationX = currentRotationX;
                targetRotationX = 0;
                momentum = 0;
            });

            canvas.addEventListener('touchmove', (event) => {
                event.preventDefault(); // Prevent scrolling the page
                if (!isDragging) return;
                const deltaX = (event.touches[0].clientX - startMouseX) * 0.001;
                currentRotationX = startRotationX + deltaX;
            });

            canvas.addEventListener('touchend', () => {
                isDragging = false;
                momentum = (currentRotationX - startRotationX) * 0.1;
                targetRotationX = 0.005;
            });


            window.addEventListener('resize', onWindowResize);
        }

        function onWindowResize() {
            if (!container || !camera || !renderer) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
            // Re-adjust camera position if necessary based on new aspect ratio or height
            // For now, keep z fixed as it works with the default PlaneGeometry size
        }

        function animate() {
            requestAnimationFrame(animate);

            // Apply rotation with momentum and target speed
            if (!isDragging) {
                currentRotationX += targetRotationX;
                momentum *= 0.95; // Decay momentum
                currentRotationX += momentum;
            }

            // Loop the meshes to create continuous scroll for both rows
            const fullLoopWidth = (totalHorizontalItemsInOneSet * (imgPlaneWidth + horizontalSpacing));

            meshes.forEach(mesh => {
                mesh.position.x += -targetRotationX * 1000; // Adjust speed based on targetRotationX
                // If a mesh goes too far left, move it to the right end of the seamless loop
                if (mesh.position.x < -(fullLoopWidth) - (imgPlaneWidth + horizontalSpacing) ) {
                    mesh.position.x += fullLoopWidth * 2; // Move it past the duplicated set
                }
            });

            renderer.render(scene, camera);
        }

        // Initialize and start animation when window is loaded
        window.addEventListener('load', () => {
            init();
            animate();
        });
    }

    // Call the setup function for each 3D carousel
    setupThreeDCarousel('designCanvas');
    setupThreeDCarousel('printingCanvas');
});
