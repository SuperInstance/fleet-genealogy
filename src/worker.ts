export interface Env {
  FLEET_GENEALOGY: KVNamespace;
}

interface Vessel {
  id: string;
  name: string;
  parentIds: string[];
  childIds: string[];
  mergeSourceIds?: string[];
  timestamp: number;
  generation: number;
  traits: Record<string, any>;
}

interface LineageNode {
  vessel: Vessel;
  children: LineageNode[];
}

interface DistanceResult {
  vesselA: string;
  vesselB: string;
  geneticDistance: number;
  commonAncestor?: string;
  generationsApart: number;
}

const HTML_HEADER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fleet Genealogy</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';">
  <style>
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 400;
      src: url('https://rsms.me/inter/font-files/Inter-Regular.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 600;
      src: url('https://rsms.me/inter/font-files/Inter-SemiBold.woff2') format('woff2');
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0f;
      color: #e5e7eb;
      line-height: 1.6;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      border-bottom: 2px solid #1f2937;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    h1 {
      color: #f59e0b;
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 1.1rem;
    }
    .endpoint {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .endpoint h3 {
      color: #f59e0b;
      margin-bottom: 8px;
    }
    .endpoint code {
      background: #1f2937;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      color: #60a5fa;
    }
    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #374151;
      text-align: center;
      color: #6b7280;
      font-size: 0.9rem;
    }
    .fleet-badge {
      display: inline-block;
      background: #1f2937;
      color: #f59e0b;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Fleet Genealogy</h1>
      <p class="subtitle">Track vessel lineage — forks, merges, and evolution history</p>
    </header>
    <main>`;

const HTML_FOOTER = `    </main>
    <footer>
      <p>Fleet Genealogy System • Tracking vessel evolution across generations</p>
      <div class="fleet-badge">FLEET ACTIVE</div>
    </footer>
  </div>
</body>
</html>`;

const ENDPOINTS_HTML = `
      <section>
        <h2>API Endpoints</h2>
        <div class="endpoint">
          <h3>GET /api/tree/:vessel</h3>
          <p>Retrieve fork tree for a specific vessel</p>
          <code>/api/tree/enterprise-nx01</code>
        </div>
        <div class="endpoint">
          <h3>GET /api/lineage</h3>
          <p>Get complete lineage with evolution timelines</p>
          <code>/api/lineage?vessel=voyager-a&amp;depth=5</code>
        </div>
        <div class="endpoint">
          <h3>GET /api/distance</h3>
          <p>Calculate genetic distance between vessels</p>
          <code>/api/distance?a=odyssey&amp;b=discovery</code>
        </div>
        <div class="endpoint">
          <h3>GET /health</h3>
          <p>Health check endpoint</p>
          <code>/health</code>
        </div>
      </section>
      <section style="margin-top: 40px;">
        <h2>Features</h2>
        <ul style="list-style: none; columns: 2; gap: 30px;">
          <li style="margin-bottom: 10px;">✓ Fork trees visualization</li>
          <li style="margin-bottom: 10px;">✓ Merge history tracking</li>
          <li style="margin-bottom: 10px;">✓ Evolution timelines</li>
          <li style="margin-bottom: 10px;">✓ Lineage comparison</li>
          <li style="margin-bottom: 10px;">✓ Genetic distance metrics</li>
          <li style="margin-bottom: 10px;">✓ Ancestor tracing</li>
        </ul>
      </section>`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    });

    // Health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // API endpoints
    if (path.startsWith('/api/')) {
      headers.set('Content-Type', 'application/json');
      
      if (path.startsWith('/api/tree/')) {
        const vesselId = path.split('/api/tree/')[1];
        return this.handleTreeRequest(vesselId, env);
      }
      
      if (path === '/api/lineage') {
        const vesselId = url.searchParams.get('vessel');
        const depth = parseInt(url.searchParams.get('depth') || '3');
        return this.handleLineageRequest(vesselId, depth, env);
      }
      
      if (path === '/api/distance') {
        const vesselA = url.searchParams.get('a');
        const vesselB = url.searchParams.get('b');
        return this.handleDistanceRequest(vesselA, vesselB, env);
      }
      
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), { 
        status: 404, 
        headers 
      });
    }

    // Root path - serve documentation
    if (path === '/' || path === '') {
      return new Response(HTML_HEADER + ENDPOINTS_HTML + HTML_FOOTER, { headers });
    }

    return new Response(HTML_HEADER + `<h2>404 - Navigation Point Not Found</h2>` + HTML_FOOTER, { 
      status: 404, 
      headers 
    });
  },

  async handleTreeRequest(vesselId: string, env: Env): Promise<Response> {
    try {
      const vessel = await this.getVessel(vesselId, env);
      if (!vessel) {
        return new Response(JSON.stringify({ error: 'Vessel not found' }), { status: 404 });
      }

      const tree = await this.buildForkTree(vesselId, env);
      return new Response(JSON.stringify(tree), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  },

  async handleLineageRequest(vesselId: string | null, depth: number, env: Env): Promise<Response> {
    try {
      if (!vesselId) {
        // Return all root vessels if no specific vessel requested
        const roots = await this.getRootVessels(env);
        return new Response(JSON.stringify({ roots }), { 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      const lineage = await this.buildLineage(vesselId, depth, env);
      if (!lineage) {
        return new Response(JSON.stringify({ error: 'Vessel not found' }), { status: 404 });
      }

      return new Response(JSON.stringify(lineage), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  },

  async handleDistanceRequest(vesselA: string | null, vesselB: string | null, env: Env): Promise<Response> {
    try {
      if (!vesselA || !vesselB) {
        return new Response(JSON.stringify({ error: 'Missing vessel parameters' }), { status: 400 });
      }

      const distance = await this.calculateGeneticDistance(vesselA, vesselB, env);
      return new Response(JSON.stringify(distance), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  },

  async getVessel(id: string, env: Env): Promise<Vessel | null> {
    const data = await env.FLEET_GENEALOGY.get(id);
    return data ? JSON.parse(data) : null;
  },

  async saveVessel(vessel: Vessel, env: Env): Promise<void> {
    await env.FLEET_GENEALOGY.put(vessel.id, JSON.stringify(vessel));
  },

  async buildForkTree(vesselId: string, env: Env, visited: Set<string> = new Set()): Promise<any> {
    if (visited.has(vesselId)) return null;
    visited.add(vesselId);

    const vessel = await this.getVessel(vesselId, env);
    if (!vessel) return null;

    const children = await Promise.all(
      vessel.childIds.map(childId => this.buildForkTree(childId, env, visited))
    );

    return {
      id: vessel.id,
      name: vessel.name,
      generation: vessel.generation,
      timestamp: vessel.timestamp,
      traits: vessel.traits,
      children: children.filter(Boolean),
      isMerge: !!vessel.mergeSourceIds?.length,
      mergeSources: vessel.mergeSourceIds || []
    };
  },

  async buildLineage(vesselId: string, depth: number, env: Env): Promise<LineageNode | null> {
    const vessel = await this.getVessel(vesselId, env);
    if (!vessel) return null;

    const buildTree = async (currentVessel: Vessel, currentDepth: number): Promise<LineageNode> => {
      if (currentDepth <= 0) {
        return { vessel: currentVessel, children: [] };
      }

      const children = await Promise.all(
        currentVessel.childIds.map(async childId => {
          const child = await this.getVessel(childId, env);
          return child ? await buildTree(child, currentDepth - 1) : null;
        })
      );

      return {
        vessel: currentVessel,
        children: children.filter((child): child is LineageNode => child !== null)
      };
    };

    return buildTree(vessel, depth);
  },

  async calculateGeneticDistance(vesselAId: string, vesselBId: string, env: Env): Promise<DistanceResult> {
    const vesselA = await this.getVessel(vesselAId, env);
    const vesselB = await this.getVessel(vesselBId, env);

    if (!vesselA || !vesselB) {
      throw new Error('One or both vessels not found');
    }

    // Get ancestors for both vessels
    const ancestorsA = await this.getAncestors(vesselAId, env);
    const ancestorsB = await this.getAncestors(vesselBId, env);

    // Find common ancestors
    const commonAncestors = ancestorsA.filter(a => 
      ancestorsB.some(b => b.id === a.id)
    );

    const commonAncestor = commonAncestors.length > 0 ? commonAncestors[0].id : undefined;
    
    // Calculate genetic distance based on trait differences and generational distance
    let geneticDistance = 0;
    
    if (commonAncestor) {
      // Calculate distance through common ancestor
      const distToCommonA = ancestorsA.findIndex(a => a.id === commonAncestor);
      const distToCommonB = ancestorsB.findIndex(b => b.id === commonAncestor);
      geneticDistance = distToCommonA + distToCommonB;
    } else {
      // No common ancestor - maximum distance
      geneticDistance = vesselA.generation + vesselB.generation;
    }

    // Add trait difference penalty
    const traitDiff = this.calculateTraitDifference(vesselA.traits, vesselB.traits);
    geneticDistance += traitDiff * 0.5;

    return {
      vesselA: vesselAId,
      vesselB: vesselBId,
      geneticDistance: Math.round(geneticDistance * 100) / 100,
      commonAncestor,
      generationsApart: Math.abs(vesselA.generation - vesselB.generation)
    };
  },

  async getAncestors(vesselId: string, env: Env): Promise<Vessel[]> {
    const ancestors: Vessel[] = [];
    let currentId = vesselId;
    
    while (currentId) {
      const vessel = await this.getVessel(currentId, env);
      if (!vessel) break;
      
      ancestors.push(vessel);
      
      // Follow first parent (simplified - could follow all parents for merge cases)
      currentId = vessel.parentIds.length > 0 ? vessel.parentIds[0] : '';
    }
    
    return ancestors;
  },

  async getRootVessels(env: Env): Promise<Vessel[]> {
    // This would typically query a KV index of root vessels
    // For simplicity, returning empty array - implementation would depend on data structure
    return [];
  },

  calculateTraitDifference(traitsA: Record<string, any>, traitsB: Record<string, any>): number {
    const allKeys = new Set([...Object.keys(traitsA), ...Object.keys(traitsB)]);
    let differences = 0;
    
    for (const key of allKeys) {
      const valA = traitsA[key];
      const valB = traitsB[key];
      
      if (valA !== valB) {
        differences++;
      }
    }
    
    return differences;
  }
};