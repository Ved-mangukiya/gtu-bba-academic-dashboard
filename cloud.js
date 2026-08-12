// ============================================================
//  GTU BBA Academic Dashboard — Cloud Storage (Firebase Realtime DB)
//  Multi-Device Realtime Cloud Synchronization (GitHub Pages Ready)
// ============================================================

const Cloud = (() => {
  const firebaseConfig = {
    apiKey: "AIzaSyDoQ2zJyE8p4-E712XyF6ewS2EIHw3jhL0",
    authDomain: "bba-pdf-tracker.firebaseapp.com",
    databaseURL: "https://bba-pdf-tracker-default-rtdb.firebaseio.com",
    projectId: "bba-pdf-tracker",
    storageBucket: "bba-pdf-tracker.firebasestorage.app",
    messagingSenderId: "485672952698",
    appId: "1:485672952698:web:12adcdaf389ba75c72acc3"
  };

  let db = null;
  let isRemoteUpdate = false;
  let lastSavedJSON = '';
  let onlineResolved = false;
  let _onDataReceived = null;

  function updateStatus(state, text) {
    const badge = document.getElementById('cloudBadge');
    if (!badge) return;
    badge.className = `cloud-badge ${state}`;
    badge.innerHTML = `<span class="cloud-dot"></span><span class="cloud-text">${text}</span>`;
  }

  function init(onDataReceived) {
    _onDataReceived = onDataReceived;
    updateStatus('syncing', 'Connecting...');

    // If Firebase SDK isn't loaded, go offline immediately
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded');
      updateStatus('offline', 'Offline Mode');
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
    } catch(e) {
      console.error('Firebase init failed:', e);
      updateStatus('offline', 'Offline Mode');
      return;
    }

    // ── Monitor connection state ──────────────────────────
    try {
      db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
          if (!onlineResolved) {
            onlineResolved = true;
          }
          updateStatus('online', 'Cloud Synced ✓');
        } else if (onlineResolved) {
          updateStatus('offline', 'Reconnecting...');
        }
      });
    } catch(e) {
      console.warn('.info/connected listener error:', e);
    }

    // ── Data listener ─────────────────────────────────────
    try {
      db.ref('pdf_tracker').on('value',
        (snapshot) => {
          // Success — we are definitely online
          onlineResolved = true;
          updateStatus('online', 'Cloud Synced ✓');

          const cloudData = snapshot.val();
          if (cloudData && cloudData.subjects && Array.isArray(cloudData.subjects) && cloudData.subjects.length) {
            const cloudStr = JSON.stringify(cloudData);
            if (cloudStr === lastSavedJSON) return; // no change
            lastSavedJSON = cloudStr;
            isRemoteUpdate = true;
            try { _onDataReceived(cloudData); } catch(e) { console.error('onDataReceived error:', e); }
            isRemoteUpdate = false;
          } else {
            // Cloud node empty — push current local data to seed it
            console.log('Cloud empty, seeding from local data');
            const local = loadData();
            if (local && local.subjects && local.subjects.length) {
              save(local);
            } else {
              save(getDefaultData());
            }
          }
        },
        (error) => {
          // Firebase read error — most likely PERMISSION_DENIED from DB rules
          console.error('Firebase read error:', error.code, error.message);
          if (error.code === 'PERMISSION_DENIED') {
            updateStatus('offline', 'DB Rules: Allow Read/Write');
          } else {
            updateStatus('offline', 'Offline Mode');
          }
        }
      );
    } catch(e) {
      console.error('db.ref listener error:', e);
      updateStatus('offline', 'Offline Mode');
    }

    // ── Fallback: show offline if no response in 10s ──────
    setTimeout(() => {
      if (!onlineResolved) {
        updateStatus('offline', 'Network Timeout — Check Firebase Rules');
        console.warn('Firebase: no response after 10s. Check DB rules at console.firebase.google.com → Realtime Database → Rules. Set: {".read":true,".write":true}');
      }
    }, 10000);
  }

  function save(data) {
    // Always save to localStorage
    saveData(data);
    lastSavedJSON = JSON.stringify(data);

    // Push to Firebase cloud
    if (db && !isRemoteUpdate) {
      updateStatus('syncing', 'Saving...');
      db.ref('pdf_tracker').set(data)
        .then(() => {
          updateStatus('online', 'Cloud Synced ✓');
        })
        .catch((err) => {
          console.error('Firebase save error:', err.code, err.message);
          if (err.code === 'PERMISSION_DENIED') {
            updateStatus('offline', 'DB Rules: Allow Read/Write');
          } else {
            updateStatus('offline', 'Offline Mode');
          }
        });
    }
  }

  return { init, save };
})();
