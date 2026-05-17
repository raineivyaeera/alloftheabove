const fs = require('fs');

const posts = JSON.parse(
    fs.readFileSync('posts.json', 'utf8')
);

const members = JSON.parse(
    fs.readFileSync('members.json', 'utf8')
);

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
      <a href="index.html"
         ${current === 'home' ? 'class="active"' : ''}>
         home
      </a>

      <a href="members.html"
         ${current === 'members' ? 'class="active"' : ''}>
         members
      </a>
    </nav>
  </div>`;
}

function pageEnd() {
    return `
  <footer></footer>
</body>
</html>`;
}

function media(post) {
    if (post.type === 'youtube') {
        return `
    <iframe
      src="${post.src}"
      title="${post.title}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referreypolicy="strict-origin-when-cross-origin"
      loading="lazy"
      allowfullscreen>
    </iframe>`;
    }

    if (post.type === 'video') {
        return `<video controls src="${post.src}" preload="metadata"></video>`;
    }

    if (post.type === 'image') {
        return `
    <img
      src="${post.src}"
      alt="${post.alt || post.title}"
      loading="lazy">
    `;
    }

    if (post.type === 'audio') {
        return `<audio controls src="${post.src}" preload="metadata"></audio>`;
    }

    if (post.type === 'embed') {
        return `
    <iframe
      src="${post.src}"
      title="${post.title}"
      frameborder="0"
      loading="lazy"
      allowfullscreen>
    </iframe>`;
    }

    return `
    <p class="unknown-type">
      [unknown media type: ${post.type}]
    </p>`;
}

function renderPost(post) {
    return `
  <div class="post">
    <h2>${post.title}</h2>

    ${media(post)}

    <div class="post-meta">
      <h3>by ${post.author}</h3>
      <h4>${post.date}</h4>
    </div>
  </div>`;
}

function renderMember(member) {
    let links = '';

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
    <h2>${member.name}</h2>

    <p class="member-role">
      ${member.role}
    </p>

    <p class="member-bio">
      ${member.bio}
    </p>

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
    const posts = document.querySelectorAll('.post');
    const dividers = document.querySelectorAll('.post-divider');
    const buttons = document.querySelectorAll('.page-btn');
    const postsPerPage = ${POSTS_PER_PAGE};
    const stripContainer = document.querySelector('.strip');

    function showPage(pageNum) {
      const start = (pageNum - 1) * postsPerPage;
      const end = pageNum * postsPerPage;

      posts.forEach((post, idx) => {
        post.style.display = (idx >= start && idx < end) ? 'block' : 'none';
      });

      dividers.forEach((divider, idx) => {
        if (idx >= start && idx < end - 1 && idx < posts.length - 1) {
          divider.style.display = 'block';
        } else {
          divider.style.display = 'none';
        }
      });

      buttons.forEach(btn => {
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

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(parseInt(btn.dataset.page));
      });
    });

    showPage(1);
  });
</script>
`;

const indexPage =
    pageStart('alloftheabove') +
    header('home') +
    `
  <div class="strip">
    ${home}
    ${paginationControls}
  </div>
  ${paginationScript}
  ` +
    pageEnd();

fs.writeFileSync('index.html', indexPage);
console.log(`built index.html (${sortedPosts.length} posts managed via client paginationnationnation)`);

const people = members
    .map(renderMember)
    .join('\n<hr>\n');

const membersPage =
    pageStart('members') +
    header('members') +
    `
  <div class="strip">

    <div class="members-intro">
      <h2>about & why</h2>

      <p>
	    all of the above is a multimedia art collective with no bounary on medium. photography, drawings, songs, audio, video, visual fx, experiments, the abstract and the pristine porcelain. all of it has a home here.
      </p>
    </div>

    <hr>

    ${people}
  </div>
  ` +
    pageEnd();

fs.writeFileSync('members.html', membersPage);

console.log(`built members.html (${members.length} members)`);
