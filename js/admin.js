// =============================================
// EARNNOVA BETA - Admin Panel
// =============================================

async function loadAdminData() {
  try {
    const usersSnap = await usersRef.get();
    const wdSnap = await withdrawalsRef.where('status', '==', 'pending').get();
    const adsSnap = await adsRef.get();
    
    document.getElementById('adminUsers').textContent = usersSnap.size;
    document.getElementById('adminWD').textContent = wdSnap.size;
    document.getElementById('adminAds').textContent = adsSnap.size;
    
    let totalBal = 0;
    usersSnap.forEach(doc => { totalBal += doc.data().balance || 0; });
    document.getElementById('adminBalance').textContent = '$' + totalBal.toFixed(2);
  } catch (e) {
    console.error('Admin data error:', e);
  }
}

async function loadAdminUsers() {
  try {
    const snapshot = await usersRef.orderBy('createdAt', 'desc').get();
    const tbody = document.getElementById('adminUsersBody');
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--text-muted)">No users</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const u = doc.data();
      const status = u.isActive !== false ? 'Active' : 'Disabled';
      const color = u.isActive !== false ? 'var(--green)' : 'var(--red)';
      tbody.innerHTML += `<tr><td>${u.name||'N/A'}</td><td>${u.email||'N/A'}</td><td>$${(u.balance||0).toFixed(2)}</td><td style="color:${color}">${status}</td></tr>`;
    });
  } catch (e) {
    console.error('Admin users error:', e);
  }
}

async function loadAdminWithdrawals() {
  try {
    const snapshot = await withdrawalsRef.orderBy('createdAt', 'desc').get();
    const tbody = document.getElementById('adminWDBody');
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-muted)">No withdrawals</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const w = doc.data();
      const statusColor = w.status === 'pending' ? 'var(--orange)' : w.status === 'completed' ? 'var(--green)' : 'var(--red)';
      tbody.innerHTML += `<tr>
        <td>${w.userName||w.userEmail||'N/A'}</td>
        <td>${w.method||'N/A'}</td>
        <td>$${(w.amount||0).toFixed(2)}</td>
        <td style="color:${statusColor}">${w.status||'pending'}</td>
        <td>
          ${w.status === 'pending' ? `<button class="btn btn-sm" style="background:var(--green);color:white" onclick="approveWD('${doc.id}')">✓</button><button class="btn btn-sm" style="background:var(--red);color:white" onclick="rejectWD('${doc.id}')">✕</button>` : '-'}
        </td>
      </tr>`;
    });
  } catch (e) {
    console.error('Admin withdrawals error:', e);
  }
}

async function approveWD(id) {
  if (!confirm('Approve this withdrawal?')) return;
  try {
    await withdrawalsRef.doc(id).update({ status: 'completed' });
    showToast('Withdrawal approved ✅');
    loadAdminWithdrawals();
  } catch (e) { showAlert('Error: ' + e.message); }
}

async function rejectWD(id) {
  if (!confirm('Reject this withdrawal? Balance will be refunded.')) return;
  try {
    const doc = await withdrawalsRef.doc(id).get();
    const w = doc.data();
    await usersRef.doc(w.userId).update({ balance: firebase.firestore.FieldValue.increment(w.amount) });
    await withdrawalsRef.doc(id).update({ status: 'rejected' });
    showToast('Withdrawal rejected, refunded');
    loadAdminWithdrawals();
  } catch (e) { showAlert('Error: ' + e.message); }
}

async function loadAdminAds() {
  try {
    const snapshot = await adsRef.orderBy('createdAt', 'desc').get();
    const tbody = document.getElementById('adminAdsBody');
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-muted)">No ads</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const ad = doc.data();
      tbody.innerHTML += `<tr>
        <td>${ad.title||'N/A'}</td>
        <td>$${(ad.reward||0).toFixed(2)}</td>
        <td>${ad.duration||5}s</td>
        <td style="color:${ad.isActive!==false?'var(--green)':'var(--red)'}">${ad.isActive!==false?'Active':'Inactive'}</td>
        <td><button class="btn btn-sm" style="background:var(--red);color:white" onclick="deleteAd('${doc.id}')">🗑</button></td>
      </tr>`;
    });
  } catch (e) {
    console.error('Admin ads error:', e);
  }
}

async function deleteAd(id) {
  if (!confirm('Delete this ad?')) return;
  try {
    await adsRef.doc(id).delete();
    showToast('Ad deleted');
    loadAdminAds();
  } catch (e) { showAlert('Error: ' + e.message); }
}

// Add ad
document.getElementById('addAdBtn').addEventListener('click', () => {
  const title = prompt('Ad title:');
  if (!title) return;
  const reward = parseFloat(prompt('Reward ($):', '0.05'));
  const duration = parseInt(prompt('Duration (seconds):', '5'));
  
  adsRef.add({
    title, reward: reward || 0.05, duration: duration || 5,
    isActive: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    showToast('Ad created ✅');
    loadAdminAds();
  }).catch(e => showAlert('Error: ' + e.message));
});

// Admin notification form
document.getElementById('adminNotifForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('notifTitle').value.trim();
  const message = document.getElementById('notifMessage').value.trim();
  
  try {
    await notificationsRef.add({
      title, message, type: 'general',
      userId: 'all',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Notification sent to all users! 📬');
    document.getElementById('notifTitle').value = '';
    document.getElementById('notifMessage').value = '';
  } catch (err) {
    showAlert('Error: ' + err.message);
  }
});
