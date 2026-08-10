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
  let lastSavedJSON = '';

  let connectionTimeout = null;

  function init(onDataReceived) {
    try {
      if (typeof firebase === 'undefined') {
        updateStatus('offline', 'Local Mode');
        return;
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();

      // Set a fallback timer: If Firebase doesn't connect within 3.5 seconds, fallback to Local Cache
      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          updateStatus('offline', 'Local Cache');
        }
      }, 3500);

      // Monitor connection state
      const connectedRef = db.ref(".info/connected");
      connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
          isConnected = true;
          if (connectionTimeout) clearTimeout(connectionTimeout);
          updateStatus('online', 'Cloud Connected');
        } else {
          isConnected = false;
          if (!connectionTimeout) {
            updateStatus('offline', 'Local Cache');
          }
        }
      });

      // Realtime listener for data changes
      db.ref('pdf_tracker').on('value', (snapshot) => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        const cloudData = snapshot.val();
        if (cloudData && cloudData.subjects) {
          const cloudStr = JSON.stringify(cloudData);
          // If the cloud update is an echo of our own recent local save, suppress re-rendering
          if (cloudStr === lastSavedJSON) {
            updateStatus('online', 'Cloud Synced');
            return;
          }
          lastSavedJSON = cloudStr;
          isRemoteUpdate = true;
          onDataReceived(cloudData);
          isRemoteUpdate = false;
          updateStatus('online', 'Cloud Synced');
        } else {
          // Database is empty (first launch) -> Push default seed data
          save(loadData() || getDefaultData());
        }
      }, (error) => {
        console.warn('Firebase read notice:', error);
        if (connectionTimeout) clearTimeout(connectionTimeout);
        updateStatus('offline', 'Local Cache');
      });

    } catch (e) {
      console.warn('Firebase init notice:', e);
      if (connectionTimeout) clearTimeout(connectionTimeout);
      updateStatus('offline', 'Local Mode');
    }
  }

  function save(data) {
    // Save to LocalStorage always as instant cache
    saveData(data);
    lastSavedJSON = JSON.stringify(data);

    // Save to Firebase Cloud if connected and not responding to incoming sync
    if (db && !isRemoteUpdate) {
      const saveTimer = setTimeout(() => {
        updateStatus('online', 'Synced (Local)');
      }, 2000);

      db.ref('pdf_tracker').set(data)
        .then(() => {
          clearTimeout(saveTimer);
          updateStatus('online', 'Cloud Synced');
        })
        .catch((err) => {
          clearTimeout(saveTimer);
          console.warn('Firebase save notice:', err);
          updateStatus('online', 'Synced (Local)');
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
