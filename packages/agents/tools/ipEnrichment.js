/**
 * @fileoverview IP enrichment tool — local threat intelligence for IP analysis.
 * Provides reputation scoring, geolocation hints, and threat classification
 * without requiring external API calls.
 */

/**
 * Known malicious/suspicious IP ranges and classifications.
 * In production, this would be fed by real threat intelligence feeds.
 */
const THREAT_INTEL = {
  // RFC 5737 — Documentation ranges (often used in examples/tests)
  documentation: ['192.0.2.', '198.51.100.', '203.0.113.'],
  // Common Tor exit node prefixes (sample — not exhaustive)
  torExitNodes: ['185.220.100.', '185.220.101.', '185.220.102.', '104.244.76.', '104.244.77.', '23.129.64.'],
  // Known scanner/botnet prefixes
  scanners: ['71.6.135.', '71.6.146.', '71.6.158.', '80.82.77.', '93.174.95.', '141.98.10.', '141.98.11.'],
  // Cloud provider ranges (not malicious, but notable)
  cloudProviders: {
    'aws': ['3.', '13.', '18.', '34.', '35.', '52.', '54.'],
    'gcp': ['34.', '35.', '104.196.', '104.197.', '130.211.'],
    'azure': ['13.64.', '13.65.', '13.66.', '20.', '40.'],
    'digitalocean': ['67.205.', '68.183.', '134.122.', '137.184.', '142.93.', '143.198.', '144.126.', '157.245.', '159.65.', '161.35.', '164.90.', '164.92.', '165.22.', '165.227.', '167.71.', '167.172.', '174.138.', '178.62.', '178.128.', '188.166.', '192.241.', '198.199.', '206.189.', '209.97.'],
  },
  // Private/internal ranges
  privateRanges: ['10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.', '127.'],
};

/**
 * Geo-location hints by first octet range (simplified — real systems use MaxMind).
 */
const GEO_HINTS = {
  '1-60': 'North America / APAC',
  '61-126': 'APAC / Oceania',
  '128-170': 'Europe / North America',
  '171-191': 'Latin America / Europe',
  '192-223': 'Global (various)',
};

/**
 * Enrich a single IP address with threat intelligence.
 * @param {string} ip
 * @returns {{ ip: string, reputation: string, score: number, tags: string[], geo: string, details: string }}
 */
export function enrichIP(ip) {
  const tags = [];
  let reputation = 'clean';
  let score = 0; // 0 = clean, 100 = definitely malicious
  let details = '';

  // Check private ranges
  if (THREAT_INTEL.privateRanges.some((r) => ip.startsWith(r))) {
    tags.push('internal');
    reputation = 'internal';
    score = 5;
    details = 'Private/internal network address — not routable on the public internet.';
    return { ip, reputation, score, tags, geo: 'Internal Network', details };
  }

  // Check documentation ranges
  if (THREAT_INTEL.documentation.some((r) => ip.startsWith(r))) {
    tags.push('documentation-range', 'suspicious');
    reputation = 'suspicious';
    score = 60;
    details = 'RFC 5737 documentation range — often used in examples/attacks to avoid attribution.';
  }

  // Check Tor exit nodes
  if (THREAT_INTEL.torExitNodes.some((r) => ip.startsWith(r))) {
    tags.push('tor-exit-node', 'anonymization');
    reputation = 'malicious';
    score = Math.max(score, 85);
    details += ' Known Tor exit node prefix — traffic is anonymized, high risk for abuse.';
  }

  // Check known scanners
  if (THREAT_INTEL.scanners.some((r) => ip.startsWith(r))) {
    tags.push('known-scanner', 'reconnaissance');
    reputation = 'malicious';
    score = Math.max(score, 90);
    details += ' Known internet scanner/botnet — actively probes targets.';
  }

  // Check cloud providers
  for (const [provider, prefixes] of Object.entries(THREAT_INTEL.cloudProviders)) {
    if (prefixes.some((r) => ip.startsWith(r))) {
      tags.push(`cloud:${provider}`);
      if (score < 30) {
        score = Math.max(score, 20);
        details += ` Hosted on ${provider.toUpperCase()} cloud infrastructure.`;
      }
      break;
    }
  }

  // Default: unknown
  if (tags.length === 0) {
    reputation = 'unknown';
    score = 15;
    details = 'No threat intelligence match — unknown reputation.';
  }

  // Geo hint
  const firstOctet = parseInt(ip.split('.')[0], 10);
  let geo = 'Unknown';
  if (firstOctet >= 1 && firstOctet <= 60) geo = 'North America / APAC';
  else if (firstOctet >= 61 && firstOctet <= 126) geo = 'APAC / Oceania';
  else if (firstOctet >= 128 && firstOctet <= 170) geo = 'Europe / North America';
  else if (firstOctet >= 171 && firstOctet <= 191) geo = 'Latin America / Europe';
  else if (firstOctet >= 192 && firstOctet <= 223) geo = 'Global (various)';

  return { ip, reputation, score, tags, geo, details: details.trim() };
}

/**
 * Enrich multiple IPs and return a summary report.
 * @param {string[]} ips
 * @returns {{ enriched: Array, summary: { total: number, malicious: number, suspicious: number, clean: number } }}
 */
export function enrichIPs(ips) {
  const unique = [...new Set(ips)].filter(Boolean);
  const enriched = unique.map(enrichIP);

  const summary = {
    total: enriched.length,
    malicious: enriched.filter((e) => e.reputation === 'malicious').length,
    suspicious: enriched.filter((e) => e.reputation === 'suspicious').length,
    clean: enriched.filter((e) => e.reputation === 'clean' || e.reputation === 'unknown').length,
    internal: enriched.filter((e) => e.reputation === 'internal').length,
  };

  return { enriched, summary };
}
