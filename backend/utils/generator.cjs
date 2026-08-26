c.cjs');

/**
 * Memproses data secara lokal untuk menghasilkan config (.hc atau .dark)
 * @param {Object} options
 * @param {Object} [options.template] - Data template dari database
 * @param {string} [options.sshAccount] - Detail SSH (host:port@user:pass)
 * @param {string} [options.uriData] - URL Vless/Vmess/Trojan murni
 * @param {string} [options.appType] - Tipe aplikasi pilihan ("hc" atau "dark")
 * @returns {Promise<{filePath: string, fileName: string}>}
 */
async function generateConfigFile({ template, sshAccount, uriData, appType = "hc" }) {
    // Generate base configName randomly first, and replace it with proper name later
    const tempRandomName = crypto.randomUUID().replace(/-/g, "") + (appType === "dark" ? ".dark" : ".hc");
    let configName = "";
    let finalBufferOrString = null;
    let targetJsonToEncode = null; // Menampung JSON yang akan di-encode ke .hc

    // =========================================================================
    // SKENARIO 1: JIKA INPUT BERUPA URI (V2RAY/XRAY - VMESS, VLESS, TROJAN)
    // =========================================================================
    if (uriData) {
        // 1. DETEKSI PROTOKOL
        let protocol = "V2ray";
        if (uriData.startsWith("trojan://")) protocol = "Trojan";
        else if (uriData.startsWith("vless://")) protocol = "Vless";
        else if (uriData.startsWith("vmess://")) protocol = "Vmess";

        const protoLower = protocol.toLowerCase();

        // 2. DEKLARASI VARIABEL UTAMA
        let remark = "Account";
        let address = "";
        let port = 443;
        let id = "";
        let pathStr = "/";
        let serverName = "";
        let host = "";
        let transport = "ws";

        // 3. PARSING URI UNTUK MENGAMBIL DATA
        if (protoLower === "vmess") {
            try {
                const base64Part = uriData.replace(/vmess:\/\//i, "").split("#")[0];
                const vmessJson = JSON.parse(Buffer.from(base64Part, 'base64').toString('utf-8'));

                address = vmessJson.add || "";
                port = parseInt(vmessJson.port) || 443;
                id = vmessJson.id || "";
                pathStr = vmessJson.path || "/";
                serverName = vmessJson.sni || address;
                host = vmessJson.host || address;

                if (vmessJson.net && vmessJson.net.toLowerCase() === "grpc") transport = "grpc";
                if (vmessJson.ps) remark = vmessJson.ps;
            } catch (e) {
                console.error("Gagal parsing VMESS URI: " + e.message);
            }
        } else if (protoLower === "vless" || protoLower === "trojan") {
            try {
                const cleanUri = uriData.split("#")[0];
                const urlObj = new URL(cleanUri);

                id = urlObj.username;
                address = urlObj.hostname;
                port = parseInt(urlObj.port) || 443;

                const typeParam = urlObj.searchParams.get("type");
                if (typeParam && typeParam.toLowerCase() === "grpc") transport = "grpc";

                pathStr = urlObj.searchParams.get("path") || urlObj.searchParams.get("serviceName") || "/";
                serverName = urlObj.searchParams.get("sni") || address;
                host = urlObj.searchParams.get("host") || address;

                if (uriData.includes("#")) {
                    remark = decodeURIComponent(uriData.split("#")[1].trim());
                }
            } catch (e) {
                console.error(`Gagal parsing ${protocol} URI: ` + e.message);
            }
        }

        // TEMPLATE INJECTION UNTUK XRAY
        if (template) {
            let bugType = "normal";
            if (template.is_salto) bugType = "salto";
            else if (template.is_wildcard) bugType = "wildcard";

            let templateHost = template.value; // Nilai proxy/bug

            if (templateHost) {
                const originalHost = host || serverName || address || "";

                if (bugType === "salto") {
                    // Mode Salto (SNI Mode): address dan host tetap asli, SNI diganti ke bug
                    address = originalHost;
                    host = originalHost;
                    serverName = templateHost;
                } else {
                    // Mode Normal/WS & Wildcard (Server Mode): address diganti bug
                    address = templateHost;

                    if (bugType === "wildcard") {
                        host = `${templateHost}.${originalHost}`;
                    } else {
                        host = originalHost;
                    }
                }

                // Aturan Khusus Port 80
                if (String(port) === "80") {
                    serverName = "";
                } else {
                    if (bugType !== "salto") {
                        serverName = host;
                    }
                }
            }

            // Allow applying custom SNI if defined in template and not empty
            if (template.sni && template.sni.trim() !== "") {
                serverName = template.sni;
            }
        }

        // 4. PEMBERSIHAN NAMA (REMARK)
        remark = remark
            .replace(/[\/_\-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!remark) remark = "Account";

        const templateNamePrefix = template && template.label ? template.label.replace(/[^a-zA-Z0-9 \-\.]/g, "").trim().toUpperCase() + " " : "";

        // 5. PEMBUATAN FILE BERDASARKAN APP TYPE
        if (appType === "dark") {
            configName = `${templateNamePrefix}${protocol} ${remark}.dark`;

            // Generate Dark Tunnel Xray Payload
            let finalDarkUri = "";
            if (protoLower === "vmess") {
                const darkVmessObj = {
                    v: "2",
                    ps: remark,
                    add: address,
                    port: String(port),
                    id: id,
                    aid: "0",
                    net: transport,
                    type: "none",
                    host: host,
                    path: pathStr,
                    tls: "tls",
                    sni: serverName,
                    alpn: ""
                };
                finalDarkUri = "vmess://" + Buffer.from(JSON.stringify(darkVmessObj)).toString("base64");
            } else if (protoLower === "vless") {
                const queryParams = new URLSearchParams();
                queryParams.set("type", transport);
                queryParams.set("security", "tls");
                if (transport === "ws") queryParams.set("path", pathStr);
                if (transport === "grpc") queryParams.set("serviceName", pathStr);
                queryParams.set("host", host);
                queryParams.set("sni", serverName);

                finalDarkUri = `vless://${id}@${address}:${port}?${queryParams.toString()}#${encodeURIComponent(remark)}`;
            } else if (protoLower === "trojan") {
                const queryParams = new URLSearchParams();
                queryParams.set("type", transport);
                queryParams.set("security", "tls");
                if (transport === "ws") queryParams.set("path", pathStr);
                if (transport === "grpc") queryParams.set("serviceName", pathStr);
                queryParams.set("host", host);
                queryParams.set("sni", serverName);

                finalDarkUri = `trojan://${id}@${address}:${port}?${queryParams.toString()}#${encodeURIComponent(remark)}`;
            }

            finalBufferOrString = finalDarkUri;
        } else {
            configName = `${templateNamePrefix}${protocol} ${remark}.hc`;

            let v2raySettings = {};
            if (protoLower === "vmess") {
                v2raySettings = {
                    vnext: [{
                        address: address, port: port,
                        users: [{ alterId: 0, id: id, level: 8, security: "auto" }]
                    }]
                };
            } else if (protoLower === "vless") {
                v2raySettings = {
                    vnext: [{
                        address: address, port: port,
                        users: [{ encryption: "none", flow: "", id: id, level: 8 }]
                    }]
                };
            } else if (protoLower === "trojan") {
                v2raySettings = {
                    servers: [{
                        address: address, port: port, password: id, level: 8
                    }]
                };
            }

            let streamSettings = {
                network: transport,
                security: "tls",
                tlsSettings: {
                    allowInsecure: true, serverName: serverName, show: false
                }
            };

            if (transport === "grpc") {
                streamSettings.grpcSettings = { serviceName: pathStr };
            } else {
                streamSettings.wsSettings = { headers: { Host: host }, path: pathStr };
            }

            targetJsonToEncode = {
                "format": "new",
                "uuid": "", // UUID terisi dengan benar
                "config": {
                    "payload": "",
                    "proxy": "",
                    "lockAllConfig": "false",
                    "blockedByRoot": "false",
                    "expiryTime": "lifeTime",
                    "noteEnabled": "true",
				    "notes": "Generated by Config Generator",
                    "sshField": "",
                    "mobileDataAndLockProvider": "false",
                    "unlockUserAndPass": "false",
                    "ovpnConfig": "",
                    "ovpnUserAndPass": "",
                    "sni": "",
                    "unlockUserAndPass2": "true",
                    "psiphon": "",
                    "blockedByHwid": "false",
                    "cloudconfig": "false",
                    "hwid": "",
                    "name": "KEDAI SSH",
                    "blockArea": "false",
                    "connectionMode": "0",
                    "blockedByPassword": "false",
                    "password": "",
                    "extraSniffer": "false",
                    "psiphon2": "[splitPsiphon][splitPsiphon]",
                    "v2rayEnabled": "true",
                    "v2rayConfig": JSON.stringify({
                        inbounds: [],
                        outbounds: [
                            {
                                mux: { enabled: false },
                                protocol: protoLower,
                                settings: v2raySettings,
                                streamSettings: streamSettings,
                                tag: protocol.toUpperCase()
                            }
                        ],
                        policy: {
                            levels: {
                                "8": { connIdle: 300, downlinkOnly: 1, handshake: 4, uplinkOnly: 1 }
                            }
                        }
                    }),
                    "version": "645",
                    "slowdnsEnabled": "false",
                    "slowdnsNameserver": "",
                    "slowdnsKey": "",
                    "slowdnsServer": ""
                },
                "metadata": {
                    "x": true, "y": 1, "z": 1, "aa": false, "isLoginHwid": false,
                    "verApp": 645, "a": false, "c": false, "s": false, "t": false, "u": false, "w": 64
                },
                "protections": {},
                "verCfg": 57
            };
        }
    }
    // =========================================================================
    // SKENARIO 2: JIKA INPUT BERUPA SSH + TEMPLATE DB
    // =========================================================================
    else if (template) {
        let extractedPayload = "";
        let extractedProxy = "";
        let extractedSni = "";
        let extractedEnhanced = false;

        extractedPayload = template.payload || "";
        extractedProxy = template.proxy || "";
        extractedSni = template.sni || "";
        extractedEnhanced = !!template.is_enhanced;

        // Parsing Akun SSH
        let sshHost = "";
        let sshPort = 80;
        let sshUser = "";
        let sshPass = "";

        if (sshAccount) {
            const [serverPart, authPart] = sshAccount.split("@");
            if (serverPart) {
                const parts = serverPart.split(":");
                sshHost = parts[0] || "";
                sshPort = parseInt(parts[1]) || 80;
            }
            if (authPart) {
                const parts = authPart.split(":");
                sshUser = parts[0] || "";
                sshPass = parts[1] || "";
            }
        }

        const isSNIMode = extractedSni && extractedSni.trim() !== "";

        if (isSNIMode) {
            sshPort = 443;
        } else {
            sshPort = 80;
        }

        const formattedSshField = `${sshHost}:${sshPort}@${sshUser}:${sshPass}`;
        const rawTitle = template.label || "SSHConfig";
        const username = sshUser || "User";

        if (appType === "dark") {
            configName = `${rawTitle}_${username}.dark`;

            let proxyHost = "";
            let proxyPort = sshPort;
            if (extractedProxy) {
                if (extractedProxy.includes(":")) {
                    const parts = extractedProxy.split(":");
                    proxyHost = parts[0];
                    proxyPort = parseInt(parts[1]) || 80;
                } else {
                    proxyHost = extractedProxy;
                    proxyPort = isSNIMode ? 443 : 80;
                }
            }

            let injectMode = "PROXY";
            if (isSNIMode) {
                injectMode = (!extractedPayload || extractedPayload.trim() === "") ? "DIRECT_SNI" : "PROXY_SNI";
            }

            let finalPayload = extractedPayload;
            let finalSni = extractedSni || sshHost;
            if (sshHost) {
                finalPayload = finalPayload.replace(/\[host\]/gi, sshHost);
                finalSni = finalSni.replace(/\[host\]/gi, sshHost);
            }

            const darkJson = {
                type: "SSH",
                name: `${rawTitle} `,
                sshTunnelConfig: {
                    sshConfig: { host: sshHost, port: sshPort, username: sshUser, password: sshPass },
                    injectConfig: {
                        mode: injectMode,
                        proxyHost: proxyHost,
                        proxyPort: proxyPort,
                        payload: finalPayload,
                        ...( (injectMode === "DIRECT_SNI" || injectMode === "PROXY_SNI") && { serverNameIndication: finalSni } ),
                        ...( injectMode === "PROXY" && (extractedEnhanced === true || extractedEnhanced === "true") && { payloadEnhanced: true } )
                    }
                }
            };

            finalBufferOrString = `darktunnel://${Buffer.from(JSON.stringify(darkJson)).toString("base64")}`;
        } else {
            configName = `${rawTitle}_${username}.hc`;

            const hasPayload = extractedPayload && extractedPayload.trim() !== "";
            const hasProxy = extractedProxy && extractedProxy.trim() !== "";
            const hasSni = extractedSni && extractedSni.trim() !== "";

            let connectionMode = "1";
            if (hasPayload && hasProxy && hasSni) {
                connectionMode = "3";
            } else if (!hasPayload && !hasProxy && hasSni) {
                connectionMode = "2";
            } else if (hasPayload && hasProxy && !hasSni) {
                connectionMode = "1";
            }

            targetJsonToEncode = {
                "format": "new",
                "uuid": "", // UUID terisi dengan benar
                "config": {
                    "payload": extractedPayload || "",
                    "proxy": extractedProxy || "",
                    "lockAllConfig": "false",
                    "blockedByRoot": "false",
                    "expiryTime": "lifeTime",
                    "noteEnabled": "true",
                    "notes": "Generated by Config Generator",
                    "sshField": formattedSshField,
                    "mobileDataAndLockProvider": "false",
                    "unlockUserAndPass": "false",
                    "ovpnConfig": "",
                    "ovpnUserAndPass": "",
                    "sni": extractedSni || "",
                    "unlockUserAndPass2": "true",
                    "psiphon": "",
                    "blockedByHwid": "false",
                    "cloudconfig": "false",
                    "hwid": "",
                    "name": "KEDAI SSH",
                    "blockArea": "false",
                    "connectionMode": connectionMode || "1",
                    "blockedByPassword": "false",
                    "password": "",
                    "extraSniffer": "false",
                    "psiphon2": "[splitPsiphon][splitPsiphon]",
                    "v2rayEnabled": "false",
                    "v2rayConfig": "",
                    "version": "645",
                    "slowdnsEnabled": "false",
                    "slowdnsNameserver": "",
                    "slowdnsKey": "",
                    "slowdnsServer": ""
                },
                "metadata": {
                    "x": true, "y": 1, "z": 1,
                    "aa": (extractedEnhanced === true || extractedEnhanced === "true") ? true : false,
                    "isLoginHwid": false, "verApp": 645, "a": false, "c": false, "s": false, "t": false, "u": false, "w": 64
                },
                "protections": {},
                "verCfg": 57
            };
        }
    } else {
        throw new Error("Skenario pembuatan config tidak valid.");
    }

    // SANITASI DAN PENYUSUNAN NAMA FILE
    configName = configName.replace(/_/g, " ");
    configName = configName.replace(/[^a-zA-Z0-9 \-\.]/g, "");

    const fileExt = path.extname(configName);
    const fileNameWithoutExt = path.basename(configName, fileExt);
    configName = fileNameWithoutExt.trim().toUpperCase() + fileExt.toLowerCase();

    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Gunakan tempRandomName untuk menulis agar tidak bentrok dengan concurrent request
    const localFilePath = path.join(tmpDir, tempRandomName);

    // PROSES EKSEKUSI ENCODER YANG SAMA PERSIS DENGAN ver7
    if (appType !== "dark" && targetJsonToEncode) {
        const encodeResult = await encode_hc_file(targetJsonToEncode, localFilePath);

        if (encodeResult && !fs.existsSync(localFilePath)) {
            fs.writeFileSync(localFilePath, encodeResult);
        }

        if (!fs.existsSync(localFilePath)) {
            throw new Error("Gagal menyimpan file .hc dari encoder.");
        }
    } else {
        // Mode .dark
        fs.writeFileSync(localFilePath, finalBufferOrString);
    }

    console.log(`[SUKSES LOKAL] Berhasil memproses berkas config secara offline -> ${configName}`);
    return { filePath: localFilePath, fileName: configName };
}

module.exports = { generateConfigFile };
