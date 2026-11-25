(() => {
  const TOKEN_KEY = 'htj_studio_token_v1';
  const REPO_KEY = 'htj_studio_repo_v1';

  let siteData = null;
  const stagedFiles = new Map();
  const $ = id => document.getElementById(id);

  function log(msg, show = true) {
    const box = $('publishLog');
    if (!box) return;
    if (show) box.hidden = false;
    box.textContent = msg;
  }

  function updateStagedBadge() {
    $('stagedNote').textContent = `${stagedFiles.size} unsaved upload(s)`;
  }

  function getRepoConfig() {
    return {
      owner: $('repoOwner').value.trim(),
      repo: $('repoName').value.trim(),
      branch: $('repoBranch').value.trim() || 'main',
      token: $('ghToken').value.trim()
    };
  }

  async function ghApi(path, method = 'GET', body = null) {
    const { owner, repo, token } = getRepoConfig();
    if (!token) throw new Error('Please connect your access key first (click Connection Settings).');
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `GitHub error (${res.status})`);
    return data;
  }

  function uint8ToBase64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function utf8ToBase64(str) {
    return uint8ToBase64(new TextEncoder().encode(str));
  }

  async function compressImageToWebP(file, maxDim, quality) {
    const imgUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = imgUrl;
      });
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', quality));
      const buf = new Uint8Array(await blob.arrayBuffer());
      return { base64: uint8ToBase64(buf), dataUrl: canvas.toDataURL('image/webp', quality) };
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  }

  async function captureVideoPoster(file) {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.src = url;
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });
      video.currentTime = Math.min(0.5, (video.duration || 1) / 3);
      await new Promise(resolve => { video.onseeked = resolve; setTimeout(resolve, 400); });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 640 / Math.max(video.videoWidth || 640, video.videoHeight || 640));
      canvas.width = Math.round((video.videoWidth || 480) * scale);
      canvas.height = Math.round((video.videoHeight || 640) * scale);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', 0.8));
      const buf = new Uint8Array(await blob.arrayBuffer());
      return uint8ToBase64(buf);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function absorbHashToken() {
    if (!location.hash) return;
    const params = new URLSearchParams(location.hash.slice(1));
    const t = params.get('token');
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      if (params.get('owner')) $('repoOwner').value = params.get('owner');
      if (params.get('repo')) $('repoName').value = params.get('repo');
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  async function init() {
    setupTabs();
    absorbHashToken();

    const savedRepo = JSON.parse(localStorage.getItem(REPO_KEY) || '{}');
    if (savedRepo.owner) $('repoOwner').value = savedRepo.owner;
    if (savedRepo.repo) $('repoName').value = savedRepo.repo;
    if (savedRepo.branch) $('repoBranch').value = savedRepo.branch;

    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      $('ghToken').value = savedToken;
      $('connectCard').hidden = true;
    }

    $('toggleSetupBtn').onclick = () => { $('connectCard').hidden = !$('connectCard').hidden; };
    $('toggleGuideBtn').onclick = () => { $('tokenGuide').hidden = !$('tokenGuide').hidden; };
    $('forgetTokenBtn').onclick = () => {
      localStorage.removeItem(TOKEN_KEY);
      $('ghToken').value = '';
      $('connBadge').textContent = 'Setup Needed';
      $('connBadge').classList.remove('ok');
      $('connectCard').hidden = false;
    };
    $('copyMagicLinkBtn').onclick = () => {
      const cfg = getRepoConfig();
      if (!cfg.token) return alert('Paste your access key first.');
      const url = `${location.origin}${location.pathname}#token=${encodeURIComponent(cfg.token)}`;
      navigator.clipboard?.writeText(url).then(
        () => log('Copied Magic Phone Link! Send this private link to TJ once—his phone will stay connected automatically.'),
        () => prompt('Copy this private Magic Phone Link for TJ:', url)
      );
    };

    $('connectBtn').onclick = () => connectAndLoadFromGitHub(false);
    $('publishBtn').onclick = publishAllToGitHub;
    $('downloadJsonBtn').onclick = downloadJsonBackup;

    try {
      const res = await fetch('../data/site.json', { cache: 'no-cache' });
      siteData = await res.json();
      renderAllEditors();
    } catch {
      log('Opened offline. Connect to GitHub or open via your live website /admin/ URL to publish changes.');
    }

    if (savedToken) connectAndLoadFromGitHub(true);
    setupUploadHandlers();
  }

  async function connectAndLoadFromGitHub(silent = false) {
    try {
      const cfg = getRepoConfig();
      localStorage.setItem(REPO_KEY, JSON.stringify({ owner: cfg.owner, repo: cfg.repo, branch: cfg.branch }));
      if (cfg.token) localStorage.setItem(TOKEN_KEY, cfg.token);

      if (!silent) log('Connecting...');
      const repoInfo = await ghApi('');
      const fileRes = await ghApi(`/contents/data/site.json?ref=${encodeURIComponent(cfg.branch)}`);
      const decoded = new TextDecoder().decode(Uint8Array.from(atob(fileRes.content.replace(/\n/g, '')), c => c.charCodeAt(0)));
      siteData = JSON.parse(decoded);
      renderAllEditors();

      $('connBadge').textContent = 'Ready to Edit';
      $('connBadge').classList.add('ok');
      $('connectCard').hidden = true;
      if (!silent) log(`Connected to ${repoInfo.full_name}. Ready to edit and publish!`);
    } catch (err) {
      $('connBadge').textContent = 'Connection Error';
      $('connBadge').classList.remove('ok');
      $('connectCard').hidden = false;
      if (!silent) log(`Connection error: ${err.message}`);
    }
  }

  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; });
        btn.classList.add('active');
        document.querySelector(`[data-panel="${btn.dataset.tab}"]`).hidden = false;
      });
    });
  }

  function setupUploadHandlers() {
    const drop = $('photoDropzone');
    const input = $('photoFileInput');
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', e => {
      e.preventDefault();
      drop.classList.remove('drag');
      if (e.dataTransfer.files?.length) handleNewPhotos(e.dataTransfer.files);
    });
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      input.value = '';
      if (files.length) await handleNewPhotos(files);
    });

    $('addBaBtn').onclick = handleAddBeforeAfter;
    $('addVidBtn').onclick = handleAddVideo;
    $('addServiceBtn').onclick = () => {
      siteData.services.push({
        id: `svc-${Date.now()}`,
        title: 'New Handyman Service',
        category: 'General Repairs',
        popular: false,
        badge: '',
        image: 'assets/projects/thumb/proj-50.webp',
        description: 'Describe what is included.',
        priceNote: 'Free Quote'
      });
      renderServicesEditor();
    };
    $('addReviewBtn').onclick = () => {
      siteData.testimonials.unshift({ name: 'New Client', location: 'Brooklyn, NY', rating: 5, text: 'Great work!' });
      renderContentForms();
    };
    $('addFaqBtn').onclick = () => {
      siteData.faqs.push({ q: 'New Question?', a: 'Answer here.' });
      renderContentForms();
    };
  }

  async function handleNewPhotos(fileList) {
    if (!siteData) return;
    const files = Array.from(fileList);
    if (!files.length) return;
    const cat = $('uploadCat').value;
    const loc = $('uploadLoc').value.trim() || 'NYC';
    log(`Optimizing ${files.length} photo(s) for fast loading...`);

    for (const file of files) {
      const slug = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const thumbPath = `assets/projects/thumb/${slug}.webp`;
      const fullPath = `assets/projects/full/${slug}.webp`;
      const thumb = await compressImageToWebP(file, 640, 0.80);
      const full = await compressImageToWebP(file, 1400, 0.84);

      stagedFiles.set(thumbPath, { base64: thumb.base64, previewUrl: thumb.dataUrl });
      stagedFiles.set(fullPath, { base64: full.base64, previewUrl: full.dataUrl });

      const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      siteData.projects.unshift({
        id: slug,
        title: cleanName.slice(0, 60) || `${cat} Project`,
        category: cat,
        location: loc,
        thumb: thumbPath,
        full: fullPath
      });
    }

    updateStagedBadge();
    renderPhotosEditor();
    log(`Added ${files.length} photo(s)! Tap "Save & Publish Live" at the top when ready.`);
  }

  async function handleAddBeforeAfter() {
    const beforeFile = $('baBeforeFile').files[0];
    const afterFile = $('baAfterFile').files[0];
    if (!beforeFile || !afterFile) return alert('Please pick both a Before photo and an After photo.');

    const id = `ba-${Date.now()}`;
    const bPath = `assets/projects/full/${id}-before.webp`;
    const aPath = `assets/projects/full/${id}-after.webp`;
    const bImg = await compressImageToWebP(beforeFile, 1400, 0.84);
    const aImg = await compressImageToWebP(afterFile, 1400, 0.84);

    stagedFiles.set(bPath, { base64: bImg.base64, previewUrl: bImg.dataUrl });
    stagedFiles.set(aPath, { base64: aImg.base64, previewUrl: aImg.dataUrl });

    siteData.beforeAfter.unshift({
      id,
      title: $('baNewTitle').value.trim() || 'NYC Transformation',
      category: $('baNewCat').value,
      location: $('baNewLoc').value.trim() || 'Brooklyn, NY',
      beforeImage: bPath,
      afterImage: aPath,
      caption: $('baNewCaption').value.trim() || 'Completed by Handyman TJ.'
    });
    updateStagedBadge();
    renderBeforeAfterEditor();
    log('Added Before & After slider! Tap "Save & Publish Live" to update the website.');
  }

  async function handleAddVideo() {
    const file = $('vidNewFile').files[0];
    const title = $('vidNewTitle').value.trim() || 'Handyman TJ Reel';
    if (!file) return alert('Please pick an MP4 or WebM video file.');
    if (file.size > 20 * 1024 * 1024) return alert('Keep videos under 20 MB so mobile customers load them fast.');

    log('Processing video and creating thumbnail...');
    const id = `vid-${Date.now()}`;
    const ext = file.name.endsWith('.webm') ? 'webm' : 'mp4';
    const vidPath = `assets/videos/${id}.${ext}`;
    const posterPath = `assets/projects/thumb/${id}-poster.webp`;

    const buf = new Uint8Array(await file.arrayBuffer());
    stagedFiles.set(vidPath, { base64: uint8ToBase64(buf) });
    stagedFiles.set(posterPath, { base64: await captureVideoPoster(file) });

    siteData.videos.unshift({ id, title, src: vidPath, poster: posterPath });
    updateStagedBadge();
    renderVideosEditor();
    log(`Added video "${title}"! Tap "Save & Publish Live" to publish.`);
  }

  function renderAllEditors() {
    if (!siteData) return;
    renderPhotosEditor();
    renderBeforeAfterEditor();
    renderVideosEditor();
    renderServicesEditor();
    renderContentForms();
  }

  function imgPreviewSrc(repoPath) {
    if (stagedFiles.has(repoPath) && stagedFiles.get(repoPath).previewUrl) return stagedFiles.get(repoPath).previewUrl;
    return `../${repoPath}`;
  }

  function renderPhotosEditor() {
    const grid = $('photoAdminGrid');
    $('countPhotos').textContent = siteData.projects.length;
    const cats = ['TV Mounting', 'Closets & Storage', 'Furniture Assembly', 'Drywall & Painting', 'Mounting & Smart Home', 'Carpentry & Doors', 'Caulking & Sealing'];

    grid.innerHTML = '';
    siteData.projects.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.innerHTML = `
        <img src="${imgPreviewSrc(p.thumb)}" alt="">
        <div class="photo-card-body">
          <input type="text" value="${p.title.replace(/"/g, '&quot;')}" data-field="title">
          <select data-field="category">
            ${cats.map(c => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <input type="text" value="${(p.location || '').replace(/"/g, '&quot;')}" data-field="location" placeholder="Location">
          <div class="photo-card-actions">
            <button type="button" class="btn btn-outline btn-sm" data-act="top">Show First</button>
            <button type="button" class="btn btn-danger btn-sm" data-act="del">Delete</button>
          </div>
        </div>
      `;
      card.querySelector('[data-field="title"]').oninput = e => { p.title = e.target.value; };
      card.querySelector('[data-field="category"]').onchange = e => { p.category = e.target.value; };
      card.querySelector('[data-field="location"]').oninput = e => { p.location = e.target.value; };
      card.querySelector('[data-act="top"]').onclick = () => {
        siteData.projects.splice(idx, 1);
        siteData.projects.unshift(p);
        renderPhotosEditor();
      };
      card.querySelector('[data-act="del"]').onclick = () => {
        if (!confirm(`Delete "${p.title}" from the website?`)) return;
        siteData.projects.splice(idx, 1);
        renderPhotosEditor();
      };
      grid.appendChild(card);
    });
  }

  function renderBeforeAfterEditor() {
    const list = $('baAdminList');
    $('countBA').textContent = siteData.beforeAfter.length;
    list.innerHTML = '';
    siteData.beforeAfter.forEach((ba, idx) => {
      const row = document.createElement('div');
      row.className = 'stack-item';
      row.innerHTML = `
        <div class="row-between">
          <strong>${ba.title} (${ba.location})</strong>
          <button type="button" class="btn btn-danger btn-sm">Delete</button>
        </div>
        <p class="muted" style="margin:0">${ba.caption}</p>
      `;
      row.querySelector('button').onclick = () => { siteData.beforeAfter.splice(idx, 1); renderBeforeAfterEditor(); };
      list.appendChild(row);
    });
  }

  function renderVideosEditor() {
    const list = $('vidAdminList');
    $('countVideos').textContent = siteData.videos.length;
    list.innerHTML = '';
    siteData.videos.forEach((v, idx) => {
      const row = document.createElement('div');
      row.className = 'stack-item';
      row.innerHTML = `
        <div class="row-between">
          <input type="text" value="${v.title.replace(/"/g, '&quot;')}" style="max-width:420px">
          <button type="button" class="btn btn-danger btn-sm">Delete Video</button>
        </div>
      `;
      row.querySelector('input').oninput = e => { v.title = e.target.value; };
      row.querySelector('button').onclick = () => { siteData.videos.splice(idx, 1); renderVideosEditor(); };
      list.appendChild(row);
    });
  }

  function renderServicesEditor() {
    const list = $('servicesAdminList');
    $('countServices').textContent = siteData.services.length;
    list.innerHTML = '';
    siteData.services.forEach((s, idx) => {
      const row = document.createElement('div');
      row.className = 'stack-item';
      row.innerHTML = `
        <div class="grid-2">
          <label>Service Title <input type="text" data-k="title" value="${s.title.replace(/"/g, '&quot;')}"></label>
          <label>Price Label <input type="text" data-k="priceNote" value="${(s.priceNote || '').replace(/"/g, '&quot;')}"></label>
          <label>Tag (optional) <input type="text" data-k="badge" value="${(s.badge || '').replace(/"/g, '&quot;')}" placeholder="Popular"></label>
          <label>Photo Path <input type="text" data-k="image" value="${s.image.replace(/"/g, '&quot;')}"></label>
        </div>
        <label>Description <textarea data-k="description" rows="2">${s.description}</textarea></label>
        <div><button type="button" class="btn btn-danger btn-sm">Delete Service</button></div>
      `;
      row.querySelectorAll('[data-k]').forEach(inp => { inp.oninput = () => { s[inp.dataset.k] = inp.value; }; });
      row.querySelector('button').onclick = () => { siteData.services.splice(idx, 1); renderServicesEditor(); };
      list.appendChild(row);
    });
  }

  function renderContentForms() {
    $('bPhoneDisplay').value = siteData.brand.phoneDisplay || '';
    $('bPhoneE164').value = siteData.brand.phoneE164 || '';
    $('bEmail').value = siteData.brand.email || '';
    $('bAddress').value = siteData.brand.address || '';
    $('bHours').value = siteData.brand.hoursSummary || '';
    $('bKoalendar').value = siteData.brand.koalendarUrl || '';
    $('bYears').value = siteData.brand.yearsExp || '';
    $('bProjectsDone').value = siteData.brand.projectsDone || '';
    $('hTitle').value = siteData.hero.title || '';
    $('hEyebrow').value = siteData.hero.eyebrow || '';
    $('hSubtitle').value = siteData.hero.subtitle || '';
    $('pBanner').value = siteData.promo.bannerText || '';
    $('pEnabled').value = String(siteData.promo.enabled !== false);
    $('aParagraphs').value = (siteData.about.paragraphs || []).join('\n');

    const revList = $('reviewsAdminList');
    revList.innerHTML = '';
    siteData.testimonials.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'stack-item';
      row.innerHTML = `
        <div class="grid-2">
          <label>Client Name <input type="text" data-k="name" value="${r.name.replace(/"/g, '&quot;')}"></label>
          <label>Neighborhood <input type="text" data-k="location" value="${r.location.replace(/"/g, '&quot;')}"></label>
        </div>
        <label>Review Text <textarea data-k="text" rows="2">${r.text}</textarea></label>
        <div><button type="button" class="btn btn-danger btn-sm">Delete Review</button></div>
      `;
      row.querySelectorAll('[data-k]').forEach(inp => { inp.oninput = () => { r[inp.dataset.k] = inp.value; }; });
      row.querySelector('button').onclick = () => { siteData.testimonials.splice(idx, 1); renderContentForms(); };
      revList.appendChild(row);
    });

    const faqList = $('faqAdminList');
    faqList.innerHTML = '';
    siteData.faqs.forEach((f, idx) => {
      const row = document.createElement('div');
      row.className = 'stack-item';
      row.innerHTML = `
        <label>Question <input type="text" data-k="q" value="${f.q.replace(/"/g, '&quot;')}"></label>
        <label>Answer <textarea data-k="a" rows="2">${f.a}</textarea></label>
        <div><button type="button" class="btn btn-danger btn-sm">Delete FAQ</button></div>
      `;
      row.querySelectorAll('[data-k]').forEach(inp => { inp.oninput = () => { f[inp.dataset.k] = inp.value; }; });
      row.querySelector('button').onclick = () => { siteData.faqs.splice(idx, 1); renderContentForms(); };
      faqList.appendChild(row);
    });
  }

  function syncFormsToSiteData() {
    siteData.brand.phoneDisplay = $('bPhoneDisplay').value.trim();
    siteData.brand.phoneE164 = $('bPhoneE164').value.trim();
    siteData.brand.email = $('bEmail').value.trim();
    siteData.brand.address = $('bAddress').value.trim();
    siteData.brand.hoursSummary = $('bHours').value.trim();
    siteData.brand.koalendarUrl = $('bKoalendar').value.trim();
    siteData.brand.yearsExp = $('bYears').value.trim();
    siteData.brand.projectsDone = $('bProjectsDone').value.trim();
    siteData.hero.title = $('hTitle').value.trim();
    siteData.hero.eyebrow = $('hEyebrow').value.trim();
    siteData.hero.subtitle = $('hSubtitle').value.trim();
    siteData.promo.bannerText = $('pBanner').value.trim();
    siteData.promo.enabled = $('pEnabled').value === 'true';
    siteData.about.paragraphs = $('aParagraphs').value.split('\n').map(s => s.trim()).filter(Boolean);
  }

  async function publishAllToGitHub() {
    if (!siteData) return;
    syncFormsToSiteData();
    const { branch } = getRepoConfig();
    const btn = $('publishBtn');
    btn.disabled = true;

    try {
      log('Publishing changes to your live website...');
      const refData = await ghApi(`/git/ref/heads/${encodeURIComponent(branch)}`);
      const headSha = refData.object.sha;
      const commitData = await ghApi(`/git/commits/${headSha}`);
      const baseTreeSha = commitData.tree.sha;

      const treeEntries = [];
      let i = 0;
      for (const [repoPath, item] of stagedFiles.entries()) {
        i++;
        log(`Uploading optimized file ${i}/${stagedFiles.size}...`);
        const blob = await ghApi('/git/blobs', 'POST', { content: item.base64, encoding: 'base64' });
        treeEntries.push({ path: repoPath, mode: '100644', type: 'blob', sha: blob.sha });
      }

      const jsonB64 = utf8ToBase64(JSON.stringify(siteData, null, 2) + '\n');
      const jsonBlob = await ghApi('/git/blobs', 'POST', { content: jsonB64, encoding: 'base64' });
      treeEntries.push({ path: 'data/site.json', mode: '100644', type: 'blob', sha: jsonBlob.sha });

      const treeRes = await ghApi('/git/trees', 'POST', { base_tree: baseTreeSha, tree: treeEntries });
      const newCommit = await ghApi('/git/commits', 'POST', {
        message: `Update website (${stagedFiles.size} file(s)) via Easy Editor`,
        tree: treeRes.sha,
        parents: [headSha]
      });
      await ghApi(`/git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', { sha: newCommit.sha });

      stagedFiles.clear();
      updateStagedBadge();
      log(`PUBLISHED! Your changes will be live on www.handymantj.com in ~30 seconds.`);
    } catch (err) {
      log(`Could not publish: ${err.message}`);
      $('connectCard').hidden = false;
    } finally {
      btn.disabled = false;
    }
  }

  function downloadJsonBackup() {
    if (!siteData) return;
    syncFormsToSiteData();
    const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site.json';
    a.click();
  }

  init();
})();
