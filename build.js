const fs = require('fs');

const posts = JSON.parse(fs.readFileSync('posts.json', 'utf8'));
const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));

function pageStart(title) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title} — alloftheabove</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>`;
}

function header(current = '') {
    return `
    <div class="header">
        <h1>all of the above</h1>
        <h3>(this site is very under construction!)</h3>
        <nav>
            <a href="index.html" ${current === 'home' ? 'class="active"' : ''}>home</a>
            <a href="members.html" ${current === 'members' ? 'class="active"' : ''}>members</a>
        </nav>
    </div>`;
}

function pageEnd() {
    return `
    <footer></footer>
</body>
</html>`;
}

function renderSingleMedia(type, src, title = '', alt = '') {
    if (type === 'youtube') {
        return `
        <iframe
            src="${src}"
            title="${title}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            loading="lazy"
            allowfullscreen>
        </iframe>`;
    }

    if (type === 'video') {
        return `<video controls src="${src}" preload="metadata"></video>`;
    }

    if (type === 'image') {
        return `
        <img
            src="${src}"
            alt="${alt || title}"
            loading="lazy">`;
    }

    if (type === 'audio') {
        return `<audio controls src="${src}" preload="metadata"></audio>`;
    }

    if (type === 'embed') {
        return `
        <iframe
            src="${src}"
            title="${title}"
            frameborder="0"
            loading="lazy"
            allowfullscreen>
        </iframe>`;
    }

    return `<p class="unknown-type">[unknown media type: ${type}]</p>`;
}

function media(post) {
    const sources = Array.isArray(post.src) ? post.src : [post.src];
    const renderedItems = sources
        .map(src => renderSingleMedia(post.type, src, post.title, post.alt))
        .join('\n');

    if (sources.length > 1) {
        if (post.type === 'image') {
            return `
            <div class="gallery-wrapper">
                <div class="media-group media-group-image">${renderedItems}</div>
                <div class="gallery-controls">
                    <button class="gallery-nav-btn" onclick="this.closest('.gallery-wrapper').querySelector('.media-group-image').scrollBy({left: -this.closest('.gallery-wrapper').querySelector('.media-group-image').clientWidth, behavior: 'smooth'})">[ &lt; ]</button>
                    <button class="gallery-nav-btn" onclick="this.closest('.gallery-wrapper').querySelector('.media-group-image').scrollBy({left: this.closest('.gallery-wrapper').querySelector('.media-group-image').clientWidth, behavior: 'smooth'})">[ &gt; ]</button>
                </div>
            </div>`;
        }
        return `<div class="media-group media-group-${post.type}">${renderedItems}</div>`;
    }

    return renderedItems;
}

function renderPost(post) {
    let pfp = '/pfps/temp.jpg';

    try {
        const member = members.find(m => m.name === post.author);
        if (member && member.pfp) {
            pfp = member.pfp;
        }
    } catch (error) {
        console.error(`⚠️ Author name doesn't match any member for post "${post.title}":`);
    }

    return `
    <div class="post">
        <h2>${post.title}</h2>
        ${media(post)}
        <h3 class="post-description">${post.description}</h3>
        <div class="post-meta">
            <h3>by <button class="author-filter-btn" data-author="${post.author}">${post.author}</button> <span> <img class="post-author-pfp" src="${pfp}"> </span></h3>
            <h4>${post.date}</h4>
        </div>
    </div>`;
}

function renderMember(member) {
    let links = '';
    const pfp = member.pfp || '/pfps/temp.jpg';
    
    if (member.links?.length) {
        links = `
        <ul class="member-links">
            ${member.links.map(link => `
                <li>
                    <a href="${link.url}" target="_blank">
                        ${link.label}
                    </a>
                </li>
            `).join('')}
        </ul>`;
    }

    return `
    <div class="member">
        <div class="member-header">
            <img class="member-pfp" src="${pfp}" alt="${member.name}'s profile picture">
            <div class="member-text">
                <h2 class="member-name">${member.name}</h2>
                <p class="member-role">${member.role}</p>
                <button class="author-filter-btn member-feed-btn" data-author="${member.name}">-> artist feed</button>
            </div>
        </div>
        <p class="member-bio">${member.bio}</p>
        ${links}
    </div>`;
}

const POSTS_PER_PAGE = 10;
const sortedPosts = [...posts].reverse();

const home = sortedPosts
    .map(renderPost)
    .join('\n<hr class="post-divider">\n');

let paginationControls = '';
const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);

if (totalPages > 1) {
    paginationControls = `<div class="pagination" style="font-family: monospace; margin-top: 3em; display: flex; justify-content: center; gap: 1em;">`;
    for (let p = 1; p <= totalPages; p++) {
        paginationControls += `<a href="#" class="page-btn" data-page="${p}" style="color: #dbdbdb99; text-decoration: none; cursor: pointer;">[${p}]</a>`;
    }
    paginationControls += `</div>`;
}

