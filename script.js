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

// Button Hover Effect
const buttons = document.querySelectorAll('.button');
buttons.forEach(button => {
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#0056b3';
  });
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#007bff';
  });
});

// H Intro Animation
window.addEventListener('load', () => {
  const intro = document.querySelector('.intro-h');
  setTimeout(() => {
    intro.style.opacity = '0';
    setTimeout(() => {
      intro.style.display = 'none';
    }, 1000);
  }, 2500);
});
