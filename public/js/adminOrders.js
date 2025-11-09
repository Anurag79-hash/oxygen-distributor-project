document.addEventListener('DOMContentLoaded', () => {
  const ordersTable = document.getElementById("ordersTable");
  const searchInput = document.getElementById('search');
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let currentPage = 1;
  const limit = 10;
  let totalPages = 1;

  // ✅ helper for nice date formatting
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  async function loadOrders(page = 1, search = '') {
    const res = await fetch(`/admin/api/purchases?page=${page}&limit=${limit}&search=${search}`);

    if (!res.ok) {
      const text = await res.text();
      console.error('Server response:', text);
      alert('Error loading orders or session expired.');
      return;
    }

    const data = await res.json();
    totalPages = data.pages;
    currentPage = data.page;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    ordersTable.innerHTML = '';
  const activeOrders = data.purchases.filter(o => !(o.adminStatus === 'sent' && o.supplierStatus === "confirmed"));

    activeOrders.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.orderId}</td>
        <td>${p.supplierName}</td>
        <td>${p.cylinders}</td>
        <td>${p.blankCylindersReturned}</td>
        
        <td>
          ${p.adminStatus}
          ${p.adminConfirmedAt ? `<br><small>${formatDate(p.adminConfirmedAt)}</small>` : ''}
        </td>
        
        <td>
          ${p.supplierStatus}
          ${p.supplierConfirmedAt ? `<br><small>${formatDate(p.supplierConfirmedAt)}</small>` : ''}
        </td>
        
        <td>
          ${p.adminStatus === 'pending'
            ? `<button onclick="markSent('${p._id}')">Mark Sent</button>`
            : '-'}
        </td>
      `;
      ordersTable.appendChild(row);
    });
  }

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) loadOrders(currentPage - 1, searchInput.value);
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) loadOrders(currentPage + 1, searchInput.value);
  });

  searchInput.addEventListener('input', () => {
    loadOrders(1, searchInput.value);
  });

  window.markSent = async (id) => {
    await fetch(`/admin/purchase/send/${id}`, { method: 'POST' });
    loadOrders(currentPage, searchInput.value);
  };

  loadOrders();
});
