   window.open(result.paymentUrl, '_blank');
        } else {
          throw new Error('Respons tidak valid dari server.');
        }
      } else {
        throw new Error(result.message || 'Gagal membuat pembayaran.');
      }
    } catch (error: any) {
      console.error('Topup error:', error);
      toast.error(error.message || 'Gagal membuat pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeGateway = paymentConfig?.gateway || 'TRIPAY';

  return (
    <>
      <QrCodeModal
        isOpen={modalFlow === 'QRIS'}
        onClose={() => { setModalFlow(null); stopPolling(); }}
        qrCodeUrl={modalData.qrCodeUrl || ''}
        reference={modalData.reference || ''}
        amountGross={modalData.amountGross || 0}
        amountNet={modalData.amountNet || 0}
      />
      <VirtualAccountModal
        isOpen={modalFlow === 'VA'}
        onClose={() => { setModalFlow(null); stopPolling(); }}
        paymentName={modalData.paymentName || ''}
        payCode={modalData.payCode || ''}
        amountGross={modalData.amountGross || 0}
        amountNet={modalData.amountNet || 0}
        reference={modalData.reference || ''}
        instructions={modalData.instructions || []}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Topup Saldo</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Isi saldo akun Anda untuk membuat akun VPN</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Pilih Nominal Topup</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">Pilih nominal atau masukkan jumlah custom</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-white">Nominal Cepat</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {PRESET_AMOUNTS.map((preset) => {
                          const isSelected = selectedAmount === preset.value && !customAmount;
                          return (
                            <Button
                              key={preset.value}
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => handleAmountSelect(preset.value)}
                              className={`h-12 relative overflow-hidden transition-all duration-300 ${
                                isSelected
                                  ? ''
                                  : 'dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:border-green-500/50 dark:hover:text-white bg-white'
                              }`}
                            >
                              {/* Green splash effect for unselected dark mode items */}
                              {!isSelected && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 blur-xl rounded-full -mr-4 -mt-4 dark:block hidden pointer-events-none"></div>
                              )}
                              {preset.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="custom-amount" className="text-gray-900 dark:text-white">Jumlah Custom (min. Rp 10.000)</Label>
                      <Input id="custom-amount" placeholder="Masukkan jumlah..." value={customAmount} onChange={(e) => handleCustomAmountChange(e.target.value)} className="mt-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
                    </div>

                    <Separator className="bg-gray-200 dark:bg-gray-600" />

                    {/* Render UI based on Active Gateway */}
                    {activeGateway === 'TRIPAY' ? (
                        <>
                            <div>
                            <Label className="text-sm font-medium text-gray-900 dark:text-white">Metode Pembayaran</Label>
                            <div className="grid gap-3 mt-2">
                                {PAYMENT_METHODS.map((method) => (
                                <div key={method.id} className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-300 ${selectedPaymentMethod === method.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 ring-2 ring-blue-500/20 shadow-md' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 hover:bg-blue-25 dark:hover:bg-gray-600 hover:shadow-sm'}`} onClick={() => setSelectedPaymentMethod(method.id)}>
                                    <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <method.icon className={`h-6 w-6 ${selectedPaymentMethod === method.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                        <div>
                                        <div className={`font-medium ${selectedPaymentMethod === method.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>{method.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{method.description}</div>
                                        </div>
                                    </div>
                                    {selectedPaymentMethod === method.id && <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full"><Check className="h-4 w-4 text-white" /></div>}
                                    </div>
                                </div>
                                ))}
                            </div>
                            </div>
                        </>
                    ) : (
                        /* MIDTRANS UI */
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                             <div className="flex items-center space-x-3">
                                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <div>
                                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Pembayaran Otomatis via Midtrans</h3>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">Pilih metode pembayaran (QRIS, E-Wallet, VA, dll) setelah klik tombol bayar.</p>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Phone number input is shown if Tripay method needs it OR if Gateway is Midtrans (always require phone for Snap) */}
                    {(activeGateway === 'MIDTRANS' || PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.requiresPhone) && (
                      <div>
                        <Label htmlFor="phone-number" className="text-gray-900 dark:text-white">Nomor Telepon <span className="text-red-500">*</span></Label>
                        <Input id="phone-number" placeholder="08xxxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: 08xxxxxxxxxx atau 62xxxxxxxxxx (Diperlukan untuk konfirmasi)</p>
                      </div>
                    )}


                    <Separator className="bg-gray-200 dark:bg-gray-600" />
                    {selectedAmount > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium text-gray-900 dark:text-white">Total Topup:</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{formatRupiah(selectedAmount)}</span>
                        </div>
                        <div className={`flex items-start space-x-3 mb-4 p-3 rounded-lg transition-all duration-300 ${isShaking ? 'animate-shake' : ''} ${showAgreementError && !isAgreed ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                          <Checkbox
                            id="terms"
                            checked={isAgreed}
                            onCheckedChange={(checked) => {
                              setIsAgreed(checked === true);
                              if (checked) setShowAgreementError(false);
                            }}
                            className={`mt-1 ${showAgreementError && !isAgreed ? 'border-red-500' : ''}`}
                          />
                          <div className="space-y-1 leading-none">
                            <Label
                              htmlFor="terms"
                              className={`text-sm font-medium leading-relaxed cursor-pointer ${showAgreementError && !isAgreed ? 'text-red-500' : 'text-gray-900 dark:text-gray-300'}`}
                            >
                              Saldo website tidak dapat di cairkan kembali menjadi saldo e-wallet/bank dengan alasan apapun. Silahkan ceklis kolom ini jika anda setuju
                            </Label>
                          </div>
                        </div>
                        <Button onClick={handleTopup} disabled={isProcessing} className="w-full" size="lg">{isProcessing ? 'Memproses...' : 'Lanjut Pembayaran'}</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div><TopupHistory /></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Topup;
