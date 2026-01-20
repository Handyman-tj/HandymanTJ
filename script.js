document.addEventListener('DOMContentLoaded', function () {

    // Dynamic Year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Header Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav a');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (nav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            hamburger.querySelector('i').classList.remove('fa-times');
            hamburger.querySelector('i').classList.add('fa-bars');
        });
    });

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 90;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll('.service-card, .about-content, .gallery-item, .testimonial-card, .section-header');

    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        if (el.classList.contains('service-card')) {
            el.style.transitionDelay = `${index % 3 * 0.1}s`; // Stagger effect
        }
        observer.observe(el);
    });
});

// Video Scroller Functions
function scrollVideos(direction) {
    const scroller = document.querySelector('.video-scroller');
    const scrollAmount = scroller.offsetWidth;
    scroller.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

function playThisVideo(video) {
    document.querySelectorAll('.video-item').forEach(v => v.pause());
    video.play();
}

// Lightbox Functionality
function showImage(src) {
    const lightbox = document.createElement('div');
    lightbox.style.position = 'fixed';
    lightbox.style.top = '0';
    lightbox.style.left = '0';
    lightbox.style.width = '100%';
    lightbox.style.height = '100%';
    lightbox.style.background = 'rgba(0,0,0,0.9)';
    lightbox.style.zIndex = '2000';
    lightbox.style.display = 'flex';
    lightbox.style.alignItems = 'center';
    lightbox.style.justifyContent = 'center';
    lightbox.style.cursor = 'zoom-out';
    lightbox.style.opacity = '0';
    lightbox.style.transition = 'opacity 0.3s ease';

    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90vh';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
    img.style.transform = 'scale(0.9)';
    img.style.transition = 'transform 0.3s ease';

    lightbox.appendChild(img);
    document.body.appendChild(lightbox);

    // Trigger animation
    requestAnimationFrame(() => {
        lightbox.style.opacity = '1';
        img.style.transform = 'scale(1)';
    });

    lightbox.addEventListener('click', () => {
        lightbox.style.opacity = '0';
        img.style.transform = 'scale(0.9)';
        setTimeout(() => {
            lightbox.remove();
        }, 300);
    });
}
