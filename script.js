// Insane Animation Sequence
document.addEventListener('DOMContentLoaded', function() {
  const textAnimation = document.getElementById('text-animation');
  const pixelOverlay = document.getElementById('pixel-overlay');
  const siteContent = document.getElementById('site-content');
  
  // Create pixel reveal effect
  function createPixelEffect() {
    const pixelSize = 20;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);
    
    // Create pixels
    for (let i = 0; i < cols * rows; i++) {
      const pixel = document.createElement('div');
      pixel.className = 'pixel';
      pixel.style.width = `${pixelSize}px`;
      pixel.style.height = `${pixelSize}px`;
      pixel.style.left = `${(i % cols) * pixelSize}px`;
      pixel.style.top = `${Math.floor(i / cols) * pixelSize}px`;
      
      // Random delay for each pixel
      const delay = Math.random() * 2;
      pixel.style.transitionDelay = `${delay}s`;
      
      pixelOverlay.appendChild(pixel);
    }
    
    // Animate pixels
    setTimeout(() => {
      const pixels = document.querySelectorAll('.pixel');
      pixels.forEach(pixel => {
        const randomX = (Math.random() - 0.5) * 200;
        const randomY = (Math.random() - 0.5) * 200;
        const randomRotate = Math.random() * 360;
        
        pixel.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
        pixel.style.opacity = '0';
      });
      
      // Show site content after pixel animation
      setTimeout(() => {
        siteContent.style.visibility = 'visible';
        pixelOverlay.style.opacity = '0';
        
        // Remove overlay after animation
        setTimeout(() => {
          textAnimation.remove();
          pixelOverlay.remove();
        }, 1000);
      }, 2000);
    }, 500);
  }
  
  // Start the sequence after text animation
  setTimeout(() => {
    textAnimation.style.opacity = '0';
    createPixelEffect();
  }, 2500);
  
  // Original JS code
  // Smooth Scrolling for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Button Hover Effect (if you have buttons with class="button")
  const buttons = document.querySelectorAll('.button');
  buttons.forEach(button => {
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#0056b3'; // Darker blue
    });
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#007bff'; // Original blue
    });
  });
});
