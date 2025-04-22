// script.js - Your JavaScript for interactions and animations
document.addEventListener('DOMContentLoaded', function() {
  // Initialize particle.js
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
      move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "repulse" },
        onclick: { enable: true, mode: "push" }
      }
    }
  });

  const textAnimation = document.getElementById('text-animation');
  const siteContent = document.getElementById('site-content');

  // After text animation completes
  setTimeout(() => {
    // Fade out text animation with GSAP for smoother effect
    gsap.to(textAnimation, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => textAnimation.remove()
    });

    // Show site content with GSAP
    gsap.to(siteContent, {
      opacity: 1,
      duration: 1,
      ease: "power2.out"
    });
  }, 2500);

  // Initialize GSAP animations for scroll effects
  gsap.registerPlugin(ScrollTrigger);

  // Animate services on scroll
  gsap.utils.toArray('.service').forEach((service, i) => {
    gsap.from(service, {
      scrollTrigger: {
        trigger: service,
        start: "top 80%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
      delay: i * 0.1
    });
  });

  // Parallax effect for hero section
  gsap.to(".hero-overlay", {
    scrollTrigger: {
      trigger: ".hero",
      scrub: true
    },
    y: 100,
    opacity: 0.5
  });

  // Original JS code
  // Smooth Scrolling for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        gsap.to(window, {
          duration: 1,
          scrollTo: target,
          ease: "power2.inOut"
        });
      }
    });
  });

  // Button Hover Effect (if you have buttons with class="button")
  const buttons = document.querySelectorAll('.button');
  buttons.forEach(button => {
    button.addEventListener('mouseover', () => {
      gsap.to(button, {
        backgroundColor: '#0056b3',
        duration: 0.3
      });
    });
    button.addEventListener('mouseout', () => {
      gsap.to(button, {
        backgroundColor: '#007bff',
        duration: 0.3
      });
    });
  });

  // Crazy hover effect for gallery images
  document.querySelectorAll('.gallery-grid img').forEach(img => {
    img.addEventListener('mouseenter', () => {
      gsap.to(img, {
        scale: 1.1,
        rotation: 5,
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.7)',
        duration: 0.3,
        zIndex: 10
      });
    });
    img.addEventListener('mouseleave', () => {
      gsap.to(img, {
        scale: 1,
        rotation: 0,
        boxShadow: 'none',
        duration: 0.3,
        zIndex: 1
      });
    });
  });

  // Add crazy cursor effect
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.2,
      ease: "power2.out"
    });
  });

  document.addEventListener('mouseenter', () => {
    gsap.to(cursor, { opacity: 1, duration: 0.2 });
  });

  document.addEventListener('mouseleave', () => {
    gsap.to(cursor, { opacity: 0, duration: 0.2 });
  });

  // Add cursor styles dynamically
  const style = document.createElement('style');
  style.textContent = `.custom-cursor {
      position: fixed;
      width: 30px;
      height: 30px;
      border: 2px solid #00ff00;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: difference;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease;
    }`;
  document.head.appendChild(style);
});
