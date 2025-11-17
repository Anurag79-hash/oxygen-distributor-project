console.log("Admin Dashboard Loaded");

let currentPage = 1;
let totalPages = 1;
const limit = 5;
window.history.forward();

const supplierTable = document.getElementById('supplierTable');
const pageInfo = document.getElementById("pageInfo");
const searchInput = document.getElementById("search");
const detailContainer = document.createElement('div');
detailContainer.id = 'supplierDetail';
document.querySelector(".dashboard-container").appendChild(detailContainer);

// ✅ Load suppliers
async function loadSuppliers(page = 1, search = '') {
  try {
    const res = await fetch(`/admin/api/suppliers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    const data = await res.json();

    totalPages = data.pages;
    currentPage = data.page;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    supplierTable.innerHTML = '';

    if (data.suppliers.length === 0) {
      supplierTable.innerHTML = `<tr><td colspan="7">No suppliers found</td></tr>`;
      return;
    }

    // ✅ Calculate totals for summary
    let totalPurchased = 0;
    let totalReturned = 0;
    let currentCylinders = 0;

    data.suppliers.forEach(s => {
      totalPurchased += Number(s.totalPurchased) || 0;
      totalReturned += Number(s.totalReturned) || 0;
      currentCylinders += Number(s.currentCylinders) || 0;
    });

    // ✅ Update summary HTML
    const summaryContainer = document.getElementById('summary');
    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <p>Total Ordered Cylinders: ${totalPurchased}</p>
        <p>Total Empty Cylinders Returned: ${totalReturned}</p>
        <p>Current Cylinders: ${currentCylinders}</p>
      `;
    }

    // ✅ Populate table
    data.suppliers.forEach(s => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="#" class="supplier-link" data-id="${s._id}">${s.name}</a></td>
        <td>${s.email}</td>
        <td><a href="tel:${s.phone}">${s.phone}</a></td>
        <td>${s.totalPurchased || 0}</td>
        <td>${s.totalReturned || 0}</td>
        <td>${s.currentCylinders || 0}</td>
        <td><button class="edit-supplier-btn" data-id="${s._id}">✏️ Edit</button></td>
      `;
      supplierTable.appendChild(row);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

// ✅ Pagination
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentPage > 1) loadSuppliers(currentPage - 1, searchInput.value.trim());
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentPage < totalPages) loadSuppliers(currentPage + 1, searchInput.value.trim());
});

// ✅ Search with debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadSuppliers(1, searchInput.value.trim());
  }, 400);
});

// ✅ Handle clicks (supplier links, edit, PDF downloads)
document.body.addEventListener('click', async (e) => {
  if (e.target.classList.contains('supplier-link')) {
    e.preventDefault();
    const supplierId = e.target.dataset.id;
    await loadSupplierDetail(supplierId);
  }

  if (e.target.classList.contains('download-receipt-btn')) {
    const receipt = JSON.parse(e.target.dataset.receipt);
    generateReceiptPDF(receipt);
  }

  if (e.target.classList.contains('download-btn')) {
    const order = JSON.parse(e.target.dataset.order);
    generatePDF(order);
  }

  if (e.target.classList.contains('edit-supplier-btn')) {
    const supplierId = e.target.dataset.id;
    await openEditForm(supplierId);
  }
});

// ✅ Open edit supplier form
async function openEditForm(supplierId) {
  try {
    const res = await fetch(`/admin/api/supplierDetail/${supplierId}`);
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Failed to load supplier details");
      return;
    }
    const s = data.supplier;
    detailContainer.innerHTML = `
      <hr>
      <h3>Edit Supplier: ${s.name}</h3>
      <form id="editSupplierForm">
        <input type="hidden" name="id" value="${s._id}">
        <label>Name:</label><input type="text" name="name" value="${s.name}" required><br>
        <label>Email:</label><input type="email" name="email" value="${s.email}" required><br>
        <label>Phone:</label><input type="text" name="phone" value="${s.phone}" required><br>
        <label>Address:</label><input type="text" name="address" value="${s.address || ''}"><br>
        <label>New Password (optional):</label><input type="password" name="password" placeholder="Enter new password"><br>
        <button type="submit">💾 Update</button>
        <button type="button" id="deleteSupplierBtn" data-id="${s._id}" style="background:red;color:white;">🗑️ Delete</button>
      </form>
    `;

    document.getElementById('editSupplierForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const formData = new FormData(ev.target);
      const supplierData = Object.fromEntries(formData.entries());

      const updateRes = await fetch(`/admin/api/updateSupplier/${supplierData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });
      const result = await updateRes.json();
      alert(result.message || 'Supplier updated');
      loadSuppliers(currentPage);
    });

    document.getElementById('deleteSupplierBtn').addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this supplier?')) return;
      const delRes = await fetch(`/admin/api/deleteSupplier/${s._id}`, { method: 'DELETE' });
      const result = await delRes.json();
      alert(result.message || 'Supplier deleted');
      detailContainer.innerHTML = '';
      loadSuppliers(currentPage);
    });

  } catch (err) {
    console.error(err);
    alert("Error opening edit form");
  }
}

