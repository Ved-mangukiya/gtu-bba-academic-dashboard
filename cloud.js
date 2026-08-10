// ============================================================
//  GTU BBA PDF Tracker — Cloud Storage (Firebase Realtime DB)
// ============================================================

const Cloud = (() => {
  // Config extracted from your Firebase console setup
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
  let isConnected = false;
  let isRemoteUpdate = false; // prevents infinite loop during sync

  function init(onDataReceived) {
    try {
      if (typeof firebase === 'undefined') {
        updateStatus('offline', 'Local Only');
        return;
      }

      firebase.initializeApp(firebaseConfig);
      db = firebase.database();

      // Monitor connection state
      const connectedRef = db.ref(".info/connected");
      connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
          isConnected = true;
          updateStatus('online', 'Cloud Connected');
        } else {
          isConnected = false;
          updateStatus('syncing', 'Connecting...');
        }
      });

      // Realtime listener for data changes
      db.ref('pdf_tracker').on('value', (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData && cloudData.subjects) {
          isRemoteUpdate = true;
          onDataReceived(cloudData);
          isRemoteUpdate = false;
          updateStatus('online', 'Cloud Synced');
        } else {
          // Database is empty (first launch) -> Push default seed data
          save(loadData() || getDefaultData());
        }
      }, (error) => {
        console.error('Firebase read error:', error);
        updateStatus('offline', 'Read Error (Check Rules)');
      });

    } catch (e) {
      console.error('Firebase init error:', e);
      updateStatus('offline', 'Local Only');
    }
  }

  function save(data) {
    // Save to LocalStorage always as instant cache
    saveData(data);

    // Save to Firebase Cloud if connected and not responding to incoming sync
    if (db && !isRemoteUpdate) {
      updateStatus('syncing', 'Syncing...');
      db.ref('pdf_tracker').set(data)
        .then(() => {
          updateStatus('online', 'Cloud Synced');
        })
        .catch((err) => {
          console.error('Firebase save error:', err);
          updateStatus('offline', 'Sync Error');
        });
    }
  }

  function updateStatus(state, text) {
    const badge = document.getElementById('cloudBadge');
    if (!badge) return;
    badge.className = `cloud-badge ${state}`;
    badge.innerHTML = `<span class="cloud-dot"></span> <span class="cloud-text">${text}</span>`;
  }

  return {
    init,
    save
  };
})();
