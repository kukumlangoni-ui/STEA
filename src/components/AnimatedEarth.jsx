import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AnimatedEarth() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const isMobile = window.innerWidth < 768;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = isMobile ? 18 : 15;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: !isMobile,
      powerPreference: isMobile ? "low-power" : "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Earth Group
    const earthGroup = new THREE.Group();
    // Rotate to focus on Africa (roughly)
    earthGroup.rotation.y = Math.PI / 1.5; 
    earthGroup.rotation.z = 0.2;
    scene.add(earthGroup);

    // Earth Geometry
    const geometry = new THREE.SphereGeometry(5, isMobile ? 32 : 64, isMobile ? 32 : 64);
    
    // Material - Night Earth with Glow
    // Using a procedural-ish look with colors if texture fails, 
    // but let's try a high-quality dark material with emissive properties
    const material = new THREE.MeshPhongMaterial({
      color: 0x050816,
      emissive: 0x112244,
      specular: 0x111111,
      shininess: 5,
      wireframe: false,
    });

    const earth = new THREE.Mesh(geometry, material);
    earthGroup.add(earth);

    // Add a wireframe overlay for that "tech" feel
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xF5A623,
      wireframe: true,
      transparent: true,
      opacity: 0.05
    });
    const wireEarth = new THREE.Mesh(geometry, wireMaterial);
    wireEarth.scale.set(1.001, 1.001, 1.001);
    earthGroup.add(wireEarth);

    // Atmospheric Glow
    const glowGeometry = new THREE.SphereGeometry(5, isMobile ? 32 : 64, isMobile ? 32 : 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(1.15, 1.15, 1.15);
    earthGroup.add(glow);

    // Connectivity Arcs
    const createArc = (lat1, lon1, lat2, lon2, color) => {
      const start = new THREE.Vector3().setFromSphericalCoords(5, (90 - lat1) * (Math.PI / 180), lon1 * (Math.PI / 180));
      const end = new THREE.Vector3().setFromSphericalCoords(5, (90 - lat2) * (Math.PI / 180), lon2 * (Math.PI / 180));
      
      const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(6.5);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      
      const points = curve.getPoints(50);
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const arcMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
      return new THREE.Line(arcGeometry, arcMaterial);
    };

    // Add a few arcs around Africa/Global
    earthGroup.add(createArc(0, 20, 40, 0, 0xF5A623)); // Africa to Europe
    earthGroup.add(createArc(0, 20, -20, 40, 0xF5A623)); // Africa to Middle East
    earthGroup.add(createArc(0, 20, 10, -60, 0xF5A623)); // Africa to Americas

    // Initial scale for entrance animation
    earthGroup.scale.setScalar(0.001);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xF5A623, 1.5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Stars / Particles
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5
    });

    const starVertices = [];
    const starCount = isMobile ? 500 : 2000;
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animation
    let frameId;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX - width / 2) / (width / 2);
      mouseY = (event.clientY - height / 2) / (height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);

    let entranceDone = false;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const baseScale = width < 768 ? 0.7 : 1;
      
      // Entrance zoom
      if (!entranceDone) {
        earthGroup.scale.x += (baseScale - earthGroup.scale.x) * 0.02;
        earthGroup.scale.y = earthGroup.scale.x;
        earthGroup.scale.z = earthGroup.scale.x;
        if (Math.abs(earthGroup.scale.x - baseScale) < 0.001) entranceDone = true;
      }

      // Smooth mouse tilt
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      
      earthGroup.rotation.y += 0.0015;
      earthGroup.rotation.x = targetY * 0.1;
      earthGroup.position.x = targetX * 0.5;
      
      // Scroll parallax (only if entrance is mostly done)
      const scrollY = window.scrollY;
      earthGroup.position.y = -scrollY * 0.005;
      if (entranceDone) {
        const parallaxScale = 1 + scrollY * 0.0002;
        earthGroup.scale.setScalar(baseScale * parallaxScale);
      }
      
      stars.rotation.y -= 0.0002;
      stars.position.y = -scrollY * 0.002;
      
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      
      // Responsive scaling
      if (w < 768) {
        earthGroup.scale.setScalar(0.7);
        camera.position.z = 18;
      } else {
        earthGroup.scale.setScalar(1);
        camera.position.z = 15;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    const currentMount = mountRef.current;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      wireMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.8
      }} 
    />
  );
}
