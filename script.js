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

  // Contact form submission with Formspree
  const form = document.querySelector('#contact form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        alert('Thank you for your message! We will get back to you soon.');
        form.reset();
      } else {
        alert('There was an issue sending your message. Please try again.');
      }
    }).catch(error => {
      alert('There was an error. Please try again later.');
    });
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

// Lightbox function for gallery images
function showImage(src) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  const img = document.createElement('img');
  img.src = src;
  const close = document.createElement('span');
  close.className = 'close';
  close.innerHTML = '&times;';
  close.onclick = () => lightbox.remove();
  lightbox.appendChild(img);
  lightbox.appendChild(close);
  document.body.appendChild(lightbox);

  // Close lightbox when clicking outside the image
  lightbox.onclick = (e) => {
    if (e.target === lightbox) lightbox.remove();
  };
}
