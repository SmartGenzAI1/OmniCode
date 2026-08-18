/**
 * OmniCode Sovereign Crawler Mission Control & Real-time Telemetry
 */

class OmniCrawlerConsole {
  constructor() {
    this.dom = {
      statusEl: document.getElementById('telemetry-crawler-status'),
      totalReposEl: document.getElementById('telemetry-total-repos'),
      totalFilesEl: document.getElementById('telemetry-total-files'),
      totalSlocEl: document.getElementById('telemetry-total-sloc'),
      logFeed: document.getElementById('crawler-log-feed'),
      btnClearLogs: document.getElementById('btn-clear-logs'),
      
      // Ingest forms
      inputGitUrl: document.getElementById('input-git-url'),
      btnEnqueueGit: document.getElementById('btn-enqueue-git'),
      
      inputForgeRepo: document.getElementById('input-forge-repo'),
      selectForgeProvider: document.getElementById('select-forge-provider'),
      btnEnqueueForge: document.getElementById('btn-enqueue-forge'),
      
      inputLocalPath: document.getElementById('input-local-path'),
      btnEnqueueLocal: document.getElementById('btn-enqueue-local')
    };

    this.eventSource = null;
    this.bindEvents();
    this.initSSE();
  }

  bindEvents() {
    if (this.dom.btnClearLogs && this.dom.logFeed) {
      this.dom.btnClearLogs.addEventListener('click', () => {
        this.dom.logFeed.innerHTML = '';
      });
    }

    // Ingest Git Remote
    if (this.dom.btnEnqueueGit && this.dom.inputGitUrl) {
      this.dom.btnEnqueueGit.addEventListener('click', () => {
        const url = this.dom.inputGitUrl.value.trim();
        if (!url) return;
        this.enqueueTask({ url, type: 'git_url' });
        this.dom.inputGitUrl.value = '';
      });
    }

    // Ingest Forge Scrape
    if (this.dom.btnEnqueueForge && this.dom.inputForgeRepo) {
      this.dom.btnEnqueueForge.addEventListener('click', () => {
        const repo = this.dom.inputForgeRepo.value.trim();
        const forge = this.dom.selectForgeProvider ? this.dom.selectForgeProvider.value : 'github';
        if (!repo) return;
        this.enqueueTask({ url: repo, type: 'forge_scrape', options: { forge } });
        this.dom.inputForgeRepo.value = '';
      });
    }

    // Ingest Local Folder
    if (this.dom.btnEnqueueLocal && this.dom.inputLocalPath) {
      this.dom.btnEnqueueLocal.addEventListener('click', () => {
        const localPath = this.dom.inputLocalPath.value.trim();
        if (!localPath) return;
        this.enqueueTask({ url: localPath, type: 'local_dir' });
        this.dom.inputLocalPath.value = '';
      });
    }
  }

  async enqueueTask(taskData) {
    try {
      if (window.app) window.app.showToast(`Indexing task dispatched for: ${taskData.url}`, 'info');

      const res = await fetch('/api/crawler/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      const data = await res.json();
      if (!data.success) {
        if (window.app) window.app.showToast(data.message || 'Task failed', 'error');
      }
    } catch (e) {
      console.error('Enqueue error:', e);
      if (window.app) window.app.showToast(`Error dispatching task: ${e.message}`, 'error');
    }
  }

  initSSE() {
    try {
      this.eventSource = new EventSource('/api/crawler/stream');

      this.eventSource.addEventListener('crawler-log', (e) => {
        const entry = JSON.parse(e.data);
        this.appendLog(entry);
      });

      this.eventSource.addEventListener('repo-indexed', (e) => {
        const repo = JSON.parse(e.data);
        if (window.app) {
          window.app.onRepositoryIndexed(repo);
        }
      });

      this.eventSource.addEventListener('batch-indexed', (e) => {
        const batchInfo = JSON.parse(e.data);
        if (window.app && batchInfo.items) {
          batchInfo.items.forEach(repo => window.app.onRepositoryIndexed(repo));
        }
      });

      this.eventSource.addEventListener('stats-updated', (e) => {
        const stats = JSON.parse(e.data);
        this.updateTelemetry(stats);
      });

      this.eventSource.onerror = () => {
        // SSE will automatically reconnect
      };
    } catch (e) {
      console.warn('SSE connection failed:', e);
    }
  }

  appendLog(entry) {
    if (!this.dom.logFeed) return;

    const row = document.createElement('div');
    row.style.fontSize = '11px';
    row.style.lineHeight = '1.4';
    row.style.color = entry.level === 'error' ? 'var(--accent-ruby)' : entry.level === 'success' ? 'var(--accent-emerald)' : 'var(--text-secondary)';

    const time = new Date(entry.timestamp).toLocaleTimeString();
    row.innerHTML = `<span style="color: var(--text-faint); margin-right: 6px;">[${time}]</span> ${entry.message}`;

    this.dom.logFeed.prepend(row);

    // Limit log rows to 100
    while (this.dom.logFeed.children.length > 100) {
      this.dom.logFeed.removeChild(this.dom.logFeed.lastChild);
    }
  }

  updateTelemetry(stats) {
    if (this.dom.statusEl && stats.harvestRate) {
      this.dom.statusEl.textContent = stats.harvestRate.toUpperCase();
    }
    if (this.dom.totalReposEl && stats.totalIndexed !== undefined) {
      this.dom.totalReposEl.textContent = stats.totalIndexed.toLocaleString();
    }
    if (this.dom.totalFilesEl && stats.totalFilesParsed !== undefined) {
      this.dom.totalFilesEl.textContent = stats.totalFilesParsed.toLocaleString();
    }
    if (this.dom.totalSlocEl && stats.totalLinesScanned !== undefined) {
      this.dom.totalSlocEl.textContent = stats.totalLinesScanned.toLocaleString();
    }
  }
}
