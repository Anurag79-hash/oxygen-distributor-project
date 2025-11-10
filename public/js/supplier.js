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

    // ✅ Purchase form submit
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cylinders = document.getElementById('cylinders').value;
      try {
        const res = await fetch('/supplier/purchase', {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ cylinders })
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
      try {
        const res = await fetch('/supplier/return', {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ blankCylinders })
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Oxygen Cylinder Order Details", 150, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  let y = 100;
  const lineGap = 25;

  const fields = [
    ["Order ID", order.orderId],
    ["Cylinders Purchased", order.cylinders],
    ["Cylinders Returned", order.blankCylindersReturned],
    ["Admin Status", order.adminStatus],
    ["Supplier Status", order.supplierStatus],
    ["Created Date", new Date(order.createdAt).toLocaleString('en-IN')],
  ];

  fields.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 50, y);
    y += lineGap;
  });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(40, 70, 500, y - 70);

  doc.save(`Order_${order.orderId}.pdf`);
}

    loadOrders();