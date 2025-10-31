document.addEventListener('DOMContentLoaded', () => {
  // Dynamic year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hamburger menu
  const hamburger = document.querySelector('.hamburger');
  const navUl = document.querySelector('nav ul');
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !expanded);
    navUl.classList.toggle('show');
  });

  // Form submission
  const form = document.querySelector('form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(res => {
      if (res.ok) {
        alert('Thank you! We\'ll respond soon.');
        form.reset();
      } else alert('Issue sending—try again.');
    }).catch(() => alert('Error—try later.'));
  });

  // Scroll animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section, .service, .gallery-grid img').forEach(el => observer.observe(el));

  // Service filters
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('.tab.active').classList.remove('active');
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      document.querySelectorAll('.service').forEach(service => {
        if (filter === 'all' || service.dataset.category === filter) {
          service.style.display = 'block';
          service.classList.add('visible');
        } else {
          service.style.display = 'none';
          service.classList.remove('visible');
        }
      });
    });
  });

  // Testimonial carousel (auto-advance every 5s, manual buttons)
  let testimonialIndex = 0;
  const testimonials = document.querySelectorAll('.testimonial');
  function showTestimonial(index) {
    testimonials.forEach(t => t.classList.remove('active'));
    testimonials[index].classList.add('active');
  }
  function nextTestimonial(dir) {
    testimonialIndex = (testimonialIndex + dir + testimonials.length) % testimonials.length;
    showTestimonial(testimonialIndex);
  }
  setInterval(() => nextTestimonial(1), 5000); // Auto
  window.nextTestimonial = nextTestimonial; // Global for onclick

  // Video scroller
  window.scrollVideos = direction => {
    const scroller = document.querySelector('.video-scroller');
    scroller.style.transform = `translateX(${direction * -100}%)`;
  };

  window.playThisVideo = video => {
    document.querySelectorAll('.video-item').forEach(v => v.pause());
    video.play();
  };

  // Lightbox
  window.showImage = src => {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <img src="${src}" alt="Enlarged project image">
      <span class="close">&times;</span>
    `;
    lightbox.querySelector('.close').onclick = () => lightbox.remove();
    lightbox.onclick = e => { if (e.target === lightbox) lightbox.remove(); };
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden'; // Prevent scroll
    lightbox.addEventListener('remove', () => document.body.style.overflow = 'auto');
  };

  // Close lightbox on Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelector('.lightbox')?.remove();
  });
});
