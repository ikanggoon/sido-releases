// SIDO Website — GitHub Releases API로 최신 버전 자동 조회
(function () {
  const REPO = 'ikanggoon/sido-releases';
  const API  = `https://api.github.com/repos/${REPO}/releases`;

  function formatSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // 마크다운 간단 변환 (### 헤더, - 리스트, **볼드**)
  function mdToHtml(md) {
    if (!md) return '';
    return md
      .split('\n')
      .filter(l => !l.startsWith('##') || l.startsWith('###'))
      .map(l => {
        // ### 헤더
        if (l.startsWith('### ')) return `<strong>${l.slice(4)}</strong>`;
        // - 리스트 아이템
        if (/^\s*-\s/.test(l)) return `<li>${l.replace(/^\s*-\s/, '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`;
        // 일반 텍스트
        return l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      })
      .join('\n')
      // ul 래핑
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  async function loadLatest() {
    try {
      const res = await fetch(`${API}/latest`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const version = data.tag_name || '';
      const setupAsset    = data.assets.find(a => /SIDO-Setup.*\.exe$/i.test(a.name) && !a.name.includes('blockmap'));
      const portableAsset = data.assets.find(a => /portable.*\.exe$/i.test(a.name));

      // Hero
      const heroBtn = document.getElementById('hero-download');
      const heroVer = document.getElementById('hero-version');
      if (setupAsset) heroBtn.href = setupAsset.browser_download_url;
      heroVer.textContent = version;

      // Download section
      const dlSetup    = document.getElementById('dl-setup');
      const dlPortable = document.getElementById('dl-portable');
      const dlSetupSize    = document.getElementById('dl-setup-size');
      const dlPortableSize = document.getElementById('dl-portable-size');

      if (setupAsset) {
        dlSetup.href = setupAsset.browser_download_url;
        dlSetupSize.textContent = formatSize(setupAsset.size);
      }
      if (portableAsset) {
        dlPortable.href = portableAsset.browser_download_url;
        dlPortableSize.textContent = formatSize(portableAsset.size);
      }
    } catch (e) {
      console.warn('Failed to load latest release:', e);
    }
  }

  async function loadChangelog() {
    const container = document.getElementById('changelog-list');
    try {
      const res = await fetch(`${API}?per_page=5`);
      if (!res.ok) throw new Error('API error');
      const releases = await res.json();

      container.innerHTML = releases.map((r, i) => `
        <div class="changelog-item">
          <div class="changelog-header">
            <span class="changelog-tag">${r.tag_name}</span>
            <span class="changelog-date">${formatDate(r.published_at || r.created_at)}</span>
            ${i === 0 ? '<span class="changelog-badge">Latest</span>' : ''}
          </div>
          <div class="changelog-body">${mdToHtml(r.body)}</div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<p class="loading">릴리즈 정보를 불러오지 못했습니다.</p>';
    }
  }

  // 네비게이션 스크롤 시 배경 강화
  window.addEventListener('scroll', () => {
    document.querySelector('.nav').style.background =
      window.scrollY > 10 ? 'rgba(248,249,252,0.95)' : 'rgba(248,249,252,0.85)';
  });

  loadLatest();
  loadChangelog();
})();