// ✅ Load supplier detail with purchases and receipt
async function loadSupplierDetail(supplierId) {
  detailContainer.innerHTML = "<p>Loading details...</p>";
  try {
    const res = await fetch(`/admin/api/supplierDetail/${supplierId}`);
    const data = await res.json();
    if (!res.ok) {
      detailContainer.innerHTML = `<p style="color:red;">${data.message || 'Error loading details'}</p>`;
      return;
    }

    const supplier = data.supplier;
    const receipt = data.receipt;
    const purchases = data.purchases;

    detailContainer.innerHTML = `
      <hr>
      <h3>Supplier: ${supplier.name}</h3>
      <p><b>Email:</b> ${supplier.email}</p>
      ${receipt ? `
        <h4>Receipt Summary</h4>
        <ul>
          <li>Total Cylinders Ordered: ${receipt.totalCylindersPurchased}</li>
          <li>Total Cylinders Returned: ${receipt.totalCylindersReturned}</li>
          <li>Current Cylinders: ${receipt.currentCylinders}</li>
          <li>Last Updated: ${new Date(receipt.lastUpdated).toLocaleString('en-IN')}</li>
          <li>Address: ${supplier.address || '-'}</li>
        </ul>
        <button class="download-receipt-btn" data-receipt='${JSON.stringify({
      supplierName: supplier.name,
      supplierEmail: supplier.email,
      totalPurchased: receipt.totalCylindersPurchased,
      totalReturned: receipt.totalCylindersReturned,
      current: receipt.currentCylinders,
      lastUpdated: receipt.lastUpdated,
      address: supplier.address
    })}'>📄 Download Receipt</button>
      ` : `<p>No receipt data available.</p>`}

      <h4>Orders & Return History</h4>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Challan No.</th>
            <th>ECR No.</th>
            <th>GasType</th>
            <th>Subcategory</th>
            <th>Cylinders</th>
            <th>Returned</th>
            <th>Admin Status</th>
            <th>Supplier Status</th>
            <th>Created</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          ${purchases.length
            ? purchases.map(p => `
              <tr>
                <td>${p.orderId}</td>
                <td>${p.challanNo || '-'}</td>
                <td>${p.ecrNo || '-'}</td>
                <td>${p.gasType || '-'}</td>
                <td>${p.subcategory}</td>
                <td>${p.cylinders}</td>
                <td>${p.blankCylindersReturned}</td>
                <td>${p.adminStatus}</td>
                <td>${p.supplierStatus}</td>
                <td>${new Date(p.createdAt).toLocaleString('en-IN')}</td>
                <td><button class="download-btn" data-order='${JSON.stringify(p)}'>📄 Download</button></td>
              </tr>`).join('')
            : '<tr><td colspan="11">No purchases yet.</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    detailContainer.innerHTML = "<p style='color:red;'>Error loading supplier details.</p>";
  }
}

// ✅ Generate purchase PDF
function generatePDF(order) {
  const { jsPDF } = window.jspdf || window.jspPDF || {};
  if (!jsPDF) {
    alert("jsPDF missing");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // 🔹 Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MURARI AIR PRODUCT", 200, 40);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(14);
  doc.text("COMPANY CYLINDER A/C", 210, 60);

  // 🔹 Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Cylinder Orders & Return Details", 140, 100);

  // 🔹 Fields in table
  const fields = [
    ["Order ID", order.orderId],
    ["Challan No", order.challanNo || "-"],
    ["ECR No", order.ecrNo || "-"],
    ["Gas Type", order.gasType || "-"],
    ["Subcategory", order.subcategory || "-"],
    ["Cylinders Order", order.cylinders],
    ["Empty Cylinders Returned", order.blankCylindersReturned],
    ["Admin Status", order.adminStatus],
    ["Supplier Status", order.supplierStatus],
    ["Created Date", new Date(order.createdAt).toLocaleString("en-IN")]
  ];

  // Table Layout
  const startX = 60;
  const startY = 130;
  const labelW = 200;
  const valueW = 300;
  const h = 25;

  // Header Row
  doc.setFont("helvetica", "bold");
  doc.rect(startX, startY, labelW + valueW, h);
  doc.text("Field", startX + 10, startY + 17);
  doc.text("Value", startX + labelW + 10, startY + 17);

  // Rows
  doc.setFont("helvetica", "normal");
  fields.forEach(([label, value], i) => {
    const y = startY + (i + 1) * h;

    doc.rect(startX, y, labelW, h);
    doc.rect(startX + labelW, y, valueW, h);

    doc.text(label, startX + 10, y + 17);
    doc.text(String(value), startX + labelW + 10, y + 17);
  });

  doc.save(`Order_${order.orderId}.pdf`);
}


// ✅ Generate receipt PDF
function generateReceiptPDF(receipt) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Supplier Receipt Summary", 150, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  let y = 100;
  const lineGap = 25;
  const fields = [
    ["Supplier Name", receipt.supplierName],
    ["Supplier Email", receipt.supplierEmail],
    ["Total Cylinders Ordered", receipt.totalPurchased],
    ["Total Blank Cylinders Returned", receipt.totalReturned],
    ["Current Cylinders", receipt.current],
    ["Last Updated", new Date(receipt.lastUpdated).toLocaleString('en-IN')],
    ["Address", receipt.address],
  ];

  fields.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 50, y);
    y += lineGap;
  });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(40, 70, 500, y - 70);
  doc.save(`Receipt_${receipt.supplierName}.pdf`);
}

// ✅ Initial load
loadSuppliers();
