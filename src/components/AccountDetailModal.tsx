           </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    (account.protocol === 'vmess' ? account.vmess_tls_link :
                     account.protocol === 'vless' ? account.vless_tls_link :
                     account.trojan_tls_link) || '',
                    'TLS URL'
                  )}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Non-TLS URL */}
          {((account.protocol === 'vmess' && account.vmess_nontls_link) ||
            (account.protocol === 'vless' && account.vless_nontls_link) ||
            (account.protocol === 'trojan' && account.trojan_nontls_link1)) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Non-TLS URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.protocol === 'vmess' ? account.vmess_nontls_link :
                   account.protocol === 'vless' ? account.vless_nontls_link :
                   account.trojan_nontls_link1}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    (account.protocol === 'vmess' ? account.vmess_nontls_link :
                     account.protocol === 'vless' ? account.vless_nontls_link :
                     account.trojan_nontls_link1) || '',
                    'Non-TLS URL'
                  )}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Trojan GO URL */}
          {(account.protocol === 'trojan' && account.trojan_go_link) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Trojan GO URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.trojan_go_link}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.trojan_go_link || '', 'Trojan GO URL')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* GRPC URL */}
          {((account.protocol === 'vmess' && account.vmess_grpc_link) ||
            (account.protocol === 'vless' && account.vless_grpc_link) ||
            (account.protocol === 'trojan' && account.trojan_grpc_link)) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">GRPC URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.protocol === 'vmess' ? account.vmess_grpc_link :
                   account.protocol === 'vless' ? account.vless_grpc_link :
                   account.trojan_grpc_link}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    (account.protocol === 'vmess' ? account.vmess_grpc_link :
                     account.protocol === 'vless' ? account.vless_grpc_link :
                     account.trojan_grpc_link) || '',
                    'GRPC URL'
                  )}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStatusBox = () => {
    if (account.protocol === 'zivpn') return null;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Live Status
            </div>
            {statusError && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAccountStatus}
                disabled={isLoadingStatus}
                className="h-8"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                Cek Ulang
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStatus ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Menghubungi VPS Server...</span>
            </div>
          ) : statusError ? (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center justify-between">
              <span>{statusError}</span>
            </div>
          ) : accountStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary opacity-80" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status Akun</p>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      {accountStatus.status_account === 'UNLOCKED' ? (
                        <span className="text-green-600 dark:text-green-400">UNLOCKED</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">LOCKED</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {['vmess', 'vless', 'trojan'].includes(account.protocol) && accountStatus.quota_limit_gb && (
                <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-8 h-8 text-blue-500 opacity-80" />
                    <div className="w-full min-w-[150px]">
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pemakaian Kuota</p>
                        <p className="text-xs font-bold">{accountStatus.quota_used_formatted} / {accountStatus.quota_limit_gb}GB</p>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        {(() => {
                          // Extract numbers from "XX.XXMB" or "XX.XXGB" and convert to GB safely
                          const usedStr = accountStatus.quota_used_formatted || "0MB";
                          const isGB = usedStr.toUpperCase().includes("GB");
                          const numStr = usedStr.replace(/[^0-9.]/g, '');
                          const usedNum = parseFloat(numStr) || 0;

                          let usedGB = usedNum;
                          if (!isGB && usedStr.toUpperCase().includes("MB")) {
                            usedGB = usedNum / 1024;
                          } else if (!isGB && usedStr.toUpperCase().includes("KB")) {
                            usedGB = usedNum / (1024 * 1024);
                          } else if (!isGB && usedStr.toUpperCase().includes("B")) {
                            usedGB = usedNum / (1024 * 1024 * 1024);
                          }

                          const limitGB = parseFloat(accountStatus.quota_limit_gb) || 1;
                          const percentage = Math.min((usedGB / limitGB) * 100, 100);

                          let colorClass = "bg-green-500";
                          if (percentage > 90) colorClass = "bg-red-500";
                          else if (percentage > 70) colorClass = "bg-yellow-500";

                          return (
                            <div
                              className={`h-full ${colorClass} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
              Menunggu pembaruan status...
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderZivpnDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="w-5 h-5" />
          Detail Akun ZiVPN/SOCKSIP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {account.password && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">PW/username zivpn/SocksIP</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium font-mono">{account.password}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.password!, 'PW ZIVPN/SocksIP/username SocksIP')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        {account.zivpn_link && (
          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground">ZiVPN Link</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                {account.zivpn_link}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(account.zivpn_link!, 'ZiVPN Link')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${protocolConfig.bgColor}`}>
                <protocolConfig.icon className={`w-5 h-5 ${protocolConfig.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>Detail Akun: {account.username}</span>
                  <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                    {account.status === 'active' ? 'Aktif' : 'Kedaluwarsa'}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Balance Display */}
            <BalanceDisplay refreshTrigger={balanceRefreshTrigger} />

            {/* Live Status VPS */}
            {renderStatusBox()}

            {/* Server Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Informasi Server
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nama Server</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium">{account.server_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(account.server_name, 'Nama server')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {account.protocol === 'zivpn' && account.ip_server && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">IP Server SocksIP</label>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium font-mono">{account.ip_server}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(account.ip_server!, 'IP Server SocksIP')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Domain</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium">{account.server_domain}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(account.server_domain, 'Domain')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lokasi</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{account.server_location}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Protokol</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={`${protocolConfig.color} ${protocolConfig.borderColor}`}>
                        {protocolConfig.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protocol-specific Details */}
            {account.protocol === 'ssh' && renderSSHDetails()}
            {account.protocol === 'zivpn' && renderZivpnDetails()}
            {['vmess', 'vless', 'trojan'].includes(account.protocol) && renderV2RayDetails()}

            {/* General Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Informasi Umum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IP Limit</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span>{account.ip_limit} perangkat</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quota</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span>{account.quota} GB</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kedaluwarsa</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{account.expired_date}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span>{new Date(account.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4 flex-wrap">
              <Button onClick={downloadConfig} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Konfigurasi
              </Button>
              <Button 
                onClick={() => setIsRenewDialogOpen(true)} 
                variant="default"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Perpanjang Akun
              </Button>
              <Button 
                onClick={() => setIsDeleteDialogOpen(true)} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Akun
              </Button>
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Account Dialog */}
      <RenewAccountDialog
        account={account}
        isOpen={isRenewDialogOpen}
        onClose={() => setIsRenewDialogOpen(false)}
        onConfirm={handleRenewAccount}
        isLoading={isRenewLoading}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        account={account}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleteLoading}
      />
    </>
  );
};

export default AccountDetailModal;
