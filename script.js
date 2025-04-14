// H Animation and Site Reveal
window.addEventListener('load', function() {
  const hAnimation = document.getElementById('h-animation');
  const siteContent = document.getElementById('site-content');
  
  // Show site content after animation completes
  setTimeout(function() {
    siteContent.style.display = 'block';
    hAnimation.style.display = 'none';
  }, 1500); // Match this with the animation duration
  
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
