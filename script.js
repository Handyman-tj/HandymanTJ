document.addEventListener('DOMContentLoaded', function() {
  // Dynamic copyright year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Hamburger menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navUl = document.querySelector('nav ul');
  hamburger.addEventListener('click', () => {
    navUl.classList.toggle('show');
  });

  // Contact form submission (client-side placeholder)
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.submit(); // Submit the form to Formspree
    alert('Thank you for your message! We will get back to you soon.');
    form.reset();
  });

  // Fade-in animations for sections
  const sections = document.querySelectorAll('section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry);
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => observer.observe(section));
});

// Video scroller functions
function scrollVideos(direction) {
  const scroller = document.querySelector('.video-scroller');
  const scrollAmount = scroller.offsetWidth; // Scroll by the width of the container for one item at a time
  scroller.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
}

function playThisVideo(video) {
  // Pause all videos
  document.querySelectorAll('.video-item').forEach(v => v.pause());
  // Play the clicked one
  video.play();
}
