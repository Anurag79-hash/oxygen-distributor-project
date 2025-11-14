document.addEventListener('DOMContentLoaded', () => {
  const ordersTable = document.getElementById("ordersTable");
  const searchInput = document.getElementById('search');
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let currentPage = 1;
  const limit = 10;
  let totalPages = 1;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  async function loadOrders(page = 1, search = '') {
    try {
      const res = await fetch(`/admin/api/purchases?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to load orders');
      
      const data = await res.json();
      totalPages = data.pages;
      currentPage = data.page;
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      ordersTable.innerHTML = '';

      // Filter orders
      const activeOrders = data.purchases.filter(o => {
       const isReturn = o.type === 'return';
const blankReturned = Number(o.blankCylindersReturned) || 0;

const adminDone = ['sent', 'confirmed'].includes(
  o.adminStatus.toLowerCase()
);

const supplierDone = ['sent', 'confirmed'].includes(
  o.supplierStatus.toLowerCase()
);

// PURCHASE HIDE logic
if (!isReturn && adminDone && supplierDone) {
  return false;
}

// RETURN HIDE logic (only hide when fully finished)
if (isReturn && adminDone && supplierDone) {
  return false;
}

return true;

      });

      if (!activeOrders.length) {
        ordersTable.innerHTML = `<tr><td colspan="9" style="text-align:center;">No active orders</td></tr>`;
        return;
      }

      activeOrders.forEach(p => {
        const isPurchase = p.type === 'purchase';
        const isReturnOnly = p.type === 'return' && Number(p.blankCylindersReturned) > 0 
                             && !(p.adminStatus.toLowerCase() === 'sent' && p.supplierStatus.toLowerCase() === 'confirmed');

        const challanInput = isPurchase
          ? `<input type="text" id="challan_${p._id}" placeholder="Challan No" value="${p.challanNo || ''}" style="width:100px;">`
          : '';

        const ecrInput = isReturnOnly
          ? `<input type="text" id="ecr_${p._id}" placeholder="ECR No" value="${p.ecrNo || ''}" style="width:100px;">`
          : '';

        const saveBtn = (isPurchase || isReturnOnly)
          ? `<button onclick="saveChallanECR('${p._id}')">💾 Save</button>`
          : '';

        const actionButtons = p.adminStatus.toLowerCase() === 'pending'
          ? `<button onclick="markSent('${p._id}')">Mark Sent</button>`
          : (p.adminStatus.toLowerCase() === 'sent' && p.supplierStatus.toLowerCase() === 'pending' && isReturnOnly)
            ? `<input type="number" id="confirm_${p._id}" placeholder="Returned" min="0" style="width:70px;">
               <button onclick="confirmReturn('${p._id}')">Confirm</button>`
            : '-';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${p.orderId}</td>
          <td>${p.supplierName}</td>
          <td>${p.gasType || '-'}</td>
          <td>${p.subcategory || '-'}</td>
          <td>${p.cylinders}</td>
          <td>${p.blankCylindersReturned}</td>
          <td>${p.adminStatus}${p.adminConfirmedAt ? `<br><small>${formatDate(p.adminConfirmedAt)}</small>` : ''}</td>
          <td>${p.supplierStatus}${p.supplierConfirmedAt ? `<br><small>${formatDate(p.supplierConfirmedAt)}</small>` : ''}</td>
          <td>
            ${challanInput} ${ecrInput} ${saveBtn} ${actionButtons}
          </td>
        `;
        ordersTable.appendChild(row);
      });

    } catch (err) {
      console.error(err);
      ordersTable.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;">Error loading orders</td></tr>`;
    }
  }

  // Pagination
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) loadOrders(currentPage - 1, searchInput.value.trim());
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) loadOrders(currentPage + 1, searchInput.value.trim());
  });

  // Search with debounce
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadOrders(1, searchInput.value.trim());
    }, 400);
  });

  // Mark purchase as sent
  window.markSent = async (id) => {
    await fetch(`/admin/purchase/send/${id}`, { method: 'POST' });
    loadOrders(currentPage, searchInput.value);
  };

  // Confirm return
  window.confirmReturn = async (id) => {
    const count = Number(document.getElementById(`confirm_${id}`)?.value || 0);
    const res = await fetch(`/admin/purchase/confirmReturn/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedReturn: count })
    });
    const data = await res.json();
    alert(data.message || 'Return confirmed!');
    loadOrders(currentPage, searchInput.value);
  };

  // Save Challan/ECR
  window.saveChallanECR = async (id) => {
    const challan = document.getElementById(`challan_${id}`)?.value?.trim();
    const ecr = document.getElementById(`ecr_${id}`)?.value?.trim();

    if (!challan && !ecr) {
      alert('Please enter Challan or ECR to save.');
      return;
    }

    const res = await fetch(`/admin/purchase/updateChallanECR/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challanNo: challan, ecrNo: ecr })
    });
    const data = await res.json();
    alert(data.message || 'Updated!');
    loadOrders(currentPage, searchInput.value);
  };

  // Initial load
  loadOrders();
});
