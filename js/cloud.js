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

  function updateStatus(state, text) {
    const badge = document.getElementById('cloudBadge');
    if (!badge) return;
    badge.className = `cloud-badge ${state}`;
    badge.innerHTML = `<span class="cloud-dot"></span> <span class="cloud-text">${text}</span>`;
  }

  function init(onDataReceived) {
    updateStatus('syncing', 'Connecting...');

    try {
      if (typeof firebase === 'undefined') {
        updateStatus('offline', 'Offline Mode');
        return;
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();

      // ── Realtime data listener ─────────────────────────────
      // This fires immediately when Firebase connects and reads data.
      // If this fires, we ARE online — no need for a separate .info/connected check.
      db.ref('pdf_tracker').on('value', (snapshot) => {
        // Mark online as soon as we get any response from Firebase
        if (!onlineResolved) {
          onlineResolved = true;
          updateStatus('online', 'Cloud Synced ✓');
        }

        const cloudData = snapshot.val();
        if (cloudData && cloudData.subjects) {
          const cloudStr = JSON.stringify(cloudData);
          // Skip if this is identical to what we just saved (prevents echo loop)
          if (cloudStr === lastSavedJSON) return;
          lastSavedJSON = cloudStr;
          isRemoteUpdate = true;
          onDataReceived(cloudData);
          isRemoteUpdate = false;
        } else {
          // Cloud is empty — seed it with local data so other devices get data
          const local = loadData() || getDefaultData();
          save(local);
        }
      }, (error) => {
        console.warn('Firebase listener error:', error.code, error.message);
        updateStatus('offline', 'Offline Mode');
      });

      // ── Connection state monitor (shows reconnecting/offline) ──
      db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
          onlineResolved = true;
          updateStatus('online', 'Cloud Synced ✓');
        } else if (onlineResolved) {
          // Only show offline AFTER we were previously connected
          updateStatus('offline', 'Reconnecting...');
        }
      });

      // ── Fallback timeout: if no response in 8s, show offline ──
      setTimeout(() => {
        if (!onlineResolved) {
          updateStatus('offline', 'Offline — Check Network');
        }
      }, 8000);

    } catch (e) {
      console.warn('Firebase init error:', e);
      updateStatus('offline', 'Offline Mode');
    }
  }

  function save(data) {
    // Always save locally
    saveData(data);
    lastSavedJSON = JSON.stringify(data);

    // Push to Firebase if connected
    if (db && !isRemoteUpdate) {
      updateStatus('syncing', 'Saving...');
      db.ref('pdf_tracker').set(data)
        .then(() => {
          updateStatus('online', 'Cloud Synced ✓');
        })
        .catch((err) => {
          console.warn('Firebase save error:', err);
          updateStatus('offline', 'Offline Mode');
        });
    }
  }

  return { init, save };
})();