const paginationScript = `
<script>
    document.addEventListener("DOMContentLoaded", () => {
        const allPosts = document.querySelectorAll('.post');
        const dividers = document.querySelectorAll('.post-divider');
        const pageButtons = document.querySelectorAll('.page-btn');
        const postsPerPage = ${POSTS_PER_PAGE};
        const stripContainer = document.querySelector('.strip');
        const paginationEl = document.querySelector('.pagination');

        document.querySelectorAll('.author-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.setItem('artistFilter', btn.dataset.author);
                window.location.href = 'index.html';
            });
        });

        if (!allPosts.length) return;

        const activeFilter = localStorage.getItem('artistFilter');
        const visiblePosts = activeFilter
            ? [...allPosts].filter(p => {
                    const authorBtn = p.querySelector('.author-filter-btn');
                    return authorBtn && authorBtn.dataset.author === activeFilter;
                })
            : [...allPosts];

        allPosts.forEach(p => p.style.display = 'none');
        dividers.forEach(d => d.style.display = 'none');

        if (activeFilter) {
            if (paginationEl) paginationEl.style.display = 'none';

            const clearBtn = document.createElement('button');
            clearBtn.id = 'clear-filter-btn';
            clearBtn.textContent = '[ × clear filter: ' + activeFilter + ' ]';
            clearBtn.addEventListener('click', () => {
                localStorage.removeItem('artistFilter');
                window.location.reload();
            });
            document.body.appendChild(clearBtn);
        }

        const filteredPageCount = Math.ceil(visiblePosts.length / postsPerPage);
        pageButtons.forEach(b => b.style.display = 'none');

        let filterPageBtns = [];
        if (filteredPageCount > 1 && paginationEl) {
            paginationEl.innerHTML = '';
            paginationEl.style.display = 'flex';
            for (let p = 1; p <= filteredPageCount; p++) {
                const b = document.createElement('a');
                b.href = '#';
                b.className = 'page-btn filter-page-btn';
                b.dataset.page = p;
                b.style.cssText = 'color: #dbdbdb99; text-decoration: none; cursor: pointer;';
                b.textContent = '[' + p + ']';

                if (p === 1) { 
                    b.style.color = '#dd0000'; 
                    b.style.textShadow = '0 0 10px rgba(255, 0, 60, 0.4)'; 
                    b.style.pointerEvents = 'none'; 
                }

                paginationEl.appendChild(b);
                filterPageBtns.push(b);
                b.addEventListener('click', e => {
                    e.preventDefault();
                    showFiltered(parseInt(b.dataset.page));
                });
            }
        }

        function showFiltered(pageNum) {
            const start = (pageNum - 1) * postsPerPage;
            const end = pageNum * postsPerPage;

            visiblePosts.forEach((post, idx) => {
                post.style.display = (idx >= start && idx < end) ? 'block' : 'none';
            });

            dividers.forEach(d => d.style.display = 'none');
            const pagePosts = visiblePosts.slice(start, end);
            pagePosts.forEach((post, idx) => {
                if (idx < pagePosts.length - 1) {
                    const next = post.nextElementSibling;
                    if (next && next.classList.contains('post-divider')) {
                        next.style.display = 'block';
                    }
                }
            });

            filterPageBtns.forEach(btn => {
                if (parseInt(btn.dataset.page) === pageNum) {
                    btn.style.color = '#dd0000';
                    btn.style.textShadow = '0 0 10px rgba(255, 0, 60, 0.4)';
                    btn.style.pointerEvents = 'none';
                } else {
                    btn.style.color = '#dbdbdb99';
                    btn.style.textShadow = 'none';
                    btn.style.pointerEvents = 'auto';
                }
            });

            if (window.scrollY > stripContainer.offsetTop) {
                window.scrollTo({ top: stripContainer.offsetTop - 30, behavior: 'smooth' });
            }
        }

        if (activeFilter) {
            showFiltered(1);
            return;
        }

        function showPage(pageNum) {
            const start = (pageNum - 1) * postsPerPage;
            const end = pageNum * postsPerPage;

            allPosts.forEach((post, idx) => {
                post.style.display = (idx >= start && idx < end) ? 'block' : 'none';
            });

            dividers.forEach((divider, idx) => {
                if (idx >= start && idx < end - 1 && idx < allPosts.length - 1) {
                    divider.style.display = 'block';
                } else {
                    divider.style.display = 'none';
                }
            });

            pageButtons.forEach(btn => {
                if (parseInt(btn.dataset.page) === pageNum) {
                    btn.style.color = '#dd0000';
                    btn.style.textShadow = '0 0 10px rgba(255, 0, 60, 0.4)';
                    btn.style.pointerEvents = 'none';
                } else {
                    btn.style.color = '#dbdbdb99';
                    btn.style.textShadow = 'none';
                    btn.style.pointerEvents = 'auto';
                }
            });

            if (window.scrollY > stripContainer.offsetTop) {
                window.scrollTo({ top: stripContainer.offsetTop - 30, behavior: 'smooth' });
            }
        }

        pageButtons.forEach(btn => {
            btn.style.display = '';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(parseInt(btn.dataset.page));
            });
        });

        showPage(1);
    });
</script>
`;

const indexPage = pageStart('alloftheabove') + header('home') + `
    <div class="strip">
        ${home}
        ${paginationControls}
    </div>
    ${paginationScript}
` + pageEnd();

fs.writeFileSync('index.html', indexPage);
console.log(`built index.html (${sortedPosts.length} posts managed via client paginationnationnation)`);

const people = members
    .map(renderMember)
    .join('\n<hr>\n');

const membersPage = pageStart('members') + header('members') + `
    <div class="strip">
        <div class="members-intro">
            <h2>about & why</h2>
            <p>
                all of the above is a multimedia art collective with no boundary on medium. photography, drawings, songs, audio, video, visual fx, experiments, games, programs, the abstract and the pristine porcelain. all of it has a home here.
            </p>
            <p>
                why do this? well, as my friend Amy quotes, "fun things are fun!"
            </p>
        </div>
        <hr>
        ${people}
    </div>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll('.author-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    localStorage.setItem('artistFilter', btn.dataset.author);
                    window.location.href = 'index.html';
                });
            });
        });
    </script>
` + pageEnd();

fs.writeFileSync('members.html', membersPage);
console.log(`built members.html (${members.length} members)`);
