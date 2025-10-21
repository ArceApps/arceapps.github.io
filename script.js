// Enhanced JavaScript for a smoother UX
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    initThemeToggle();
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const navHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = target.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
            
            // Close mobile menu when a link is clicked
            const navMenu = document.getElementById('nav-menu');
            const navToggle = document.getElementById('nav-toggle');
            if (navMenu && navToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });

    // Mobile navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent click from bubbling up to the document
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Add active class to current page in navigation
    const currentPage = window.location.pathname;
    const currentNavLink = document.querySelector(`.nav-link[href="${currentPage}"]`) ||
                          document.querySelector(`.nav-link[href="/${currentPage}"]`) ||
                          document.querySelector('.nav-link[href="#home"]');

    if (currentNavLink) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        currentNavLink.classList.add('active');
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.project-card, .blog-card, .tech-card, .skill-category, .soft-skill-card, .timeline-item');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Add typing animation to code lines
    const codeLines = document.querySelectorAll('.code-line');
    codeLines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.5}s`;
    });

    // Load blog posts if on blog page
    if (window.location.pathname.includes('blog.html') || window.location.pathname === '/blog.html') {
        loadBlogPosts();

        // Search and filter functionality
        const searchInput = document.getElementById('search-input');
        const filterButtons = document.querySelectorAll('.filter-btn');

        searchInput.addEventListener('input', () => {
            filterAndSearchPosts();
        });

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterAndSearchPosts();
            });
        });
    }
    
    // Load latest blog posts if on home page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.includes('index.html')) {
        loadLatestBlogPosts();
    }

    // Back to top button functionality
    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

function filterAndSearchPosts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const blogCards = document.querySelectorAll('.blog-card');

    blogCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const summary = card.querySelector('p').textContent.toLowerCase();
        const category = card.querySelector('.blog-card-category')?.textContent || '';

        const matchesSearch = title.includes(searchTerm) || summary.includes(searchTerm);
        const matchesFilter = activeFilter === 'all' || category === activeFilter;

        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ... (The rest of the functions remain the same)
