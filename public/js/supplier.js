    const form = document.getElementById('purchaseForm');
    const returnForm = document.getElementById('returnForm');
    const msg = document.getElementById('msg');
    const myOrders = document.getElementById('myOrder');
    const orderTable=document.getElementById("orderTable");
    const navPurchase = document.getElementById('navPurchase');
    const navReturn = document.getElementById('navReturn');
    const summeryContainer=document.getElementById("summaryContainer");
  
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
      form.classList.add('uform');
      orderTable.style.display='none';
      returnForm.style.display = 'none';
      summeryContainer.style.display='none';
      msg.textContent = '';
    });

    navReturn.addEventListener('click', () => {
      navReturn.classList.add('active');
      navPurchase.classList.remove('active');
      returnForm.style.display = 'block';
      form.style.display = 'none';
      summeryContainer.style.display='none';
      orderTable.style.display='none';
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
        msg.textContent = "Error submitting Order";
        msg.style.color='red';
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
function updateSummary(orders) {
  let totalOrdered = 0;
  let totalReturned = 0;

  orders.forEach(o => {
    if((o.supplierStatus==="confirmed"||o.supplierStatus==="sent")&& o.adminStatus==="sent"){
    totalOrdered += o.cylinders || 0;
    totalReturned += o.blankCylindersReturned || 0;}
  });

  document.getElementById("totalOrdered").innerText = totalOrdered;
  document.getElementById("totalReturned").innerText = totalReturned;
  document.getElementById("currentPresent").innerText = totalOrdered - totalReturned;
}
function calculateCategorySummary(orders) {
  const map = {};

  orders.forEach(o => {
    const key = `${o.gasType}_${o.subcategory}`;

    if (!map[key]) {
      map[key] = {
        gasType: o.gasType,
        subcategory: o.subcategory,
        ordered: 0,
        returned: 0
      };
    }

    map[key].ordered += o.cylinders || 0;
    map[key].returned += o.blankCylindersReturned || 0;
  });

  return Object.values(map);
}
function showStatusTable(orders) {
  const status = calculateCategorySummary(orders);
  const tbody = document.getElementById("statusBody");

  tbody.innerHTML = "";
  
  status.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.gasType}</td>
      <td>${item.subcategory}</td>
      <td>${item.ordered}</td>
      <td>${item.returned}</td>
      <td>${item.ordered - item.returned}</td>
    `;
    tbody.appendChild(tr);

    
  });

  document.getElementById("statusModal").style.display = "flex";
}

    // Load all orders
    async function loadOrders() {
      const res = await fetch('/supplier/myOrders');
      const orders = await res.json();
      myOrders.innerHTML = '';
      updateSummary(orders);
       document.getElementById("viewStatusBtn").onclick = () => {
        if(orders[0].adminStatus==="sent"){
        showStatusTable(orders);}
        else{
          alert("Something(Order/Return) is Pending");
        }
  };
        if (!orders.length) {
    myOrders.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:10px;">
          📭 No orders found. Start by placing your first order!
        </td>
      </tr>
    `;
    return;
  }
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
              ? `
                 <button class="confirm-btn" data-id="${o._id}">Confirm Received</button>`
              : '-'}
          </td>
          <td>
        <button class="download-order-btn" data-order='${JSON.stringify(o)}'>⬇</button>
      </td>`;
        myOrders.appendChild(row);
      });
    }
  //  <input type="number" id="return_${o._id}" placeholder="Blank Cylinders" min="0"></input>
    //  Handle Confirm buttons dynamically
    myOrders.addEventListener('click', async e => {
      if (e.target.classList.contains('confirm-btn')) {
        const id = e.target.dataset.id;
        // const returned = document.getElementById(`return_${id}`).value || 0;
        const returned=0;
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
    ["Cylinders Order", order.cylinders],
    ["Blank Cylinders Returned", order.blankCylindersReturned],
    ["ECR No.",order.ecrNo||'-'],
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
document.getElementById("closeStatusModal").onclick = () => {
  document.getElementById("statusModal").style.display = "none";
};

window.onclick = event => {
  if (event.target === document.getElementById("statusModal")) {
    document.getElementById("statusModal").style.display = "none";
  }
};
