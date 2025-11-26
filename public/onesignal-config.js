window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "bf91095e-0266-40c4-9e9f-5faa720b263d",
    serviceWorkerPath: '/OneSignalSDKWorker.js',
    serviceWorkerParam: { scope: '/' },
    allowLocalhostAsSecureOrigin: true
  });
});
