// Simple and clean JavaScript for the portfolio site
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    initThemeToggle();
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only prevent default for anchor links on same page
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
            if (navMenu && navToggle) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });

    // Mobile navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        
        if (scrollTop > 100) {
            if (currentTheme === 'dark') {
                navbar.style.background = 'rgba(17, 24, 39, 0.98)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            }
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            if (currentTheme === 'dark') {
                navbar.style.background = 'rgba(17, 24, 39, 0.95)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            }
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.project-card, .blog-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
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
    }
    
    // Load latest blog posts if on home page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.includes('index.html')) {
        loadLatestBlogPosts();
    }
});

// Function to load blog posts from posts.json
async function loadBlogPosts() {
    try {
        const response = await fetch('posts.json');
        const posts = await response.json();
        
        // Sort posts by date (newest first)
        const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Get current page from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page')) || 1;
        const postsPerPage = 6;
        
        // Calculate pagination
        const totalPosts = sortedPosts.length;
        const totalPages = Math.ceil(totalPosts / postsPerPage);
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const postsToShow = sortedPosts.slice(startIndex, endIndex);
        
        const blogPostsContainer = document.getElementById('blog-posts');
        const postCountElement = document.getElementById('post-count');
        const categoryCountElement = document.getElementById('category-count');
        
        if (blogPostsContainer) {
            blogPostsContainer.innerHTML = '';
            
            postsToShow.forEach(post => {
                const postElement = createBlogPostElement(post);
                blogPostsContainer.appendChild(postElement);
            });
            
            // Update post count (total posts, not just current page)
            if (postCountElement) {
                postCountElement.textContent = totalPosts;
            }
            
            // Update category count
            if (categoryCountElement) {
                const uniqueCategories = [...new Set(sortedPosts.map(post => post.category))];
                categoryCountElement.textContent = uniqueCategories.length;
            }
        }
        
        // Load pagination controls
        loadPaginationControls(currentPage, totalPages, totalPosts);
        
        // Load tag groups (with all posts for filtering)
        loadTagGroups(sortedPosts);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        
        // Fallback content if posts.json fails to load
        const blogPostsContainer = document.getElementById('blog-posts');
        if (blogPostsContainer) {
            blogPostsContainer.innerHTML = `
                <div class="blog-card">
                    <div class="blog-card-content">
                        <h3>Error cargando artículos</h3>
                        <p>No se pudieron cargar los artículos del blog en este momento.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Function to load latest blog posts for home page (only 3 latest)
async function loadLatestBlogPosts() {
    try {
        const response = await fetch('posts.json');
        const posts = await response.json();
        
        // Sort posts by date (newest first) and take only the first 3
        const latestPosts = posts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
        
        const blogGridContainer = document.querySelector('.blog-section .blog-grid');
        
        if (blogGridContainer) {
            blogGridContainer.innerHTML = '';
            
            latestPosts.forEach(post => {
                const postElement = createHomeBlogPostElement(post);
                blogGridContainer.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Error loading latest blog posts:', error);
        
        // Keep fallback content if posts.json fails to load
        const blogGridContainer = document.querySelector('.blog-section .blog-grid');
        if (blogGridContainer) {
            blogGridContainer.innerHTML = `
                <article class="blog-card">
                    <div class="blog-date">Error</div>
                    <h3>Error cargando artículos</h3>
                    <p>No se pudieron cargar los artículos del blog en este momento.</p>
                    <a href="blog.html" class="blog-link">Ver blog →</a>
                </article>
            `;
        }
    }
}

// Function to create a blog post element for home page
function createHomeBlogPostElement(post) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    
    // Format date
    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    article.innerHTML = `
        <div class="blog-date">${formattedDate}</div>
        <h3>${post.title}</h3>
        <p>${post.summary}</p>
        <a href="${post.url}" class="blog-link">
            ${post.url === '#' ? 'Próximamente' : 'Leer más'} →
        </a>
    `;
    
    return article;
}

// Function to create a blog post element
function createBlogPostElement(post) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    article.dataset.tags = post.tags ? post.tags.join(',') : '';
    
    // Format date
    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    article.innerHTML = `
        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="blog-card-image">` : ''}
        <div class="blog-card-content">
            <div class="blog-card-meta">
                <span class="blog-card-date">${formattedDate}</span>
                ${post.category ? `<span class="blog-card-category">${post.category}</span>` : ''}
            </div>
            <h3>${post.title}</h3>
            <p>${post.summary}</p>
            <a href="${post.url}" class="blog-card-link">
                ${post.url === '#' ? 'Próximamente' : 'Leer artículo'} →
            </a>
        </div>
    `;
    
    return article;
}

// Function to load tag groups
function loadTagGroups(posts) {
    const tagGroupsContainer = document.getElementById('tag-groups');
    if (!tagGroupsContainer) return;
    
    // Extract all unique tags from posts
    const allTags = new Set();
    posts.forEach(post => {
        if (post.tags) {
            post.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    // Define tag groups with their categories
    const tagGroups = {
        'Desarrollo Android': [
            'Android', 'Kotlin', 'MVVM', 'ViewModel', 'LiveData', 'StateFlow', 'SharedFlow',
            'Jetpack Compose', 'Navigation', 'Animations', 'UI', 'View Layer', 'Model Layer',
            'Coroutines', 'Flow', 'Memory Leaks', 'Mobile Development', 'Modules'
        ],
        'Arquitectura y Patrones': [
            'Architecture', 'Clean Architecture', 'Clean Code', 'SOLID', 'Repository Pattern',
            'Use Cases', 'Domain Layer', 'Domain Models', 'Domain Services', 'Business Logic',
            'State Management', 'Dependency Injection', 'Dagger', 'Hilt', 'Scopes'
        ],
        'DevOps y Herramientas': [
            'DevOps', 'GitHub Actions', 'CI/CD', 'Automation', 'Automatización', 'Google Play Store',
            'Gradle', 'Release Management', 'Semantic Versioning', 'Versioning', 'Versionado',
            'Version Control', 'Git', 'Conventional Commits', 'Changelog'
        ],
        'Desarrollo Web': [
            'Web Development', 'GitHub Pages', 'Static Sites', 'Jekyll', 'Hosting', 'SSL',
            'CDN', 'Analytics'
        ],
        'Base de Datos y Persistencia': [
            'Room Database', 'Room', 'SQLite', 'Persistence', 'Caching', 'Retrofit'
        ],
        'Testing y Calidad': [
            'Testing', 'Debugging', 'Error Handling', 'Firebase', 'Crashlytics'
        ],
        'Programación Reactiva': [
            'Reactive Programming', 'Async Programming'
        ]
    };
    
    // Filter tags that actually exist in posts
    const filteredGroups = {};
    Object.keys(tagGroups).forEach(groupName => {
        const existingTags = tagGroups[groupName].filter(tag => allTags.has(tag));
        if (existingTags.length > 0) {
            filteredGroups[groupName] = existingTags.sort();
        }
    });
    
    // Create HTML for tag groups
    let groupsHTML = '';
    Object.keys(filteredGroups).forEach(groupName => {
        const groupTags = filteredGroups[groupName];
        groupsHTML += `
            <div class="tag-group">
                <h4 class="tag-group-title">${groupName}</h4>
                <div class="tag-group-tags">
                    ${groupTags.map(tag => `<button class="tag-filter" data-tag="${tag}">${tag}</button>`).join('')}
                </div>
            </div>
        `;
    });
    
    // Add "Show All" button at the top
    tagGroupsContainer.innerHTML = `
        <div class="tag-group">
            <div class="tag-group-tags">
                <button class="tag-filter active show-all-btn" data-tag="all">Mostrar Todos</button>
            </div>
        </div>
        ${groupsHTML}
    `;
    
    // Add click event listeners to tag filters
    const tagFilterButtons = tagGroupsContainer.querySelectorAll('.tag-filter');
    tagFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedTag = button.dataset.tag;
            filterPostsByTag(selectedTag);
            
            // Update active button
            tagFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

// Function to filter posts by tag
function filterPostsByTag(selectedTag) {
    const blogCards = document.querySelectorAll('.blog-card');
    
    blogCards.forEach(card => {
        if (selectedTag === 'all') {
            card.style.display = 'block';
        } else {
            const cardTags = card.dataset.tags ? card.dataset.tags.split(',') : [];
            if (cardTags.includes(selectedTag)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Function to load pagination controls
function loadPaginationControls(currentPage, totalPages, totalPosts) {
    const paginationSection = document.getElementById('pagination-section');
    if (!paginationSection || totalPages <= 1) {
        if (paginationSection) {
            paginationSection.innerHTML = '';
        }
        return;
    }
    
    const postsPerPage = 6;
    const startPost = (currentPage - 1) * postsPerPage + 1;
    const endPost = Math.min(currentPage * postsPerPage, totalPosts);
    
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<a href="blog.html?page=${currentPage - 1}" class="pagination-link">‹ Anterior</a>`;
    } else {
        paginationHTML += '<span class="pagination-link disabled">‹ Anterior</span>';
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += '<a href="blog.html?page=1" class="pagination-link">1</a>';
        if (startPage > 2) {
            paginationHTML += '<span class="pagination-link disabled">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<span class="pagination-link active">${i}</span>`;
        } else {
            paginationHTML += `<a href="blog.html?page=${i}" class="pagination-link">${i}</a>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="pagination-link disabled">...</span>';
        }
        paginationHTML += `<a href="blog.html?page=${totalPages}" class="pagination-link">${totalPages}</a>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<a href="blog.html?page=${currentPage + 1}" class="pagination-link">Siguiente ›</a>`;
    } else {
        paginationHTML += '<span class="pagination-link disabled">Siguiente ›</span>';
    }
    
    paginationHTML += '</div>';
    
    // Add pagination info
    paginationHTML += `<div class="pagination-info">Mostrando ${startPost}-${endPost} de ${totalPosts} artículos</div>`;
    
    paginationSection.innerHTML = paginationHTML;
}

// About page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load about data if on about page
    if (window.location.pathname === '/about.html' || window.location.pathname.includes('about.html')) {
        loadAboutData();
    }
});

// Function to load about data from about.json
async function loadAboutData() {
    try {
        const response = await fetch('about.json');
        const aboutData = await response.json();
        
        // Load personal information
        loadPersonalInfo(aboutData.personal);
        
        // Load technical skills
        loadTechnicalSkills(aboutData.skills.technical);
        
        // Load soft skills
        loadSoftSkills(aboutData.skills.soft);
        
        // Load experience
        loadExperience(aboutData.experience);
        
        // Load education
        loadEducation(aboutData.education);
        
        // Load achievements
        loadAchievements(aboutData.achievements);
        
        // Load languages
        loadLanguages(aboutData.languages);
        
        // Load interests
        loadInterests(aboutData.interests);
        
    } catch (error) {
        console.error('Error loading about data:', error);
    }
}

// Function to load personal information
function loadPersonalInfo(personal) {
    const descriptionElement = document.getElementById('about-description');
    const nameElement = document.getElementById('personal-name');
    const titleElement = document.getElementById('personal-title');
    const locationElement = document.getElementById('personal-location');
    const githubElement = document.getElementById('personal-github');
    const experienceElement = document.getElementById('personal-experience');
    const quoteElement = document.getElementById('personal-quote');
    
    if (descriptionElement) descriptionElement.textContent = personal.description;
    if (nameElement) nameElement.textContent = personal.name;
    if (titleElement) titleElement.textContent = personal.title;
    if (locationElement) locationElement.textContent = personal.location;
    if (githubElement) {
        githubElement.href = personal.github;
        githubElement.textContent = personal.github.replace('https://', '');
    }
    if (experienceElement) experienceElement.textContent = `${personal.experience} de experiencia`;
    if (quoteElement) quoteElement.textContent = `"${personal.quote}"`;
}

// Helper function to get icon for a technology
function getTechIcon(techName) {
    const iconMap = {
        'Kotlin': '🟣',
        'Java': '☕',
        'JavaScript': '🟨',
        'Jetpack Compose': '🎨',
        'MVVM': '🔄',
        'MVP': '📐',
        'Hilt': '💉',
        'Coroutines': '🔄',
        'Firebase': '🔥',
        'Retrofit': '🌐',
        'Room': '🏠',
        'RxJava': '⚡',
        'Android SDK': '🤖',
        'SQLite': '🗃️',
        'Volley': '📡',
        'Material Design': '🎨',
        'AdMob': '💰',
        'In-app Billing': '💳'
    };
    return iconMap[techName] || '';
}

// Function to load technical skills
function loadTechnicalSkills(technicalSkills) {
    const skillsContainer = document.getElementById('technical-skills');
    if (!skillsContainer) return;
    
    skillsContainer.innerHTML = '';
    
    technicalSkills.forEach(skillCategory => {
        const skillElement = document.createElement('div');
        skillElement.className = 'skill-category';
        
        skillElement.innerHTML = `
            <div class="skill-category-header">
                <div class="skill-category-icon">${skillCategory.icon || ''}</div>
                <h3>${skillCategory.category}</h3>
            </div>
            <div class="skill-tags">
                ${skillCategory.items.map(item => {
                    // Handle both old format (string) and new format (object with name and icon)
                    if (typeof item === 'string') {
                        return `<span class="skill-tag">${item}</span>`;
                    } else {
                        return `<span class="skill-tag"><span class="skill-icon">${item.icon}</span> ${item.name}</span>`;
                    }
                }).join('')}
            </div>
        `;
        
        skillsContainer.appendChild(skillElement);
    });
}

// Function to load soft skills
function loadSoftSkills(softSkills) {
    const softSkillsContainer = document.getElementById('soft-skills');
    if (!softSkillsContainer) return;
    
    softSkillsContainer.innerHTML = '';
    
    softSkills.forEach(skill => {
        const skillElement = document.createElement('div');
        skillElement.className = 'soft-skill-card';
        
        skillElement.innerHTML = `
            <h3>${skill.skill}</h3>
            <p>${skill.description}</p>
        `;
        
        softSkillsContainer.appendChild(skillElement);
    });
}

// Function to load experience
function loadExperience(experience) {
    const experienceContainer = document.getElementById('experience-timeline');
    if (!experienceContainer) return;
    
    experienceContainer.innerHTML = '';
    
    experience.forEach(job => {
        const jobElement = document.createElement('div');
        jobElement.className = 'timeline-item';
        
        jobElement.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-header">
                    <div>
                        <h3 class="timeline-position">${job.position}</h3>
                        <p class="timeline-company">${job.company}</p>
                    </div>
                    <span class="timeline-period">${job.period} (${job.duration})</span>
                </div>
                <p class="timeline-description">${job.description}</p>
                <div class="timeline-achievements">
                    <h4>Logros principales:</h4>
                    <ul class="achievement-list">
                        ${job.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
                <div class="timeline-technologies">
                    ${job.technologies.map(tech => {
                        const icon = getTechIcon(tech);
                        return `<span class="tech-badge">${icon ? `<span class="tech-icon">${icon}</span> ` : ''}${tech}</span>`;
                    }).join('')}
                </div>
            </div>
        `;
        
        experienceContainer.appendChild(jobElement);
    });
}

// Function to load education
function loadEducation(education) {
    const educationContainer = document.getElementById('education-list');
    if (!educationContainer) return;
    
    educationContainer.innerHTML = '';
    
    education.forEach(edu => {
        const eduElement = document.createElement('div');
        eduElement.className = 'education-item';
        
        eduElement.innerHTML = `
            <h4>${edu.degree}</h4>
            <p class="education-institution">${edu.institution}</p>
            <p class="education-year">${edu.year}</p>
            <p class="education-description">${edu.description}</p>
        `;
        
        educationContainer.appendChild(eduElement);
    });
}

// Function to load achievements
function loadAchievements(achievements) {
    const achievementsContainer = document.getElementById('achievements-list');
    if (!achievementsContainer) return;
    
    achievementsContainer.innerHTML = '';
    
    achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement-item';
        
        achievementElement.innerHTML = `
            <h4>${achievement.title}</h4>
            <p class="achievement-year">${achievement.year}</p>
            <p class="achievement-description">${achievement.description}</p>
        `;
        
        achievementsContainer.appendChild(achievementElement);
    });
}

// Function to load languages
function loadLanguages(languages) {
    const languagesContainer = document.getElementById('languages-list');
    if (!languagesContainer) return;
    
    languagesContainer.innerHTML = '';
    
    languages.forEach(lang => {
        const langElement = document.createElement('div');
        langElement.className = 'languages-item';
        
        langElement.innerHTML = `
            <span class="language-name">${lang.language}</span>
            <span class="language-level">${lang.level}</span>
        `;
        
        languagesContainer.appendChild(langElement);
    });
}

// Function to load interests
function loadInterests(interests) {
    const interestsContainer = document.getElementById('interests-list');
    if (!interestsContainer) return;
    
    interestsContainer.innerHTML = '';
    
    interests.forEach(interest => {
        const interestElement = document.createElement('span');
        interestElement.className = 'interest-tag';
        interestElement.textContent = interest;
        
        interestsContainer.appendChild(interestElement);
    });
}

// Theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply the saved theme
    applyTheme(savedTheme);
    
    // Update toggle button state
    updateToggleButton(savedTheme, themeIcon);
    
    // Add click event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            applyTheme(newTheme);
            updateToggleButton(newTheme, themeIcon);
            
            // Save preference
            localStorage.setItem('theme', newTheme);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function updateToggleButton(theme, themeIcon) {
    if (themeIcon) {
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// Contact form functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Create email body
            const emailSubject = encodeURIComponent('[formulario web] ' + subject);
            const emailBody = encodeURIComponent(
                `Nombre: ${name}\n` +
                `Email: ${email}\n` +
                `Asunto: ${subject}\n\n` +
                `Mensaje:\n${message}`
            );
            
            // Create mailto link
            const mailtoLink = `mailto:arceapps.dev@gmail.com?subject=${emailSubject}&body=${emailBody}`;
            
            // Show success message
            formStatus.style.display = 'block';
            formStatus.className = 'form-status success';
            formStatus.innerHTML = `
                <div class="status-content">
                    <h3>✅ Formulario completado</h3>
                    <p>Tu mensaje ha sido preparado. Haz clic en el botón de abajo para abrir tu cliente de correo electrónico y enviarlo.</p>
                    <button class="btn btn-primary" onclick="window.location.href='${mailtoLink}'">
                        📧 Abrir cliente de correo
                    </button>
                    <button class="btn btn-secondary" onclick="copyMessageToClipboard()">
                        📋 Copiar al portapapeles
                    </button>
                    <p class="small-text">Si no funciona automáticamente, envía un correo a: <strong>arceapps.dev@gmail.com</strong></p>
                </div>
            `;
            
            // Store form data for clipboard copy
            window.contactFormData = {
                name: name,
                email: email,
                subject: subject,
                message: message
            };
            
            // Scroll to status message
            formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
});

// Function to copy message to clipboard
function copyMessageToClipboard() {
    const data = window.contactFormData;
    if (!data) return;
    
    const textToCopy = 
        `Para: arceapps.dev@gmail.com\n` +
        `Asunto: [formulario web] ${data.subject}\n\n` +
        `Nombre: ${data.name}\n` +
        `Email: ${data.email}\n` +
        `Asunto: ${data.subject}\n\n` +
        `Mensaje:\n${data.message}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(function() {
        // Show success feedback
        const formStatus = document.getElementById('form-status');
        const originalContent = formStatus.innerHTML;
        
        formStatus.innerHTML = `
            <div class="status-content">
                <h3>✅ Copiado al portapapeles</h3>
                <p>El mensaje ha sido copiado. Pégalo en tu cliente de correo electrónico preferido.</p>
                <button class="btn btn-secondary" onclick="location.reload()">
                    🔄 Enviar otro mensaje
                </button>
            </div>
        `;
    }).catch(function(err) {
        alert('No se pudo copiar al portapapeles. Por favor, copia manualmente la información del formulario.');
    });
}
