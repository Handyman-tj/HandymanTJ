document.addEventListener('DOMContentLoaded', function() {
    // 1. INITIALIZE PARTICLES
    particlesJS('particles-js', {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 2.5, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1.8, direction: "none", random: true, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: false },
                onclick: { enable: false }
            }
        }
    });

    // 2. INTRO ANIMATION SEQUENCE
    const textAnimation = document.getElementById('text-animation');
    const siteContent = document.getElementById('site-content');
    
    setTimeout(() => {
        gsap.to(textAnimation, {
            opacity: 0,
            duration: 0.8,
            ease: "power4.out",
            onComplete: () => {
                textAnimation.remove();
                gsap.to(siteContent, {
                    opacity: 1,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.5)",
                    onComplete: enhanceHeroVisibility
                });
            }
        });
    }, 2800);

    // 3. FORCE HERO VISIBILITY
    function enhanceHeroVisibility() {
        // Overlay enhancements
        gsap.to(".hero-overlay", {
            backgroundColor: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(8px)",
            duration: 1,
            ease: "power2.out"
        });

        // Text enhancements
        gsap.to(".hero-text h1", {
            opacity: 1,
            color: "#ffffff",
            textShadow: "0 0 30px #000, 0 0 40px #000",
            duration: 1.2,
            ease: "back.out(2)"
        });

        gsap.to(".hero-text p", {
            opacity: 1,
            color: "#ffffff",
            textShadow: "0 0 25px #000, 0 0 30px #000",
            duration: 1.2,
            ease: "back.out(2)",
            delay: 0.2
        });

        // Logo enhancements
        gsap.to(".hero-logo-center", {
            opacity: 1,
            filter: "drop-shadow(0 0 30px #000) brightness(1.5)",
            duration: 1.5,
            ease: "elastic.out(1, 0.5)"
        });
    }

    // 4. SCROLL ANIMATIONS
    gsap.registerPlugin(ScrollTrigger);
    
    // Services animation
    gsap.utils.toArray(".service").forEach((service, i) => {
        gsap.from(service, {
            scrollTrigger: {
                trigger: service,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 80,
            duration: 0.8,
            delay: i * 0.08,
            ease: "back.out(1.2)"
        });
    });

    // 5. HOVER EFFECTS
    document.querySelectorAll(".service").forEach(service => {
        service.addEventListener("mouseenter", () => {
            gsap.to(service, {
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                duration: 0.3
            });
        });
        service.addEventListener("mouseleave", () => {
            gsap.to(service, {
                scale: 1,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                duration: 0.4
            });
        });
    });

    // 6. MOBILE MENU TOGGLE (if needed)
    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.body.classList.toggle("menu-open");
        });
    }
});
