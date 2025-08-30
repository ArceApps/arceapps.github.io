// Simple and clean JavaScript for the portfolio site
document.addEventListener('DOMContentLoaded', function() {
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
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
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
        
        const blogPostsContainer = document.getElementById('blog-posts');
        const postCountElement = document.getElementById('post-count');
        
        if (blogPostsContainer) {
            blogPostsContainer.innerHTML = '';
            
            sortedPosts.forEach(post => {
                const postElement = createBlogPostElement(post);
                blogPostsContainer.appendChild(postElement);
            });
            
            // Update post count
            if (postCountElement) {
                postCountElement.textContent = sortedPosts.length;
            }
        }
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
    const emailElement = document.getElementById('personal-email');
    const experienceElement = document.getElementById('personal-experience');
    const quoteElement = document.getElementById('personal-quote');
    
    if (descriptionElement) descriptionElement.textContent = personal.description;
    if (nameElement) nameElement.textContent = personal.name;
    if (titleElement) titleElement.textContent = personal.title;
    if (locationElement) locationElement.textContent = personal.location;
    if (emailElement) emailElement.textContent = personal.email;
    if (experienceElement) experienceElement.textContent = `${personal.experience} de experiencia`;
    if (quoteElement) quoteElement.textContent = `"${personal.quote}"`;
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
                ${skillCategory.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
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
                    ${job.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
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
