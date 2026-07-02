// =============================================
// EARNNOVA — Admin Panel
// =============================================

async function adminLoadUsers() {
  var container = document.getElementById('adminUsersList');
  if (!container || !db) return;
  
  container.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.2)">Loading...</div>';
  
  try {
    var snap = await fbTimeout(usersRef.orderBy('createdAt', 'desc').limit(50).get());
    container.innerHTML = '';
    
    snap.forEach(function(doc) {
      var data = doc.data();
      var date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      container.innerHTML +=
        '<div class="glass-card-sm" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-size:13px;font-weight:600">' + (data.name || 'Unknown') + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.3)">' + (data.email || '') + ' • $' + (data.balance || 0).toFixed(2) + '</div></div>' +
          '<div style="display:flex;gap:6px">' +
            (data.isAdmin ? '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(16,185,129,0.12);color:#10B981">ADMIN</span>' : '') +
            '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4)">' + (data.adsWatched || 0) + ' ads</span>' +
          '</div>' +
        '</div>';
    });
    
    if (snap.empty) container.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.2)">No users found</div>';
  } catch(e) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:#EF4444;font-size:13px">Error loading users: ' + e.message + '</div>';
  }
}

async function adminLoadWithdrawals() {
  var container = document.getElementById('adminWithdrawalsList');
  if (!container || !db) return;
  
  container.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.2)">Loading...</div>';
  
  try {
    var snap = await fbTimeout(withdrawalsRef.orderBy('createdAt', 'desc').limit(50).get());
    container.innerHTML = '';
    
    snap.forEach(function(doc) {
      var data = doc.data();
      var date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      var statusColor = data.status === 'approved' ? '#10B981' : data.status === 'rejected' ? '#EF4444' : '#F59E0B';
      
      container.innerHTML +=
        '<div class="glass-card-sm" style="margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div><div style="font-size:13px;font-weight:600">$' + (data.amount || 0).toFixed(2) + ' via ' + (data.method || '?') + '</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.3)">' + date.toLocaleDateString() + '</div></div>' +
            '<span style="font-size:11px;font-weight:600;color:' + statusColor + '">' + (data.status || 'pending').toUpperCase() + '</span>' +
          '</div>' +
          (data.adminNote ? '<div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.04)">Note: ' + data.adminNote + '</div>' : '') +
        '</div>';
    });
    
    if (snap.empty) container.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.2)">No withdrawals yet</div>';
  } catch(e) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:#EF4444;font-size:13px">Error: ' + e.message + '</div>';
  }
}

// Tab switch with data loading
var _adminTabSwitch = function(tab) {
  switch(tab) {
    case 'users': adminLoadUsers(); break;
    case 'withdrawals': adminLoadWithdrawals(); break;
  }
};

// Override adminSwitchTab to load data
var origSwitch = adminSwitchTab;
adminSwitchTab = function(tab) {
  if (origSwitch) origSwitch(tab);
  _adminTabSwitch(tab);
};
