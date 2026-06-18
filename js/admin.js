// =============================================
// EARNNOVA BETA - Admin (Mobile)
// =============================================
// Listen for admin page clicks
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-admin-action]');
  if (!btn) return;
  const action = btn.dataset.adminAction;
  
  switch(action) {
    case 'users': loadAdminUsers(); break;
    case 'withdrawals': loadAdminWithdrawals(); break;
    case 'ads': loadAdminAds(); break;
    case 'notify': showAdminNotifForm(); break;
  }
});

// Admin nav (if nav items exist with data-admin)
document.querySelectorAll('[data-admin]').forEach(item => {
  item.addEventListener('click', function() {
    const page = this.dataset.admin;
    // Handle admin page navigation if needed
  });
});

// ===== LOAD ADMIN STATS =====
// Called from app.js when admin page loads
async function loadAdminData() {
  try {
    const usersSnap = await usersRef.get();
    const wdSnap = await withdrawalsRef.where('status','==','pending').get();
    document.getElementById('adminUsers').textContent = usersSnap.size;
    document.getElementById('adminWD').textContent = wdSnap.size;
    let totalBal = 0;
    usersSnap.forEach(doc => { totalBal += doc.data().balance||0; });
    document.getElementById('adminBalance').textContent = '$' + totalBal.toFixed(2);
  } catch(e) {}
}

// ===== ADMIN USER LIST =====
async function loadAdminUsers() {
  try {
    const snap = await usersRef.orderBy('createdAt','desc').get();
    let msg = '👥 USERS (' + snap.size + '):\n';
    snap.forEach(doc => {
      const u = doc.data();
      msg += `\n${u.name||'?'} | ${u.email||'?'} | $${(u.balance||0).toFixed(2)} | ${u.adsWatched||0} ads`;
    });
    alert(msg);
  } catch(e) { alert('Error loading users'); }
}

// ===== ADMIN WITHDRAWALS =====
async function loadAdminWithdrawals() {
  try {
    const snap = await withdrawalsRef.orderBy('createdAt','desc').get();
    let msg = '💳 WITHDRAWALS:\n';
    snap.forEach(doc => {
      const w = doc.data();
      msg += `\n${w.userName||'?'} | $${(w.amount||0).toFixed(2)} | ${w.method||'?'} | ${w.status||'pending'}`;
    });
    alert(msg);
  } catch(e) { alert('Error loading withdrawals'); }
}

// ===== ADMIN ADS =====
async function loadAdminAds() {
  try {
    const snap = await adsRef.orderBy('createdAt','desc').get();
    let msg = '📺 ADS:\n';
    snap.forEach(doc => {
      const a = doc.data();
      msg += `\n${a.title||'?'} | $${(a.reward||0).toFixed(2)} | ${a.isActive!==false?'✅':'❌'}`;
    });
    msg += '\n\nTap + to add';
    if (confirm(msg + '\n\nAdd new ad?')) {
      const title = prompt('Ad title:');
      if (!title) return;
      const reward = parseFloat(prompt('Reward ($):', '0.05'));
      const duration = parseInt(prompt('Duration (s):', '5'));
      await adsRef.add({
        title, reward: reward||0.05, duration: duration||5,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('Ad created ✅');
    }
  } catch(e) { alert('Error loading ads'); }
}

// ===== ADMIN SEND NOTIFICATION =====
function showAdminNotifForm() {
  const title = prompt('Notification title:');
  if (!title) return;
  const message = prompt('Notification message:');
  if (!message) return;
  
  notificationsRef.add({
    title, message, type: 'general', userId: 'all',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => showToast('Notification sent! 📬'))
    .catch(e => showAlert('Error: ' + e.message));
}
