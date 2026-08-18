/**
 * OmniCode Obsidian-Style Neural Universe Cluster & Architecture Visualizer
 * Force-Directed Physics, Orbital Gravitation, Luminous Particle Halos & Dynamic Clustering.
 */

class OmniGraphVisualizer {
  constructor() {
    this.canvas = document.getElementById('architecture-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.container = document.getElementById('graph-canvas-wrapper');
    this.repoSelect = document.getElementById('graph-repo-select');
    this.nodeCountEl = document.getElementById('graph-node-count');
    this.edgeCountEl = document.getElementById('graph-edge-count');
    this.btnReset = document.getElementById('btn-reset-graph-view');
    this.clusterModeSelect = document.getElementById('cluster-mode-select');
    this.inputClusterSearch = document.getElementById('cluster-search-input');
    this.physicsSpeedRange = document.getElementById('physics-speed-range');

    this.nodes = [];
    this.links = [];
    this.stars = [];
    this.animFrameId = null;
    this.draggingNode = null;
    this.hoveredNode = null;
    this.transform = { x: 0, y: 0, scale: 1 };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.physicsSpeed = 1.0;
    this.isSimulationSettled = false;
    this.settledFrameCount = 0;
    this.filterQuery = '';
    this.currentMode = 'universe'; // 'universe' | 'repository'

    this.langColors = {
      Rust: '#dea584',
      Go: '#00ADD8',
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      'C++': '#f34b7d',
      C: '#64748b',
      Zig: '#ec915c',
      Solidity: '#AA6746',
      Elixir: '#a855f7',
      TOML: '#9c4221',
      Other: '#8b949e'
    };

    if (this.canvas) {
      this.initStarfield();
      this.bindEvents();
      this.resize();
      this.loadUniverseCluster();
    }
  }

  initStarfield() {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 2000,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        speed: Math.random() * 0.02 + 0.005
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    if (this.clusterModeSelect) {
      this.clusterModeSelect.addEventListener('change', (e) => {
        this.currentMode = e.target.value;
        if (this.currentMode === 'universe') {
          this.loadUniverseCluster();
        } else {
          const repoId = this.repoSelect ? this.repoSelect.value : null;
          if (repoId && window.app) window.app.loadGraphForRepo(repoId);
        }
      });
    }

    if (this.inputClusterSearch) {
      this.inputClusterSearch.addEventListener('input', (e) => {
        this.filterQuery = e.target.value.trim().toLowerCase();
      });
    }

    if (this.repoSelect) {
      this.repoSelect.addEventListener('change', (e) => {
        if (this.clusterModeSelect) this.clusterModeSelect.value = 'repository';
        this.currentMode = 'repository';
        if (window.app && e.target.value) {
          window.app.loadGraphForRepo(e.target.value);
        }
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.centerGraph();
      });
    }

    if (this.canvas) {
      // Touch & Mouse Drag / Pan / Click
      this.canvas.addEventListener('mousedown', (e) => {
        const pos = this.getCanvasPos(e);
        const clickedNode = this.getNodeAt(pos.x, pos.y);
        if (clickedNode) {
          this.draggingNode = clickedNode;
          this.isSimulationSettled = false;
          this.settledFrameCount = 0;
        } else {
          this.isPanning = true;
          this.isSimulationSettled = false;
          this.settledFrameCount = 0;
          this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
        }
      });

      this.canvas.addEventListener('click', (e) => {
        const pos = this.getCanvasPos(e);
        const clickedNode = this.getNodeAt(pos.x, pos.y);
        if (clickedNode && clickedNode.type === 'repository' && window.app) {
          window.app.openRepoInStudio(clickedNode.id);
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (this.draggingNode) {
          const pos = this.getCanvasPos(e);
          this.draggingNode.x = pos.x;
          this.draggingNode.y = pos.y;
          this.draggingNode.vx = 0;
          this.draggingNode.vy = 0;
        } else if (this.isPanning) {
          this.transform.x = e.clientX - this.panStart.x;
          this.transform.y = e.clientY - this.panStart.y;
        } else {
          const pos = this.getCanvasPos(e);
          const node = this.getNodeAt(pos.x, pos.y);
          this.hoveredNode = node;
          this.canvas.style.cursor = node ? 'pointer' : 'default';
        }
      });

      window.addEventListener('mouseup', () => {
        this.draggingNode = null;
        this.isPanning = false;
      });

      // Zoom wheel
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        this.transform.scale = Math.max(0.15, Math.min(4.0, this.transform.scale * zoomFactor));
      }, { passive: false });

      // Mobile Touch Handling
      let touchStartDist = 0;
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          const pos = this.getCanvasPos(t);
          const clickedNode = this.getNodeAt(pos.x, pos.y);
          if (clickedNode) {
            this.draggingNode = clickedNode;
            this.isSimulationSettled = false;
            this.settledFrameCount = 0;
          } else {
            this.isPanning = true;
            this.isSimulationSettled = false;
            this.settledFrameCount = 0;
            this.panStart = { x: t.clientX - this.transform.x, y: t.clientY - this.transform.y };
          }
        } else if (e.touches.length === 2) {
          touchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          if (this.draggingNode) {
            const pos = this.getCanvasPos(t);
            this.draggingNode.x = pos.x;
            this.draggingNode.y = pos.y;
          } else if (this.isPanning) {
            this.transform.x = t.clientX - this.panStart.x;
            this.transform.y = t.clientY - this.panStart.y;
          }
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (touchStartDist > 0) {
            const factor = dist / touchStartDist;
            this.transform.scale = Math.max(0.2, Math.min(3.5, this.transform.scale * factor));
            touchStartDist = dist;
          }
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', () => {
        this.draggingNode = null;
        this.isPanning = false;
        touchStartDist = 0;
      });
    }
  }

  resize() {
    if (!this.canvas || !this.container) return;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  async loadUniverseCluster() {
    try {
      const res = await fetch('/api/repos/cluster/universe?limit=250');
      const data = await res.json();
      this.setGraphData(data);
    } catch (e) {
      console.warn('Universe cluster fetch error:', e);
    }
  }

  setGraphData(graphData) {
    if (!graphData) return;

    const width = this.canvas ? this.canvas.width : 900;
    const height = this.canvas ? this.canvas.height : 600;

    // Cluster language angle maps
    const langAngles = {
      Rust: 0,
      Go: Math.PI * 0.25,
      TypeScript: Math.PI * 0.5,
      JavaScript: Math.PI * 0.75,
      Python: Math.PI * 1.0,
      'C++': Math.PI * 1.25,
      C: Math.PI * 1.5,
      Zig: Math.PI * 1.75
    };

    this.nodes = (graphData.nodes || []).map((node) => {
      const isHub = node.type === 'galaxy_hub' || node.type === 'hub';
      const angle = langAngles[node.language] !== undefined ? langAngles[node.language] : Math.random() * Math.PI * 2;
      const orbitalRadius = isHub ? 220 : 360 + (Math.random() - 0.5) * 200;

      return {
        ...node,
        x: width / 2 + Math.cos(angle) * orbitalRadius + (Math.random() - 0.5) * 80,
        y: height / 2 + Math.sin(angle) * orbitalRadius + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
        radius: isHub ? 22 : node.stars > 50000 ? 12 : node.stars > 10000 ? 8 : 5,
        pulse: Math.random() * Math.PI * 2
      };
    });

    this.links = graphData.edges || graphData.links || [];

    if (this.nodeCountEl) this.nodeCountEl.textContent = `Nodes: ${this.nodes.length}`;
    if (this.edgeCountEl) this.edgeCountEl.textContent = `Edges: ${this.links.length}`;

    this.centerGraph();
    this.startSimulation();
  }

  centerGraph() {
    if (!this.canvas) return;
    this.transform.x = 0;
    this.transform.y = 0;
    this.transform.scale = this.canvas.width < 600 ? 0.45 : 0.75;
  }

  startSimulation() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const step = () => {
      if (!this.isSimulationSettled || this.draggingNode || this.isPanning) {
        this.updatePhysics();
      }
      this.render();
      this.animFrameId = requestAnimationFrame(step);
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  stopSimulation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  updatePhysics() {
    const kRepel = 900;
    const kSpring = 0.025;
    const linkDist = 75;
    const damping = 0.86;

    // Node-Node Repulsion (Spatial Grid Optimized)
    const cellSize = 320;
    const grid = new Map();
    for (const node of this.nodes) {
      node.pulse += 0.03;
      const cx = Math.floor(node.x / cellSize);
      const cy = Math.floor(node.y / cellSize);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(node);
    }

    for (const [key, cell] of grid) {
      const [cx, cy] = key.split(',').map(Number);
      const neighbors = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nk = `${cx + dx},${cy + dy}`;
          if (grid.has(nk)) neighbors.push(...grid.get(nk));
        }
      }

      for (const n1 of cell) {
        for (const n2 of neighbors) {
          if (n1 === n2 || n1.id > n2.id) continue;
          const ddx = n2.x - n1.x;
          const ddy = n2.y - n1.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          if (dist < cellSize) {
            const force = kRepel / (dist * dist);
            const fx = (ddx / dist) * force;
            const fy = (ddy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }
    }

    // Link Spring Attraction
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    for (const link of this.links) {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - linkDist;

      const strength = link.strength || 1.0;
      const fx = (dx / dist) * delta * kSpring * strength;
      const fy = (dy / dist) * delta * kSpring * strength;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Center Gravity and Velocity Integration
    const cx = (this.canvas ? this.canvas.width : 900) / 2;
    const cy = (this.canvas ? this.canvas.height : 600) / 2;

    for (const node of this.nodes) {
      if (node === this.draggingNode) continue;

      node.vx += (cx - node.x) * 0.0008;
      node.vy += (cy - node.y) * 0.0008;

      node.vx *= damping;
      node.vy *= damping;

      node.x += node.vx;
      node.y += node.vy;
    }

    // Check if simulation has settled
    let totalKineticEnergy = 0;
    for (const node of this.nodes) {
      totalKineticEnergy += node.vx * node.vx + node.vy * node.vy;
    }
    if (totalKineticEnergy < 0.05 && !this.draggingNode) {
      this.settledFrameCount++;
      if (this.settledFrameCount > 120) {
        this.isSimulationSettled = true;
      }
    } else {
      this.settledFrameCount = 0;
      this.isSimulationSettled = false;
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Obsidian Dark Void Background
    this.ctx.fillStyle = 'hsl(220, 20%, 4%)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.transform.x + w / 2, this.transform.y + h / 2);
    this.ctx.scale(this.transform.scale, this.transform.scale);
    this.ctx.translate(-w / 2, -h / 2);

    // Draw Subtle Starfield Dust
    for (const star of this.stars) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(w / 2 + star.x, h / 2 + star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    // Draw Obsidian Dynamic Energy Links
    for (const link of this.links) {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) continue;

      const isConnectedToHover = this.hoveredNode && (this.hoveredNode === source || this.hoveredNode === target);

      this.ctx.beginPath();
      this.ctx.moveTo(source.x, source.y);
      this.ctx.lineTo(target.x, target.y);

      if (isConnectedToHover) {
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        this.ctx.lineWidth = 2.0;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        this.ctx.lineWidth = 0.8;
      }
      this.ctx.stroke();
    }

    // Draw Obsidian Glowing Nodes
    for (const node of this.nodes) {
      const color = this.langColors[node.language] || this.langColors.Other;
      const isHovered = node === this.hoveredNode;
      const isHub = node.type === 'galaxy_hub' || node.type === 'hub';
      const matchesSearch = !this.filterQuery || (node.label && node.label.toLowerCase().includes(this.filterQuery)) || (node.language && node.language.toLowerCase().includes(this.filterQuery));

      const effectiveRadius = isHovered ? node.radius * 1.3 : node.radius;

      // Glow Halo Gradient
      const gradient = this.ctx.createRadialGradient(
        node.x, node.y, effectiveRadius * 0.2,
        node.x, node.y, effectiveRadius * (isHub ? 2.5 : 2.0)
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, effectiveRadius * (isHub ? 2.5 : 2.0), 0, Math.PI * 2);
      this.ctx.fill();

      // Solid Node Core
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, effectiveRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = isHovered ? '#ffffff' : matchesSearch ? color : 'rgba(100, 116, 139, 0.4)';
      this.ctx.fill();

      this.ctx.strokeStyle = isHovered ? '#ffffff' : 'hsl(220, 20%, 4%)';
      this.ctx.lineWidth = isHub ? 2.5 : 1.5;
      this.ctx.stroke();

      // Node Label (Faded based on zoom)
      if (isHub || isHovered || this.transform.scale > 0.8 || matchesSearch) {
        this.ctx.font = isHub ? '600 11px Inter, sans-serif' : '500 9.5px Inter, sans-serif';
        this.ctx.fillStyle = isHovered ? '#ffffff' : isHub ? color : 'hsl(220, 12%, 75%)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.label || node.id, node.x, node.y + effectiveRadius + 12);
      }
    }

    this.ctx.restore();
  }

  getCanvasPos(e) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const w = this.canvas.width;
    const h = this.canvas.height;

    return {
      x: (rawX - (this.transform.x + w / 2)) / this.transform.scale + w / 2,
      y: (rawY - (this.transform.y + h / 2)) / this.transform.scale + h / 2
    };
  }

  getNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
        return node;
      }
    }
    return null;
  }
}
