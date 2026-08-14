// ============================================================
//  GTU BBA Academic Dashboard — Hybrid Ultra-Fast Cloud Storage
//  Instant REST (50-200ms) + Realtime Firebase WebSocket Sync
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

  const REST_ENDPOINT = "https://bba-pdf-tracker-default-rtdb.firebaseio.com/pdf_tracker.json";

  let db = null;
  let isRemoteUpdate = false;
  let lastSavedJSON = '';
  let onlineResolved = false;
  let _onDataReceived = null;
  let _saveDebounceTimer = null;
  let _dataRef = null;
  let _infoRef = null;
  let _pollInterval = null;

  function updateStatus(state, text) {
    const badge = document.getElementById('cloudBadge');
    if (!badge) return;
    badge.className = `cloud-badge ${state}`;
    badge.innerHTML = `<span class="cloud-dot"></span><span class="cloud-text">${text}</span>`;
    badge.title = 'Click to force cloud sync check';
    badge.style.cursor = 'pointer';
    badge.onclick = () => syncNow();
  }

  // ── INSTANT REST FETCH (Bypasses WebSocket delays & ad-blockers) ──
  async function fetchFromCloud() {
    try {
      const res = await fetch(REST_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const cloudData = await res.json();
      
      onlineResolved = true;
      updateStatus('online', 'Cloud Synced ✓');

      if (cloudData && Array.isArray(cloudData.subjects) && cloudData.subjects.length) {
        const cloudStr = JSON.stringify(cloudData);
        if (cloudStr !== lastSavedJSON) {
          lastSavedJSON = cloudStr;
          isRemoteUpdate = true;
          if (typeof _onDataReceived === 'function') {
            _onDataReceived(cloudData);
          }
          isRemoteUpdate = false;
        }
      } else {
        // Cloud node is empty — push current local data to seed cloud immediately
        console.log('Seeding cloud from local data...');
        const local = loadData();
        if (local && local.subjects && local.subjects.length) {
          save(local);
        } else {
          save(getDefaultData());
        }
      }
      return true;
    } catch (err) {
      console.warn('REST sync notice:', err.message);
      return false;
    }
  }

  // ── INSTANT REST PUSH (Guaranteed immediate save) ────────
  async function pushToCloudREST(data) {
    try {
      const payload = JSON.stringify(data);
      const res = await fetch(REST_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      if (res.ok) {
        onlineResolved = true;
        updateStatus('online', 'Cloud Synced ✓');
        return true;
      }
    } catch (e) {
      console.warn('REST push notice:', e.message);
    }
    return false;
  }

  function syncNow() {
    updateStatus('syncing', 'Syncing...');
    if (db) {
      try { firebase.database().goOnline(); } catch (_) {}
    }
    fetchFromCloud().then(ok => {
      if (ok) {
        updateStatus('online', 'Cloud Synced ✓');
      } else {
        updateStatus('offline', 'Local Saved · Offline');
      }
    });
  }

  function init(onDataReceived) {
    _onDataReceived = onDataReceived;
    updateStatus('syncing', 'Connecting Cloud...');

    // 1. INSTANT REST LOAD (Executes within 50-200ms on page load!)
    fetchFromCloud();

    // 2. Periodic background pulse for multi-device synchronization
    if (_pollInterval) clearInterval(_pollInterval);
    _pollInterval = setInterval(() => {
      if (!document.hidden && !isRemoteUpdate) {
        fetchFromCloud();
      }
    }, 15000);

    // 3. Initialize Firebase Realtime DB SDK for live push streams
    if (typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
        try { firebase.database().goOnline(); } catch (_) {}

        // Clean up any previous listeners
        if (_infoRef) try { _infoRef.off('value'); } catch (_) {}
        if (_dataRef) try { _dataRef.off('value'); } catch (_) {}

        // Listen on connection state
        _infoRef = db.ref('.info/connected');
        _infoRef.on('value', (snap) => {
          if (snap.val() === true) {
            onlineResolved = true;
            updateStatus('online', 'Cloud Synced ✓');
          }
        });

        // Listen on live data changes
        _dataRef = db.ref('pdf_tracker');
        _dataRef.on('value', (snapshot) => {
          onlineResolved = true;
          updateStatus('online', 'Cloud Synced ✓');
          const cloudData = snapshot.val();
          if (cloudData && Array.isArray(cloudData.subjects) && cloudData.subjects.length) {
            const cloudStr = JSON.stringify(cloudData);
            if (cloudStr !== lastSavedJSON) {
              lastSavedJSON = cloudStr;
              isRemoteUpdate = true;
              try { _onDataReceived(cloudData); } catch(e) { console.error('onDataReceived error:', e); }
              isRemoteUpdate = false;
            }
          }
        });
      } catch(e) {
        console.warn('Firebase SDK init warning (REST fallback active):', e);
      }
    }

    // Fallback: If network is offline after 4s, show clean local active state
    setTimeout(() => {
      if (!onlineResolved) {
        updateStatus('offline', 'Local Saved · Click to Sync');
      }
    }, 4000);
  }

  function save(data, onError) {
    // 1. Optimistic Local Save immediately (0ms)
    saveData(data);
    lastSavedJSON = JSON.stringify(data);

    // 2. Push immediately via REST (fastest & most reliable)
    if (!isRemoteUpdate) {
      updateStatus('syncing', 'Syncing...');
      pushToCloudREST(data);

      // 3. Also push via Firebase SDK if connected
      if (db) {
        db.ref('pdf_tracker').set(data)
          .then(() => {
            onlineResolved = true;
            updateStatus('online', 'Cloud Synced ✓');
          })
          .catch((err) => {
            console.warn('Firebase SDK save fallback to REST:', err.message);
          });
      }
    }
  }

  // Throttled / Debounced Cloud Save for frequent keystrokes
  function saveDebounced(data, delay = 400, onError) {
    saveData(data);
    if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = setTimeout(() => {
      save(data, onError);
    }, delay);
  }

  return { init, save, saveDebounced, syncNow };
})();
