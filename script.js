// Animation Sequence
document.addEventListener('DOMContentLoaded', function() {
  const textAnimation = document.getElementById('text-animation');
  const siteContent = document.getElementById('site-content');
  
  // After text animation completes
  setTimeout(() => {
    // Fade out text animation
    textAnimation.style.opacity = '0';
    
    // Show site content
    setTimeout(() => {
      siteContent.style.opacity = '1';
      textAnimation.remove();
    }, 500);
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
