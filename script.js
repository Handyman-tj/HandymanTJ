// Basic JavaScript Interactions

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Example: Change button color on hover
const buttons = document.querySelectorAll('.button');
buttons.forEach(button => {
    button.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#0056b3'; // Darker blue on hover
    });
    button.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#007bff'; // Original blue
    });
});