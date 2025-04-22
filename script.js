document.addEventListener('DOMContentLoaded', function() {
  // Initialize particle.js with reduced visibility
  particlesJS('particles-js', {
    particles: {
      number: { value: 60, density: { enable: true, value_area: 700 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.2, random: true },
      size: { value: 2, random: true },
      line_linked: { enable: true, distance: 120, color: "#ffffff", opacity: 0.1, width: 0.5 },
      move: { enable: true, speed: 1.5, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: false },
        onclick: { enable: false }
      }
    }
  });

  const textAnimation = document.getElementById('text-animation');
  const siteContent = document.getElementById('site-content');

  // After text animation completes
  setTimeout(() => {
    // Fade out text animation
    gsap.to(textAnimation, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => textAnimation.remove()
    });

    // Show site content with enhanced hero visibility
    gsap.to(siteContent, {
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      onComplete: forceHeroVisibility
    });
  }, 2500);

  // Force hero section to maximum visibility
  function forceHeroVisibility() {
    gsap.to(".hero-overlay", {
      backgroundColor: "rgba(0,0,0,0.9)",
      backdropFilter: "blur(3px)",
      duration: 0.5
    });

    gsap.to(".hero-text h1", {
      opacity: 1,
      color: "#ffffff",
      textShadow: "0 0 20px #000, 0 0 30px #000",
      duration: 0.5
    });

    gsap.to(".hero-text p", {
      opacity: 1,
      color: "#ffffff",
      textShadow: "0 0 15px #000, 0 0 20px #000",
      duration: 0.5
    });

    gsap.to(".hero-logo-center", {
      opacity: 1,
      filter: "drop-shadow(0 0 20px #000) brightness(1.3)",
      duration: 0.5
    });
  }

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

  // Button Hover Effect (if you have buttons with
