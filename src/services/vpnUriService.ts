import yaml from 'js-yaml';

// Type definitions for clarity
export interface VpnConfig {
  ps?: string;
  add: string;
  port: string | number;
  id: string;
  net?: string;
  path?: string;
  host?: string;
  tls?: string;
  sni?: string;
  aid?: string;
}

export interface BugHost {
    id: number;
    label: string;
    value: string;
    is_wildcard: boolean | 0 | 1;
    is_salto: boolean | 0 | 1;
}

// --- Core Logic from Bot Script ---

export function parseVMess(uri: string): VpnConfig {
  const payload = uri.replace('vmess://', '');
  // Use browser-native atob instead of Buffer
  const decoded = atob(payload);
  return JSON.parse(decoded);
}

export function parseVlessTrojan(uri: string): VpnConfig {
  const u = new URL(uri);
  return {
    ps: u.hash ? decodeURIComponent(u.hash.slice(1)) : '',
    add: u.hostname,
    port: u.port,
    id: u.username,
    net: u.searchParams.get('type') || 'tcp',
    path: u.searchParams.get('path') || '',
    host: u.searchParams.get('host') || '',
    tls: u.searchParams.get('security') || '',
    sni: u.searchParams.get('sni') || ''
  };
}

export function generateYAML(type: 'vmess' | 'vless' | 'trojan', cfg: VpnConfig): string {
  let proxy: any = {
    name: cfg.ps || 'Unnamed',
    server: cfg.add,
    port: parseInt(String(cfg.port), 10),
    type,
  };

  if (type === 'vmess') {
    Object.assign(proxy, {
      uuid: cfg.id,
      alterId: cfg.aid ? parseInt(cfg.aid) : 0,
      cipher: 'auto',
      tls: cfg.tls === 'tls',
      'skip-cert-verify': true,
      servername: cfg.sni || cfg.host || cfg.add,
      network: cfg.net || 'tcp',
      udp: true,
    });
    if (cfg.net === 'ws') {
      proxy['ws-opts'] = {
        path: cfg.path || '/',
        headers: { Host: cfg.host || cfg.add }
      };
    }
  } else if (type === 'vless' || type === 'trojan') {
    Object.assign(proxy, {
      uuid: type === 'vless' ? cfg.id : undefined,
      password: type === 'trojan' ? cfg.id : undefined,
      tls: cfg.tls === 'tls',
      'skip-cert-verify': true,
      servername: cfg.sni || cfg.host || cfg.add,
      network: cfg.net || 'tcp',
      udp: true,
    });
    if (cfg.net === 'ws') {
      proxy['ws-opts'] = {
        path: cfg.path || '/',
        headers: { Host: cfg.host || cfg.add }
      };
    }
  }

  return yaml.dump({ proxies: [proxy] }, { lineWidth: -1 });
}

export function injectBug(cfg: VpnConfig, bug: BugHost): VpnConfig {
  const originalDomain = cfg.host || cfg.sni || cfg.add;
  const bugValue = bug.value;

  if (bug.is_salto) {
    return {
      ...cfg,
      host: bugValue,
      sni: bugValue,
    };
  }

  if (bug.is_wildcard) {
    const wildcardHost = `${bugValue}.${originalDomain}`;
    return {
      ...cfg,
      add: bugValue,
      host: wildcardHost,
      sni: (cfg.port === '443' || cfg.port === 443) ? wildcardHost : (cfg.sni || ''),
    };
  }

  // For non-wildcard, only change the address. Host and SNI remain original.
  return { ...cfg, add: bugValue };
}

export function generateURI(type: 'vmess' | 'vless' | 'trojan', cfg: VpnConfig): string {
    if (type === 'vmess') {
        // Use browser-native btoa instead of Buffer
        return 'vmess://' + btoa(JSON.stringify(cfg));
    }
    // For VLESS and Trojan
    const userinfo = cfg.id;
    const hostinfo = `${cfg.add}:${cfg.port}`;
    const params = new URLSearchParams({
        type: cfg.net || 'tcp',
        path: cfg.path || '',
        host: cfg.host || '',
        security: cfg.tls || '',
        sni: cfg.sni || '',
    });
    const hash = encodeURIComponent(cfg.ps || '');
    return `${type}://${userinfo}@${hostinfo}?${params.toString()}#${hash}`;
}
