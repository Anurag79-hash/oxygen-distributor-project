    const form = document.getElementById('purchaseForm');
    const returnForm = document.getElementById('returnForm');
    const msg = document.getElementById('msg');
    const myOrders = document.getElementById('myOrder');

    const navPurchase = document.getElementById('navPurchase');
    const navReturn = document.getElementById('navReturn');
    if(window.history && window.history.pushState){
      window.history.pushState(null,null,window.location.href);
      window.onpopstate=function(){
        window.location.replace('/login');
      }
    }
    // Toggle between purchase and return views
    navPurchase.addEventListener('click', () => {
      navPurchase.classList.add('active');
      navReturn.classList.remove('active');
      form.style.display = 'block';
      returnForm.style.display = 'none';
      msg.textContent = '';
    });

    navReturn.addEventListener('click', () => {
      navReturn.classList.add('active');
      navPurchase.classList.remove('active');
      returnForm.style.display = 'block';
      form.style.display = 'none';
      msg.textContent = '';
    });

    function toggleOtherInput(selectId, inputId, labelId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  select.addEventListener('change', () => {
    if (select.value === 'Other') {
      input.style.display = 'block';
      label.style.display = 'block';
    } else {
      input.style.display = 'none';
      label.style.display = 'none';
      input.value = '';
    }
  });
}
toggleOtherInput('purchaseGasType', 'purchaseManualGas', 'purchaseManualGasLabel');
toggleOtherInput('purchaseSubcategory', 'purchaseManualSub', 'purchaseManualSubLabel');
toggleOtherInput('returnGasType', 'returnManualGas', 'returnManualGasLabel');
toggleOtherInput('returnSubcategory', 'returnManualSub', 'returnManualSubLabel');

    // ✅ Purchase form submit
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cylinders = document.getElementById('cylinders').value;
        let gasType = document.getElementById('purchaseGasType').value;
  let subcategory = document.getElementById('purchaseSubcategory').value;
  if (gasType === 'Other') {
    gasType = document.getElementById('purchaseManualGas').value.trim();
  }
  if (subcategory === 'Other') {
    subcategory = document.getElementById('purchaseManualSub').value.trim();
  }
   if (!gasType || !subcategory) {
    msg.textContent = "Please fill all required fields.";
    return;
  }
      try {
        const res = await fetch('/supplier/purchase', {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ cylinders,gasType , subcategory })
        });
        const data = await res.json();
        msg.textContent = data.message;
        form.reset();
        loadOrders();
      } catch (err) {
        msg.textContent = "Error submitting purchase";
      }
    });
// Handle Download PDF for individual orders
myOrders.addEventListener('click', e => {
  if (e.target.classList.contains('download-order-btn')) {
    const order = JSON.parse(e.target.dataset.order);
    generateOrderPDF(order);
  }
});

    // Return form submit
    returnForm.addEventListener('submit', async e => {
      e.preventDefault();
      const blankCylinders = document.getElementById('blankCylinders').value;
      let gasType = document.getElementById('returnGasType').value;
  let subcategory = document.getElementById('returnSubcategory').value;
  if (gasType === 'Other') {
    gasType = document.getElementById('returnManualGas').value.trim();
  }
  if (subcategory === 'Other') {
    subcategory = document.getElementById('returnManualSub').value.trim();
  }

  if (!gasType || !subcategory) {
    msg.textContent = "Please fill all required fields.";
    return;
  }
      try {
        const res = await fetch('/supplier/return', {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ blankCylinders , gasType,subcategory })
        });
        const data = await res.json();
        msg.textContent = data.message;
        returnForm.reset();
        loadOrders();
      } catch (err) {
        msg.textContent = "Error submitting return";
      }
    });

    // Load all orders
    async function loadOrders() {
      const res = await fetch('/supplier/myOrders');
      const orders = await res.json();
      myOrders.innerHTML = '';

      orders.forEach(o => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${o.orderId}</td>
          <td>${o.gasType}</td>
          <td>${o.subcategory}</td>
          <td>${o.cylinders}</td>
          <td>${o.blankCylindersReturned}</td>
          <td>${o.adminStatus}</td>
          <td>${o.supplierStatus}</td>
          <td>
            ${o.adminStatus === 'sent' && o.supplierStatus === 'pending'
              ? `<input type="number" id="return_${o._id}" placeholder="Blank Cylinders" min="0">
                 <button class="confirm-btn" data-id="${o._id}">Confirm Received</button>`
              : '-'}
          </td>
          <td>
        <button class="download-order-btn" data-order='${JSON.stringify(o)}'>📄 Download</button>
      </td>`;
        myOrders.appendChild(row);
      });
    }

    //  Handle Confirm buttons dynamically
    myOrders.addEventListener('click', async e => {
      if (e.target.classList.contains('confirm-btn')) {
        const id = e.target.dataset.id;
        const returned = document.getElementById(`return_${id}`).value || 0;
        await fetch(`/supplier/confirm/${id}`, {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ blankCylindersReturned: returned })
        });
        loadOrders();
      }
    });
function generateOrderPDF(order) {
  const { jsPDF } = window.jspdf || window.jspPDF || {};
  if (!jsPDF) {
    alert("Error: jsPDF not loaded.");
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
  doc.text(" Cylinder Order Details", 180, 100);

  // 🔹 Table Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const fields = [
    ["Order ID", order.orderId],
    ["Challan No", order.challanNo || '-'],
    ["Gas Type", order.gasType || '-'],
    ["Subcategory", order.subcategory || '-'],
    ["Cylinders Purchased", order.cylinders],
    ["Cylinders Returned", order.blankCylindersReturned],
    ["ECR No.",order.ecrNo],
    ["Admin Status", order.adminStatus],
    ["Supplier Status", order.supplierStatus],
    ["Created Date", new Date(order.createdAt).toLocaleString('en-IN')],
  ];

  // Table dimensions
  const startX = 60;
  const startY = 130;
  const cellWidthLabel = 200;
  const cellWidthValue = 300;
  const cellHeight = 25;

  // Draw table headers (optional)
  doc.setFont("helvetica", "bold");
  doc.rect(startX, startY, cellWidthLabel + cellWidthValue, cellHeight);
  doc.text("Field", startX + 10, startY + 17);
  doc.text("Value", startX + cellWidthLabel + 10, startY + 17);

  // Draw rows
  doc.setFont("helvetica", "normal");
  fields.forEach(([label, value], index) => {
    const y = startY + (index + 1) * cellHeight;
    doc.rect(startX, y, cellWidthLabel, cellHeight);
    doc.rect(startX + cellWidthLabel, y, cellWidthValue, cellHeight);

    doc.text(label, startX + 10, y + 17);
    doc.text(String(value), startX + cellWidthLabel + 10, y + 17);
  });

  // Save file
  doc.save(`Order_${order.orderId}.pdf`);
}


    loadOrders();